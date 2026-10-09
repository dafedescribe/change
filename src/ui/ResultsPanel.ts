import type { FinalReconciliation } from '../systems/ScoringSystem';
import type { PersonalBest } from '../systems/PersistenceSystem';
import { formatNaira } from '../utils/currency';

export class ResultsPanel {
  render(
    root: HTMLElement,
    reconciliation: FinalReconciliation,
    onRestart: () => void,
    onMainMenu?: () => void,
    pbInfo?: { personalBest: PersonalBest; isNewHighScore: boolean }
  ): void {
    const starIcons = '⭐'.repeat(reconciliation.stars);

    root.innerHTML = `
      <section class="results-panel" aria-label="Journey Results and Reconciliation">
        <div class="results-header">
          ${
            pbInfo?.isNewHighScore
              ? `
            <div class="new-record-banner">
              🎉 NEW CAREER HIGH SCORE! 🎉
            </div>
          `
              : ''
          }
          <div class="score-badge">
            <span class="stars">${starIcons}</span>
            <span class="score-points">${reconciliation.score} PTS</span>
          </div>
          <p class="eyebrow">FINAL DANFO CONDUCTOR RECONCILIATION</p>
          <h2>${reconciliation.rank}</h2>
          ${
            pbInfo
              ? `
            <p class="pb-summary">
              All-Time Record: <strong>${pbInfo.personalBest.highScore} PTS</strong> (${pbInfo.personalBest.bestRank}) • Shifts: ${pbInfo.personalBest.journeysCompleted}
            </p>
          `
              : ''
          }
        </div>

        <div class="reconciliation-grid">
          <div class="recon-card">
            <span class="recon-label">Delivered Passengers</span>
            <strong>${reconciliation.passengersDelivered} / ${reconciliation.totalPassengers}</strong>
            <small>${reconciliation.marriagesPerformed} marriage(s) performed</small>
          </div>

          <div class="recon-card">
            <span class="recon-label">Fares Collected</span>
            <strong class="stat-paid">${formatNaira(reconciliation.totalFaresCollected)}</strong>
            <small>Gross ticket revenue</small>
          </div>

          <div class="recon-card">
            <span class="recon-label">Change Dispensed</span>
            <strong>${formatNaira(reconciliation.changeDispensed)}</strong>
            <small>${reconciliation.totalHeldChangeObligations > 0 ? `Unreturned: ${formatNaira(reconciliation.totalHeldChangeObligations)}` : 'All change settled'}</small>
          </div>

          <div class="recon-card">
            <span class="recon-label">Roadside Expenses</span>
            <strong class="stat-expense">-${formatNaira(reconciliation.totalRoadsideLeviesPaid)}</strong>
            <small>Owo Agbero & park levies</small>
          </div>

          <div class="recon-card">
            <span class="recon-label">Penalties Incurred</span>
            <strong class="${reconciliation.totalPenalties > 0 ? 'stat-debt' : 'stat-paid'}">
              -${formatNaira(reconciliation.totalPenalties)}
            </strong>
            <small>${reconciliation.totalOutstandingDebt > 0 ? `Uncollected debt: ${formatNaira(reconciliation.totalOutstandingDebt)}` : 'Zero uncollected debt'}</small>
          </div>

          <div class="recon-card recon-highlight">
            <span class="recon-label">Final Drawer Cash</span>
            <strong>${formatNaira(reconciliation.finalCash)}</strong>
            <small>Net gain: ${reconciliation.netCashGain >= 0 ? '+' : ''}${formatNaira(reconciliation.netCashGain)}</small>
          </div>

          <div class="recon-card recon-highlight">
            <span class="recon-label">Final Net Profit</span>
            <strong class="${reconciliation.finalProfit >= 0 ? 'stat-paid' : 'stat-debt'}">
              ${formatNaira(reconciliation.finalProfit)}
            </strong>
            <small>After all fines & levies</small>
          </div>
        </div>

        ${
          reconciliation.notes.length > 0
            ? `
          <div class="reconciliation-notes">
            <p class="notes-title">CONDUCTOR LOG & STREET REMARKS:</p>
            <ul>
              ${reconciliation.notes.map((note) => `<li>${note}</li>`).join('')}
            </ul>
          </div>
        `
            : ''
        }

        <div class="results-actions">
          ${
            onMainMenu
              ? `
            <button type="button" class="aux-button" data-results-menu>
              ⌂ Main Menu
            </button>
          `
              : ''
          }
          <button type="button" class="restart-button" data-restart>Drive Route Again (New Shift)</button>
        </div>
      </section>
    `;

    root
      .querySelector<HTMLButtonElement>('[data-restart]')
      ?.addEventListener('click', onRestart);

    if (onMainMenu) {
      root
        .querySelector<HTMLButtonElement>('[data-results-menu]')
        ?.addEventListener('click', onMainMenu);
    }
  }
}
