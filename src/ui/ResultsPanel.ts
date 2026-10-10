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
            <small>Agbero & park levies (paid from drawer cash)</small>
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
            <small>Net cash gain: ${reconciliation.netCashGain >= 0 ? '+' : ''}${formatNaira(reconciliation.netCashGain)}</small>
          </div>

          <div class="recon-card recon-highlight">
            <span class="recon-label">Final Net Profit</span>
            <strong class="${reconciliation.finalProfit >= 0 ? 'stat-paid' : 'stat-debt'}">
              ${formatNaira(reconciliation.finalProfit)}
            </strong>
            <small>Net cash gain minus penalties</small>
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
                <span>Base Shift Completion:</span>
                <strong class="stat-paid">+300 pts</strong>
              </div>
              <div class="formula-row">
                <span>Passengers Delivered (+100 ea):</span>
                <strong class="stat-paid">+${reconciliation.passengersDelivered * 100} pts</strong>
              </div>
              <div class="formula-row">
                <span>Net Profit Contribution (1 pt / ₦10):</span>
                <strong class="${reconciliation.finalProfit >= 0 ? 'stat-paid' : 'stat-debt'}">
                  ${Math.floor(reconciliation.finalProfit / 10) >= 0 ? '+' : ''}${Math.floor(reconciliation.finalProfit / 10)} pts
                </strong>
              </div>
              ${
                reconciliation.marriagesPerformed > 0
                  ? `
                <div class="formula-row">
                  <span>Street Marriages (+150 ea):</span>
                  <strong class="stat-paid">+${reconciliation.marriagesPerformed * 150} pts</strong>
                </div>
              `
                  : ''
              }
              ${
                (reconciliation.debtorsCount ?? 0) > 0
                  ? `
                <div class="formula-row">
                  <span>Unpaid Debt Fine (-100 ea):</span>
                  <strong class="stat-debt">-${(reconciliation.debtorsCount ?? 0) * 100} pts</strong>
                </div>
              `
                  : ''
              }
              ${
                (reconciliation.unreturnedChangeCount ?? 0) > 0
                  ? `
                <div class="formula-row">
                  <span>Unreturned Change Fine (-150 ea):</span>
                  <strong class="stat-debt">-${(reconciliation.unreturnedChangeCount ?? 0) * 150} pts</strong>
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

        <!-- Viral social sharing bar -->
        <div class="share-section">
          <span class="share-section-title">BROADCAST YOUR CONDUCTOR RECORD:</span>
          <div class="share-channels-grid">
            <button type="button" class="social-share-btn share-whatsapp" data-share-whatsapp>
              💬 WhatsApp Status
            </button>
            <button type="button" class="social-share-btn share-x" data-share-x>
              𝕏 Post on X / Twitter
            </button>
            <button type="button" class="social-share-btn share-copy" data-share-copy>
              📋 Copy / Native Share
            </button>
          </div>
          <div class="share-toast" data-share-toast style="display: none;"></div>
        </div>

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

    const shareToast = root.querySelector<HTMLElement>('[data-share-toast]');

    const shareText = [
      `🚎 CHANGE — Lagos Danfo Conductor Simulator`,
      `🏆 Rank: ${reconciliation.rank} ${'⭐'.repeat(reconciliation.stars)}`,
      `💰 Score: ${reconciliation.score} PTS | Net Profit: ${formatNaira(reconciliation.finalProfit)}`,
      `👥 Delivered: ${reconciliation.passengersDelivered}/${reconciliation.totalPassengers} Passengers`,
      `💍 Marriages: ${reconciliation.marriagesPerformed}`,
      `🛣️ Route: Oshodi → Yaba → Ojuelegba → Ketu (Zero Debt!)`,
      `Can you survive the Oshodi rush? Beat my score!`,
    ].join('\n');

    const showToast = (msg: string): void => {
      if (shareToast) {
        shareToast.textContent = msg;
        shareToast.style.display = 'block';
        setTimeout(() => {
          shareToast.style.display = 'none';
        }, 3500);
      }
    };

    // 1. WhatsApp direct intent
    root.querySelector('[data-share-whatsapp]')?.addEventListener('click', () => {
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });

    // 2. X (Twitter) direct intent
    root.querySelector('[data-share-x]')?.addEventListener('click', () => {
      const tweetText = `I scored ${reconciliation.score} PTS (${reconciliation.rank}) in CHANGE — Lagos Danfo Conductor Simulator! 🚎💨 Can you survive Oshodi rush?`;
      const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&hashtags=ChangeGame,LagosDanfo,IndieGame`;
      window.open(xUrl, '_blank', 'noopener,noreferrer');
    });

    // 3. Native Share / Clipboard Copy
    root.querySelector('[data-share-copy]')?.addEventListener('click', async () => {
      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({
            title: 'CHANGE — Lagos Danfo Conductor Record',
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
          showToast('✓ Copied conductor scorecard to clipboard! Ready to paste anywhere!');
        } catch {
          showToast('Could not copy automatically. Take a screenshot!');
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
