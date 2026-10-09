import type { Passenger } from '../data/passengers';
import type { Cash, ActiveTransaction } from '../game/GameState';
import type { MarriageCandidate } from '../systems/DanfoMechanicsSystem';
import { formatNaira } from '../utils/currency';
import { CashTray } from './CashTray';
import { Notification } from './Notification';

type TransactionState = {
  passenger?: Passenger;
  cash: Cash;
  pendingPayment: number[];
  activeTransaction?: ActiveTransaction;
  marriageCandidates?: MarriageCandidate[];
  message?: string;
};

export class TransactionPanel {
  private readonly cashTray = new CashTray();
  private readonly notification = new Notification();

  render(
    root: HTMLElement,
    state: TransactionState,
    onToggleChange: (value: number) => void,
    onComplete: () => void,
    onHold?: () => void,
    onMarry?: (pAId: string, pBId: string, noteVal: number) => void,
    onBreakNote?: (note: number, breakdown: number[]) => void,
    onSetTendered?: (notes: number[]) => void,
    onCancel?: () => void,
    onClearChange?: () => void
  ): void {
    if (!state.passenger) {
      root.innerHTML = `
        <div class="empty-panel">
          <p class="empty-lead">Select a passenger in the bus to begin the fare transaction.</p>
          <small>Click any passenger above to inspect fare, collect money, give change, or use Marry/Hold/Break.</small>
        </div>
      `;
      return;
    }

    const passenger = state.passenger;
    const active = state.activeTransaction;

    const fareDue = passenger.fare;
    const tenderedNotes = active?.tenderedNotes ?? passenger.tenderedNotes ?? [fareDue];
    const tenderedTotal = tenderedNotes.reduce((sum, n) => sum + n, 0);
    const requiredChange = Math.max(0, tenderedTotal - fareDue);
    const selectedChangeNotes = active?.selectedChangeNotes ?? [];
    const selectedChangeTotal = selectedChangeNotes.reduce((sum, n) => sum + n, 0);

    const isPaid = passenger.paymentStatus === 'paid';
    const isChangeHeld = Boolean(passenger.changeHeld && (passenger.heldChangeAmount ?? 0) > 0);
    const isUnderpaidTender = tenderedTotal < fareDue;
    const isExactChange = selectedChangeTotal === requiredChange;

    let statusBadgeText = 'Incomplete';
    let statusClass = 'status-under';
    let validationMessage = active?.validationMessage ?? state.message ?? '';

    if (isChangeHeld) {
      statusBadgeText = 'Change On Hold';
      statusClass = 'status-held';
      validationMessage = `₦${passenger.heldChangeAmount} change is on hold for ${passenger.name}. Settle when you get small notes!`;
    } else if (isPaid) {
      statusBadgeText = 'Completed';
      statusClass = 'status-correct';
      validationMessage = `✓ Fare collected! ₦${fareDue} received.`;
    } else if (isUnderpaidTender) {
      statusBadgeText = 'Underpaid Tender';
      statusClass = 'status-under';
      validationMessage = `⚠ Tendered ₦${tenderedTotal} is less than fare due (₦${fareDue}).`;
    } else if (isExactChange) {
      statusBadgeText = 'Correct Change';
      statusClass = 'status-correct';
      validationMessage =
        requiredChange === 0
          ? '✓ Exact fare tendered! No change required.'
          : `✓ Correct change: ₦${requiredChange} selected. Ready to complete!`;
    } else if (selectedChangeTotal < requiredChange) {
      statusBadgeText = 'Incomplete Change';
      statusClass = 'status-under';
      const diff = requiredChange - selectedChangeTotal;
      validationMessage = `⚠ Incomplete change: ₦${diff} still needed (selected ₦${selectedChangeTotal} of ₦${requiredChange}).`;
    } else {
      statusBadgeText = 'Incorrect Change';
      statusClass = 'status-over';
      const excess = selectedChangeTotal - requiredChange;
      validationMessage = `✕ Incorrect change: ₦${excess} too much change (selected ₦${selectedChangeTotal} of ₦${requiredChange}).`;
    }

    const marriages = state.marriageCandidates ?? [];
    const hasThousand = (state.cash[1000] ?? 0) > 0;
    const hasFiveHundred = (state.cash[500] ?? 0) > 0;
    const hasTwoHundred = (state.cash[200] ?? 0) > 0;
    const canComplete = isChangeHeld
      ? isExactChange && selectedChangeTotal > 0
      : !isPaid && !isUnderpaidTender && isExactChange;

    root.innerHTML = `
      <section class="transaction-panel" aria-label="Fare collection transaction">
        <div class="transaction-copy">
          <div class="panel-header">
            <span class="step-indicator">TRANSACTION · ${passenger.name}</span>
            <div class="header-actions">
              <span class="transaction-badge ${statusClass}">${statusBadgeText}</span>
              ${onCancel ? `<button type="button" class="cancel-button" data-cancel title="Deselect passenger">✕</button>` : ''}
            </div>
          </div>

          <h2>${passenger.name} is travelling to ${passenger.destination}</h2>

          <div class="transaction-flow-grid">
            <div class="flow-card">
              <span class="flow-step">1. FARE DUE</span>
              <strong class="stat-fare">${formatNaira(fareDue)}</strong>
              <small>Destination rate</small>
            </div>

            <div class="flow-card">
              <span class="flow-step">2. AMOUNT TENDERED</span>
              <strong class="stat-paid">${formatNaira(tenderedTotal)}</strong>
              <small>${tenderedNotes.map((n) => `₦${n}`).join(' + ')}</small>
            </div>

            <div class="flow-card">
              <span class="flow-step">3. CHANGE REQUIRED</span>
              <strong class="stat-change">${formatNaira(requiredChange)}</strong>
              <small>${tenderedTotal} - ${fareDue}</small>
            </div>
          </div>

          ${
            !isPaid && onSetTendered
              ? `
            <div class="tender-switcher">
              <span class="switcher-label">Simulate passenger payment:</span>
              <button type="button" class="tender-chip ${tenderedTotal === 1000 ? 'is-active' : ''}" data-tender="1000">₦1,000 note</button>
              <button type="button" class="tender-chip ${tenderedTotal === 500 ? 'is-active' : ''}" data-tender="500">₦500 note</button>
              <button type="button" class="tender-chip ${tenderedTotal === fareDue ? 'is-active' : ''}" data-tender="${fareDue}">Exact (${formatNaira(fareDue)})</button>
              <button type="button" class="tender-chip ${tenderedTotal === 200 ? 'is-active' : ''}" data-tender="200">₦200 (Under)</button>
            </div>
          `
              : ''
          }

          <!-- Lagos Mechanics: Hold Change button -->
          ${
            !isPaid && requiredChange > 0 && onHold
              ? `
            <div class="mechanic-action-box">
              <p class="mechanic-hint">No small notes right now? Pocket the note and tell them to wait:</p>
              <button type="button" class="hold-button" data-hold>
                ⏱️ Hold Change (₦${requiredChange}) · "Hold on, I go give you!"
              </button>
            </div>
          `
              : ''
          }

          <!-- Lagos Mechanics: Marry Candidates -->
          ${
            marriages.length > 0 && onMarry
              ? `
            <div class="marriage-box">
              <p class="mechanic-hint">💡 MARRY OPPORTUNITY (Combine 2 passengers):</p>
              ${marriages
                .map(
                  (m) => `
                <div class="marriage-item">
                  <span>${m.passengerA.name} (₦${m.changeA}) + ${m.passengerB.name} (₦${m.changeB}) = ₦${m.matchingNote} note</span>
                  <button type="button" class="marry-button" data-marry-a="${m.passengerA.id}" data-marry-b="${m.passengerB.id}" data-marry-note="${m.matchingNote}" ${!m.canExecute ? 'disabled' : ''}>
                    ${m.canExecute ? `Marry Pair With ₦${m.matchingNote}` : `Need ₦${m.matchingNote} note to marry`}
                  </button>
                </div>
              `
                )
                .join('')}
            </div>
          `
              : ''
          }

          <!-- Step 8: Show feedback message -->
          <div class="feedback-banner ${statusClass}" role="status">
            ${validationMessage}
          </div>
        </div>

        <div class="transaction-actions">
          <div data-cash-tray></div>

          <!-- Roadside Break Note Controls -->
          ${
            !isPaid && (hasThousand || hasFiveHundred || hasTwoHundred) && onBreakNote
              ? `
            <div class="break-note-box">
              <span class="break-label">ROADSIDE VENDOR · BREAK NOTE:</span>
              <div class="break-buttons">
                ${
                  hasThousand
                    ? `
                  <button type="button" class="break-chip" data-break-1000>Break ₦1,000 (5x ₦200)</button>
                  <button type="button" class="break-chip" data-break-1000-500>Break ₦1,000 (2x ₦500)</button>
                `
                    : ''
                }
                ${
                  hasFiveHundred
                    ? `
                  <button type="button" class="break-chip" data-break-500>Break ₦500 (2x ₦200 + 1x ₦100)</button>
                `
                    : ''
                }
                ${
                  hasTwoHundred
                    ? `
                  <button type="button" class="break-chip" data-break-200>Break ₦200 (2x ₦100)</button>
                `
                    : ''
                }
              </div>
            </div>
          `
              : ''
          }

          <div class="action-buttons">
            <button
              class="complete-button"
              type="button"
              data-complete
              ${!canComplete ? 'disabled' : ''}
            >
              ${
                isChangeHeld
                  ? `Settle Held Change (₦${selectedChangeTotal})`
                  : isPaid
                  ? 'Transaction Completed'
                  : requiredChange === 0
                  ? `Collect Exact Fare (${formatNaira(fareDue)})`
                  : `Give ₦${selectedChangeTotal} Change & Complete`
              }
            </button>
          </div>
        </div>
      </section>
    `;

    // Render CashTray
    const tray = root.querySelector<HTMLElement>('[data-cash-tray]');
    if (tray && !isPaid) {
      this.cashTray.render(
        tray,
        state.cash,
        selectedChangeNotes,
        onToggleChange,
        onClearChange
      );
    } else if (tray && isPaid) {
      tray.innerHTML = `<p class="tray-completed-msg">Passenger has paid. Cash balance updated.</p>`;
    }

    // Attach complete click
    root
      .querySelector<HTMLButtonElement>('[data-complete]')
      ?.addEventListener('click', onComplete);

    // Attach hold click
    if (onHold) {
      root.querySelector<HTMLButtonElement>('[data-hold]')?.addEventListener('click', onHold);
    }

    // Attach marry clicks
    if (onMarry) {
      root.querySelectorAll<HTMLButtonElement>('[data-marry-note]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const pAId = btn.dataset.marryA!;
          const pBId = btn.dataset.marryB!;
          const noteVal = Number(btn.dataset.marryNote);
          onMarry(pAId, pBId, noteVal);
        });
      });
    }

    // Attach break note clicks
    if (onBreakNote) {
      root.querySelector<HTMLButtonElement>('[data-break-1000]')?.addEventListener('click', () => {
        onBreakNote(1000, [200, 200, 200, 200, 200]);
      });
      root.querySelector<HTMLButtonElement>('[data-break-1000-500]')?.addEventListener('click', () => {
        onBreakNote(1000, [500, 500]);
      });
      root.querySelector<HTMLButtonElement>('[data-break-500]')?.addEventListener('click', () => {
        onBreakNote(500, [200, 200, 100]);
      });
      root.querySelector<HTMLButtonElement>('[data-break-200]')?.addEventListener('click', () => {
        onBreakNote(200, [100, 100]);
      });
    }

    // Attach tender switchers
    if (onSetTendered) {
      root.querySelectorAll<HTMLButtonElement>('[data-tender]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const val = Number(btn.dataset.tender);
          onSetTendered([val]);
        });
      });
    }

    // Attach cancel
    if (onCancel) {
      root
        .querySelector<HTMLButtonElement>('[data-cancel]')
        ?.addEventListener('click', onCancel);
    }
  }
}
