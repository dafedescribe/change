import './styles/global.css';
import './styles/scene.css';
import './styles/interface.css';

import { BusScene } from './scene/BusScene';
import { HUD } from './ui/HUD';
import { TransactionPanel } from './ui/TransactionPanel';
import { ResultsPanel } from './ui/ResultsPanel';
import { MainMenu } from './ui/MainMenu';
import { HowToPlayModal } from './ui/HowToPlayModal';
import { PauseModal } from './ui/PauseModal';
import { createInitialGameState } from './game/Game';
import { GameController } from './game/GameController';
import { scenarioSystem } from './systems/ScenarioSystem';
import { persistence } from './systems/PersistenceSystem';
import { audioSystem } from './systems/AudioSystem';
import type { JourneyScenario } from './data/scenarios';
import type { PersonalBest } from './systems/PersistenceSystem';

type ScreenView = 'menu' | 'playing' | 'paused' | 'how-to-play';

const app = document.querySelector<HTMLElement>('#app');
const scene = new BusScene();
const hud = new HUD();
const transactionPanel = new TransactionPanel();
const resultsPanel = new ResultsPanel();
const mainMenu = new MainMenu();
const howToPlayModal = new HowToPlayModal();
const pauseModal = new PauseModal();

let currentView: ScreenView = 'menu';
let activeScenario: JourneyScenario = scenarioSystem.getAllScenarios()[0];
let personalBestRecord: { isNewHighScore: boolean; personalBest: PersonalBest } | undefined = undefined;
let isCompletedHandled = false;

let controller: GameController = createControllerForScenario(activeScenario);

function createControllerForScenario(scenario: JourneyScenario): GameController {
  const initialState = createInitialGameState(scenario.passengers, undefined, scenario.startingCash);
  return new GameController(
    initialState,
    (state) => renderGame(state),
    scenario.boardingPool,
    scenario.startingCash
  );
}

function startScenario(scenario: JourneyScenario): void {
  activeScenario = scenario;
  isCompletedHandled = false;
  personalBestRecord = undefined;
  controller = createControllerForScenario(scenario);
  currentView = 'playing';
  audioSystem.playClick();
  renderGame(controller.getState());
}

function restartCurrentScenario(): void {
  isCompletedHandled = false;
  personalBestRecord = undefined;
  controller.restartJourney(
    activeScenario.passengers,
    activeScenario.boardingPool,
    activeScenario.startingCash
  );
  currentView = 'playing';
  audioSystem.playClick();
}

function returnToMainMenu(): void {
  currentView = 'menu';
  isCompletedHandled = false;
  audioSystem.playClick();
  renderApp();
}

function renderApp(): void {
  if (!app) return;

  if (currentView === 'menu') {
    mainMenu.render(app, {
      personalBest: persistence.loadPersonalBest(),
      soundEnabled: audioSystem.isSoundEnabled(),
      selectedScenarioId: activeScenario.id,
      onStartGame: (scenario) => startScenario(scenario),
      onOpenHowToPlay: () => {
        currentView = 'how-to-play';
        renderApp();
      },
      onToggleSound: () => audioSystem.toggleSound(),
    });
    return;
  }

  if (currentView === 'how-to-play') {
    // Render menu as background, then mount modal
    mainMenu.render(app, {
      personalBest: persistence.loadPersonalBest(),
      soundEnabled: audioSystem.isSoundEnabled(),
      selectedScenarioId: activeScenario.id,
      onStartGame: (scenario) => startScenario(scenario),
      onOpenHowToPlay: () => {},
      onToggleSound: () => audioSystem.toggleSound(),
    });

    const modalRoot = document.createElement('div');
    modalRoot.id = 'modal-root';
    app.appendChild(modalRoot);
    howToPlayModal.render(modalRoot, () => {
      currentView = 'menu';
      renderApp();
    });
    return;
  }

  renderGame(controller.getState());
}

function renderGame(state: ReturnType<GameController['getState']>): void {
  if (!app || currentView === 'menu') return;

  scene.mount(
    app,
    state.passengers,
    state.selectedPassengerId,
    (passenger) => {
      audioSystem.playClick();
      controller.selectPassenger(passenger.id);
    }
  );

  const hudRoot = app.querySelector<HTMLElement>('[data-hud]');
  const transactionRoot = app.querySelector<HTMLElement>('[data-transaction]');
  const resultsRoot = app.querySelector<HTMLElement>('[data-results]');

  const selectedPassenger = state.passengers.find(
    ({ id }) => id === state.selectedPassengerId
  );

  const onboardCount = state.passengers.filter((p) => p.status !== 'dropped-off').length;

  if (hudRoot) {
    hud.render(
      hudRoot,
      {
        cash: state.cash,
        stop: state.currentStop,
        stopNumber: state.stopNumber,
        totalStops: state.journey.totalStops,
        isCompleted: state.isCompleted,
        selectedPassenger,
        roadsideExpenses: state.roadsideExpenses,
        passengersOnboard: onboardCount,
        soundEnabled: audioSystem.isSoundEnabled(),
      },
      () => {
        audioSystem.playStopArrival();
        controller.advanceStop();
      },
      () => {
        // Open Pause Menu
        currentView = 'paused';
        const pauseContainer = document.createElement('div');
        pauseContainer.id = 'pause-root';
        app.appendChild(pauseContainer);
        pauseModal.render(pauseContainer, {
          soundEnabled: audioSystem.isSoundEnabled(),
          onResume: () => {
            currentView = 'playing';
            pauseContainer.remove();
          },
          onToggleSound: () => audioSystem.toggleSound(),
          onRestart: () => {
            restartCurrentScenario();
          },
          onMainMenu: () => {
            returnToMainMenu();
          },
        });
      },
      () => audioSystem.toggleSound()
    );
  }

  if (transactionRoot) {
    transactionPanel.render(
      transactionRoot,
      {
        passenger: selectedPassenger,
        cash: state.cash,
        pendingPayment: state.pendingPayment,
        activeTransaction: state.activeTransaction,
        marriageCandidates: controller.getMarriageCandidates(),
        message: state.message,
      },
      (value) => {
        audioSystem.playClick();
        controller.toggleChangeDenomination(value);
      },
      () => {
        const res = controller.giveChangeAndComplete();
        if (res && res.accepted) {
          audioSystem.playChime();
        } else {
          audioSystem.playError();
        }
      },
      () => {
        controller.holdChange();
        audioSystem.playHold();
      },
      (pAId, pBId, noteVal) => {
        const ok = controller.marryPassengers(pAId, pBId, noteVal);
        if (ok) {
          audioSystem.playMarry();
        } else {
          audioSystem.playError();
        }
      },
      (note, breakdown) => {
        const ok = controller.breakNote(note, breakdown);
        if (ok) {
          audioSystem.playBreak();
        } else {
          audioSystem.playError();
        }
      },
      (tenderedNotes) => {
        audioSystem.playCash();
        controller.acceptAmountPaid(tenderedNotes);
      },
      () => {
        audioSystem.playClick();
        controller.clearSelectedPassenger();
      },
      () => {
        audioSystem.playClick();
        controller.clearChangeSelection();
      }
    );
  }

  if (resultsRoot) {
    if (state.isCompleted) {
      if (!isCompletedHandled) {
        isCompletedHandled = true;
        const recon = controller.getFinalReconciliation();
        personalBestRecord = persistence.recordJourney(recon);
        audioSystem.playVictory();
      }

      resultsPanel.render(
        resultsRoot,
        controller.getFinalReconciliation(),
        () => restartCurrentScenario(),
        () => returnToMainMenu(),
        personalBestRecord
      );
    } else {
      resultsRoot.innerHTML = '';
    }
  }
}

// Initial bootstrap
if (app) {
  renderApp();
}
