import './styles/global.css';
import './styles/scene.css';
import './styles/interface.css';

import { passengers, boardingPool } from './data/passengers';
import { BusScene } from './scene/BusScene';
import { HUD } from './ui/HUD';
import { TransactionPanel } from './ui/TransactionPanel';
import { ResultsPanel } from './ui/ResultsPanel';
import { createInitialGameState } from './game/Game';
import { GameController } from './game/GameController';

const app = document.querySelector<HTMLElement>('#app');
const scene = new BusScene();
const hud = new HUD();
const transactionPanel = new TransactionPanel();
const resultsPanel = new ResultsPanel();

function render(state: ReturnType<GameController['getState']>): void {
  if (!app) return;

  scene.mount(
    app,
    state.passengers,
    state.selectedPassengerId,
    (passenger) => controller.selectPassenger(passenger.id)
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
      },
      () => controller.advanceStop()
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
      (value) => controller.toggleChangeDenomination(value),
      () => controller.giveChangeAndComplete(),
      () => controller.holdChange(),
      (pAId, pBId, noteVal) => controller.marryPassengers(pAId, pBId, noteVal),
      (note, breakdown) => controller.breakNote(note, breakdown),
      (tenderedNotes) => controller.acceptAmountPaid(tenderedNotes),
      () => controller.clearSelectedPassenger(),
      () => controller.clearChangeSelection()
    );
  }

  if (resultsRoot) {
    if (state.isCompleted) {
      resultsPanel.render(resultsRoot, controller.getFinalReconciliation(), () =>
        controller.restartJourney()
      );
    } else {
      resultsRoot.innerHTML = '';
    }
  }
}

const controller = new GameController(
  createInitialGameState(passengers),
  render,
  boardingPool
);

if (app) {
  render(controller.getState());
}
