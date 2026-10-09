import type { Passenger } from '../data/passengers';
import type { Cash } from '../game/GameState';
import { calculateTotalCash } from '../systems/CashSystem';
import { formatNaira } from '../utils/currency';

type HudState = {
  cash: Cash;
  stop: string;
  stopNumber?: number;
  totalStops?: number;
  isCompleted?: boolean;
  selectedPassenger?: Passenger;
  roadsideExpenses?: number;
  passengersOnboard?: number;
};

export class HUD {
  render(root: HTMLElement, state: HudState, onAdvanceStop?: () => void): void {
    const cashTotal = calculateTotalCash(state.cash);
    const stopNumber = state.stopNumber ?? 1;
    const totalStops = state.totalStops ?? 4;
    const isCompleted = state.isCompleted ?? false;
    const roadside = state.roadsideExpenses ?? 0;
    const onboard = state.passengersOnboard ?? 0;

    root.innerHTML = `
      <section class="hud" aria-label="Journey status">
        <div>
          <span class="hud-label">CASH ON HAND</span>
          <strong>${formatNaira(cashTotal)}</strong>
          ${roadside > 0 ? `<small class="hud-expense">-${formatNaira(roadside)} levies paid</small>` : ''}
        </div>
        <div>
          <span class="hud-label">ROUTE PROGRESS</span>
          <strong>Stop ${stopNumber}/${totalStops}: ${state.stop}</strong>
          <small>${onboard} passengers onboard</small>
        </div>
        <div>
          <span class="hud-label">ACTIVE PASSENGER</span>
          <strong>${state.selectedPassenger?.name ?? 'Select passenger'}</strong>
          <small>${state.selectedPassenger ? `${state.selectedPassenger.destination}` : 'Tap seat in bus'}</small>
        </div>
        <div class="hud-action">
          <button
            type="button"
            class="advance-stop-button"
            data-advance-stop
            ${isCompleted ? 'disabled' : ''}
          >
            ${isCompleted ? 'Journey Completed' : 'Depart → Next Stop'}
          </button>
        </div>
      </section>
    `;

    if (onAdvanceStop && !isCompleted) {
      root
        .querySelector<HTMLButtonElement>('[data-advance-stop]')
        ?.addEventListener('click', onAdvanceStop);
    }
  }
}
