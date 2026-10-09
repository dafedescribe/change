import type { Cash } from '../game/GameState';
import { formatNaira } from '../utils/currency';
import { assets } from '../data/assets';

const denominations = [100, 200, 500, 1000];
const noteAssets = {
  100: assets.naira100,
  200: assets.naira200,
  500: assets.naira500,
  1000: assets.naira1000,
};

export class CashTray {
  render(
    root: HTMLElement,
    cash: Cash,
    selected: number[],
    onToggle: (value: number) => void,
    onClear?: () => void
  ): void {
    // Count how many of each note is currently selected
    const selectedCounts: Record<number, number> = {};
    for (const val of selected) {
      selectedCounts[val] = (selectedCounts[val] ?? 0) + 1;
    }

    const totalSelected = selected.reduce((sum, value) => sum + value, 0);

    root.innerHTML = `
      <div class="cash-tray-section">
        <p class="tray-label">CONDUCTOR CASH DRAWER · SELECT CHANGE TO GIVE</p>
        <div class="cash-tray" aria-label="Choose change denominations">
          ${denominations
            .map((value) => {
              const isSelected = selected.includes(value);
              const heldCount = cash[value] ?? 0;
              const selCount = selectedCounts[value] ?? 0;
              const canPickMore = heldCount > selCount;
              const isOutOfStock = heldCount === 0;

              return `
                <button
                  type="button"
                  class="note-button ${isSelected ? 'is-selected' : ''} ${isOutOfStock ? 'is-empty' : ''}"
                  data-denomination="${value}"
                  aria-pressed="${isSelected}"
                  ${isOutOfStock ? 'disabled' : ''}
                  title="${isOutOfStock ? 'No notes in drawer' : `Select ₦${value} from drawer`}"
                >
                  <img src="${noteAssets[value as keyof typeof noteAssets]}" alt="" aria-hidden="true" />
                  <span class="note-value">₦${value}</span>
                  <small class="note-held">${heldCount} in drawer</small>
                  ${selCount > 0 ? `<span class="note-count-badge">${selCount}x given</span>` : ''}
                </button>
              `;
            })
            .join('')}
        </div>
        <div class="payment-summary">
          <p class="payment-total">Selected Change: <strong>${formatNaira(totalSelected)}</strong></p>
          ${
            selected.length > 0 && onClear
              ? `<button type="button" class="clear-notes-button" data-clear-notes>Reset Selection</button>`
              : ''
          }
        </div>
      </div>
    `;

    root.querySelectorAll<HTMLButtonElement>('[data-denomination]').forEach((button) => {
      button.addEventListener('click', () => onToggle(Number(button.dataset.denomination)));
    });

    if (onClear) {
      root
        .querySelector<HTMLButtonElement>('[data-clear-notes]')
        ?.addEventListener('click', onClear);
    }
  }
}
