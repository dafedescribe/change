# CHANGE

CHANGE is a small danfo-conductor game prototype. The MVP starts with one bus interior, three selectable passengers, and one fare-and-change transaction.

## Gameplay controls & mechanics

- **Passenger Inspection**: Click a passenger to inspect their seat, destination, fare due, and payment status.
- **Fare Collection**: Select tendered banknotes and dispense correct change from your conductor cash drawer.
- **Partial Payments & Debt**: Accept partial payments; passengers remain on board with an outstanding balance owed.
- **Hold Mechanic**: Pocket tendered cash and defer change obligations for later settlement.
- **Marry Mechanic**: Pair two passengers whose combined change dues match an available single banknote in the drawer.
- **Break Mechanic**: Exchange high-denomination notes (₦1,000, ₦500, ₦200) into smaller notes to make change.
- **Roadside Levies**: Settle non-negotiable stop levies (Owo Agbero park dues, bridge toll) from conductor cash.
- **Route Progression**: Progress from Oshodi through Yaba and Ojuelegba to Ketu, handling drop-offs and passenger boarding.
- **Reconciliation & Scoring**: Review final cash reconciliation (revenue, change dispensed, roadside expenses, uncollected debts, and rank).

## Current scope

- **Route**: Oshodi → Yaba → Ojuelegba → Ketu with intermediate boarding and terminal drop-offs.
- **Mechanics**: 100% pure domain implementations of Fare, Cash, Transaction, Hold, Marry, Break, Journey, Roadside Events, and Scoring systems.
- **UI & Scene**: Responsive danfo bus interior layout, HUD stats, 8-step transaction panel with drawer counters, notifications, and end-of-route results modal.
- **Test Suite**: 81 tests across 12 test files with 100% DOM-free domain rule validation.

## Development

```bash
npm install
npm run dev
```

Run the test suite with `npm test -- --run` and build with `npm run build`.

