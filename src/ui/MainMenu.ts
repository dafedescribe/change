import { scenarioSystem } from '../systems/ScenarioSystem';
import type { JourneyScenario } from '../data/scenarios';
import type { PersonalBest } from '../systems/PersistenceSystem';
import { formatNaira } from '../utils/currency';

export class MainMenu {
  render(
    root: HTMLElement,
    options: {
      personalBest: PersonalBest;
      soundEnabled: boolean;
      selectedScenarioId: string;
      onStartGame: (scenario: JourneyScenario) => void;
      onOpenHowToPlay: () => void;
      onToggleSound: () => boolean;
    }
  ): void {
    const scenarios = scenarioSystem.getAllScenarios();
    const pb = options.personalBest;
    const hasPlayed = pb.journeysCompleted > 0;

    root.innerHTML = `
      <section class="main-menu-shell" aria-label="CHANGE Main Menu">
        <div class="menu-hero">
          <div class="menu-badge">LAGOS DANFO SIMULATOR</div>
          <h1 class="game-logo">CHANGE!</h1>
          <p class="menu-tagline">"Enter with your exact change, or face conductor trouble!"</p>
          <div class="route-pill">ROUTE: Oshodi → Yaba → Ojuelegba → Ketu</div>
        </div>

        <div class="menu-grid">
          <div class="menu-card scenario-selector-card">
            <h3>SELECT YOUR ROUTE SHIFT</h3>
            <div class="scenario-options">
              ${scenarios
                .map(
                  (s) => `
                <label class="scenario-option ${s.id === options.selectedScenarioId ? 'is-selected' : ''}">
                  <input type="radio" name="scenario" value="${s.id}" ${s.id === options.selectedScenarioId ? 'checked' : ''} />
                  <div class="scenario-info">
                    <div class="scenario-header">
                      <strong>${s.title}</strong>
                      <span class="diff-badge diff-${s.difficulty.toLowerCase()}">${s.difficulty}</span>
                    </div>
                    <small>${s.subtitle}</small>
                    <p>${s.description}</p>
                  </div>
                </label>
              `
                )
                .join('')}
            </div>

            <div class="menu-primary-actions">
              <button type="button" class="start-journey-button" data-start-game>
                ENTER DANFO & START SHIFT (OYA!)
              </button>
            </div>
          </div>

          <div class="menu-sidebar">
            <div class="menu-card stats-card">
              <div class="card-title">CONDUCTOR RECORD</div>
              ${
                hasPlayed
                  ? `
                <div class="career-stats">
                  <div class="stat-box">
                    <span class="stat-label">BEST SCORE</span>
                    <strong class="stat-val highlight-gold">${pb.highScore} PTS</strong>
                    <small class="stars-display">${'⭐'.repeat(pb.bestStars)}</small>
                  </div>
                  <div class="stat-box">
                    <span class="stat-label">TOP RANK</span>
                    <strong class="stat-val">${pb.bestRank}</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-label">BEST NET PROFIT</span>
                    <strong class="stat-val stat-paid">${formatNaira(pb.bestNetProfit)}</strong>
                  </div>
                  <div class="stat-box">
                    <span class="stat-label">SHIFTS COMPLETED</span>
                    <strong class="stat-val">${pb.journeysCompleted}</strong>
                  </div>
                </div>
              `
                  : `
                <div class="new-conductor-msg">
                  <p>No shifts on record yet. Climb from <strong>JJC (Johnny Just Come)</strong> to <strong>Agba Conductor</strong>!</p>
                </div>
              `
              }
            </div>

            <div class="menu-card menu-helpers">
              <button type="button" class="menu-aux-btn" data-how-to-play>
                📖 How to Play & Conductor Rules
              </button>
              <button type="button" class="menu-aux-btn" data-toggle-sound>
                🔊 Sound: <strong class="sound-label">${options.soundEnabled ? 'ON' : 'OFF'}</strong>
              </button>
            </div>

            <div class="menu-footer-credits">
              <small>CHANGE v0.2.0 • Pure Domain TypeScript • Lagos, Nigeria</small>
            </div>
          </div>
        </div>
      </section>
    `;

    // Handle scenario selection change
    root.querySelectorAll<HTMLInputElement>('input[name="scenario"]').forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        root.querySelectorAll('.scenario-option').forEach((el) => el.classList.remove('is-selected'));
        target.closest('.scenario-option')?.classList.add('is-selected');
      });
    });

    // Start button
    root.querySelector('[data-start-game]')?.addEventListener('click', () => {
      const selectedRadio = root.querySelector<HTMLInputElement>('input[name="scenario"]:checked');
      const scenarioId = selectedRadio ? selectedRadio.value : options.selectedScenarioId;
      const scenario = scenarioSystem.getScenarioById(scenarioId);
      options.onStartGame(scenario);
    });

    // How to Play button
    root.querySelector('[data-how-to-play]')?.addEventListener('click', options.onOpenHowToPlay);

    // Sound toggle
    const soundBtn = root.querySelector<HTMLButtonElement>('[data-toggle-sound]');
    const soundLabel = root.querySelector<HTMLElement>('.sound-label');
    soundBtn?.addEventListener('click', () => {
      const isEnabled = options.onToggleSound();
      if (soundLabel) soundLabel.textContent = isEnabled ? 'ON' : 'OFF';
    });
  }
}
