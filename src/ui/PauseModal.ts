export class PauseModal {
  render(
    root: HTMLElement,
    options: {
      soundEnabled: boolean;
      onResume: () => void;
      onToggleSound: () => boolean;
      onRestart: () => void;
      onMainMenu: () => void;
    }
  ): void {
    root.innerHTML = `
      <div class="modal-backdrop" data-pause-backdrop>
        <div class="modal-card pause-card" role="dialog" aria-labelledby="pause-title">
          <div class="modal-header">
            <div>
              <p class="eyebrow">JOURNEY PAUSED</p>
              <h2 id="pause-title">Conductor Break</h2>
            </div>
            <button type="button" class="modal-close-btn" data-resume aria-label="Resume journey">✕</button>
          </div>

          <div class="pause-actions-list">
            <button type="button" class="pause-action-btn primary-action" data-resume>
              ▶ Resume Journey
            </button>

            <button type="button" class="pause-action-btn" data-toggle-sound>
              🔊 Sound: <strong class="sound-status-label">${options.soundEnabled ? 'ON' : 'OFF'}</strong>
            </button>

            <button type="button" class="pause-action-btn warning-action" data-restart>
              ↺ Restart Current Shift
            </button>

            <button type="button" class="pause-action-btn danger-action" data-menu>
              ⌂ Exit to Main Menu
            </button>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-resume]').forEach((el) => {
      el.addEventListener('click', options.onResume);
    });

    const soundBtn = root.querySelector<HTMLButtonElement>('[data-toggle-sound]');
    const soundLabel = root.querySelector<HTMLElement>('.sound-status-label');
    soundBtn?.addEventListener('click', () => {
      const isNowEnabled = options.onToggleSound();
      if (soundLabel) {
        soundLabel.textContent = isNowEnabled ? 'ON' : 'OFF';
      }
    });

    root.querySelector('[data-restart]')?.addEventListener('click', () => {
      if (confirm('Restart this journey from Oshodi? All current progress will reset.')) {
        options.onRestart();
      }
    });

    root.querySelector('[data-menu]')?.addEventListener('click', () => {
      if (confirm('Return to Main Menu? Current journey will be abandoned.')) {
        options.onMainMenu();
      }
    });

    root.querySelector('[data-pause-backdrop]')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) options.onResume();
    });
  }
}
