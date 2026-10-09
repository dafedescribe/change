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

- **Main Menu & Shift Selector**: Pick from balanced scenarios (Morning Commute, Midday Change Squeeze, Market Day Combo, Late Night Express) or run seeded shifts.
- **Career & Personal Best**: Automatic local persistence tracking high score, star rating, best rank, and total journeys completed.
- **How-to-Play Guide**: Interactive 6-step conductor orientation manual accessible from menu and pause screens.
- **Pause & Settings**: In-game conductor break modal with resume, sound on/off toggle, shift restart, and exit to menu.
- **Audio Synthesis**: Zero-dependency Web Audio API sound effects for cash tenders, change chimes, hold deferrals, marry triads, break splits, bus horns, and victory fanfares.
- **In-World Ad Placements**: Authentic roadside billboard visible through the bus windows and in-bus safety/commercial poster.

## Current scope

- **Route**: Oshodi → Yaba → Ojuelegba → Ketu with intermediate boarding and terminal drop-offs.
- **Mechanics**: 100% pure domain implementations of Fare, Cash, Transaction, Hold, Marry, Break, Journey, Roadside Events, and Scoring systems.
- **Replayability & Persistence**: Predefined scenario catalog, deterministic procedural seed generator, and career high score persistence.
- **UI & Presentation**: Main menu, bus interior with animated badges and window billboard, HUD quick controls, transaction panel, pause modal, how-to-play manual, and final reconciliation modal.
- **Test Suite**: 94 tests across 15 test files with 100% DOM-free domain rule validation.

## Development

```bash
npm install
npm run dev
```

Run the test suite with `npm test -- --run` and build with `npm run build`.

