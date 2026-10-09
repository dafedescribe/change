export class HowToPlayModal {
  render(root: HTMLElement, onClose: () => void): void {
    root.innerHTML = `
      <div class="modal-backdrop" data-modal-backdrop>
        <div class="modal-card how-to-play-card" role="dialog" aria-labelledby="modal-title">
          <div class="modal-header">
            <div>
              <p class="eyebrow">CONDUCTOR ORIENTATION MANUAL</p>
              <h2 id="modal-title">How to Survive as a Lagos Conductor</h2>
            </div>
            <button type="button" class="modal-close-btn" data-close aria-label="Close guide">✕</button>
          </div>

          <div class="guide-scrollable">
            <section class="guide-section">
              <h3>1. Fare Collection & Change Math</h3>
              <p>Click any passenger in the bus to inspect their seat, destination, and fare due. Select the banknotes they tender, then assemble their exact change from your conductor cash drawer.</p>
              <div class="guide-tip">
                <strong>Rule:</strong> Change Owed = Amount Tendered − Remaining Fare Due.
              </div>
            </section>

            <section class="guide-section">
              <h3>2. The "HOLD" Mechanic</h3>
              <p>Short on small change? Click <strong>"Hold Change (Pocket Note)"</strong> to accept the passenger's payment immediately and defer their change. The passenger is credited, and you can settle their change at a later stop.</p>
              <div class="guide-warning">
                <strong>Caution:</strong> If a passenger alights at their destination with change still on hold, they leave angry and you take a heavy penalty!
              </div>
            </section>

            <section class="guide-section">
              <h3>3. The "MARRY" Mechanic</h3>
              <p>When two passengers' change obligations sum up to a single banknote you possess (e.g., ₦200 + ₦300 = ₦500 note, or ₦100 + ₦100 = ₦200 note), you can <strong>Marry them</strong>! Hand that single banknote to both passengers to settle both debts in one clean move.</p>
            </section>

            <section class="guide-section">
              <h3>4. The "BREAK" Mechanic</h3>
              <p>Have only large notes like ₦1,000 or ₦500? Use the <strong>Break Note</strong> controls to exchange large bills with roadside kiosks and recharge your small note inventory.</p>
            </section>

            <section class="guide-section">
              <h3>5. Roadside Levies & Park Dues</h3>
              <p>At key stops (like Oshodi and Ojuelegba), expect <em>Owo Agbero</em> (union park levies) or bridge tolls. These are deducted straight from your cash drawer. Always keep enough small cash!</p>
            </section>

            <section class="guide-section">
              <h3>6. End-of-Route Reconciliation</h3>
              <p>At the final terminal (Ketu), every remaining passenger alights. Your starting cash, gross revenue, change dispensed, roadside expenses, and penalties are reconciled to determine your conductor rank:</p>
              <ul class="guide-ranks">
                <li><strong>Agba Conductor (Master):</strong> 90+ pts, ⭐⭐⭐⭐⭐</li>
                <li><strong>Omo Igboro (Street Smart):</strong> 75–89 pts, ⭐⭐⭐⭐</li>
                <li><strong>Regular Conductor:</strong> 50–74 pts, ⭐⭐⭐</li>
                <li><strong>JJC (Johnny Just Come):</strong> &lt; 50 pts, ⭐–⭐⭐</li>
              </ul>
            </section>
          </div>

          <div class="modal-footer">
            <button type="button" class="primary-button" data-close>Got It, Let's Move! (Oya!)</button>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('[data-close]').forEach((el) => {
      el.addEventListener('click', onClose);
    });

    root.querySelector('[data-modal-backdrop]')?.addEventListener('click', (e) => {
      if (e.target === e.currentTarget) onClose();
    });
  }
}
