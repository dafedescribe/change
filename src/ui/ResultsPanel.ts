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

        <!-- Point formula breakdown for puzzle optimizers -->
        <div class="formula-breakdown-box">
          <details class="formula-details">
            <summary class="formula-summary">
              📊 View Point Formula & Score Breakdown
            </summary>
            <div class="formula-content">
              <div class="formula-row">
                <span>Pass Delivered Bonus:</span>
                <strong class="stat-paid">+${reconciliation.passengersDelivered * 20} pts</strong>
              </div>
              <div class="formula-row">
                <span>Fares Collected:</span>
                <strong class="stat-paid">+${Math.min(30, Math.floor(reconciliation.totalFaresCollected / 30))} pts</strong>
              </div>
              <div class="formula-row">
                <span>Street Marriages Bonus:</span>
                <strong class="stat-paid">+${reconciliation.marriagesPerformed * 25} pts</strong>
              </div>
              ${
                reconciliation.unpaidDebtPenalty > 0
                  ? `
                <div class="formula-row">
                  <span>Uncollected Passenger Debt:</span>
                  <strong class="stat-debt">-${reconciliation.unpaidDebtPenalty} pts</strong>
                </div>
              `
                  : ''
              }
              ${
                reconciliation.unreturnedChangePenalty > 0
                  ? `
                <div class="formula-row">
                  <span>Unreturned Held Change (2x fine):</span>
                  <strong class="stat-debt">-${reconciliation.unreturnedChangePenalty} pts</strong>
                </div>
              `
                  : ''
              }
              <div class="formula-total">
                <span>Final Conductor Score:</span>
                <strong class="highlight-gold">${reconciliation.score} PTS (${reconciliation.rank})</strong>
              </div>
            </div>
          </details>
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

        <!-- Share toast feedback -->
        <div class="share-toast" data-share-toast style="display: none;"></div>

        <div class="results-actions">
          <button type="button" class="share-button" data-share-score>
            📲 Share Conductor Record (WhatsApp / X)
          </button>
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

    // Share button handler
    const shareBtn = root.querySelector<HTMLButtonElement>('[data-share-score]');
    const shareToast = root.querySelector<HTMLElement>('[data-share-toast]');

    const shareText = [
      `🚎 CHANGE — Lagos Danfo Conductor Simulator`,
      `🏆 Rank: ${reconciliation.rank} ${'⭐'.repeat(reconciliation.stars)}`,
      `💰 Score: ${reconciliation.score} PTS | Profit: ${formatNaira(reconciliation.finalProfit)}`,
      `👥 Delivered: ${reconciliation.passengersDelivered}/${reconciliation.totalPassengers} Passengers`,
      `💍 Marriages Performed: ${reconciliation.marriagesPerformed}`,
      `🛣️ Route: Oshodi → Yaba → Ojuelegba → Ketu`,
      `Can you survive the Oshodi rush? Beat my conductor score!`,
    ].join('\n');

    shareBtn?.addEventListener('click', async () => {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'CHANGE — Lagos Danfo Conductor Score',
            text: shareText,
          });
          return;
        } catch {
          // Fallback to clipboard
        }
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareText);
          if (shareToast) {
            shareToast.textContent = '✓ Copied score to clipboard! Ready to paste on WhatsApp / X!';
            shareToast.style.display = 'block';
            setTimeout(() => {
              shareToast.style.display = 'none';
            }, 3500);
          }
        } catch {
          // Ignore
        }
      }
    });

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
