# CHANGE — Developer / Agent Handoff

## Project intent

CHANGE is a browser game prototype simulating the role of a Lagos danfo conductor. The core architecture provides a clean separation of pure domain systems from the DOM/visual rendering layer.

The project deliberately avoids heavy game engines, backend dependencies, multiplayer, or complex art pipelines. All gameplay rules are pure TypeScript functions and can be verified with fast unit tests without mounting the DOM.

## Current state

Implemented and working:

- **Game State (`src/game/GameState.ts`, `src/game/Game.ts`)**:
  - Full tracking of current journey, cash balances, passenger roster, active transaction, and progress metrics.
  - Backward-compatible fields maintained for scene and HUD bindings.
- **Passenger Data Model (`src/data/passengers.ts`)**:
  - Unique ID, destination, origin, fare, payment status (`unpaid`, `partial`, `paid`), journey status (`waiting`, `paid`, `dropped-off`), paid amount, outstanding balance, and appearance reference.
  - Starter passengers (Tunde, Amarachi, Sade) plus intermediate boarding pool (Chidi, Folake).
- **Fare System (`src/systems/FareSystem.ts`)**:
  - Fare calculations by destination and passenger lookup.
  - Outstanding balance calculation per passenger and total across the journey.
  - Revenue tracking (collected vs. expected fares).
- **Cash System (`src/systems/CashSystem.ts`)**:
  - Denomination inventory tracking (₦100, ₦200, ₦500, ₦1,000).
  - Mathematical change calculations and total cash drawer evaluation.
  - Sufficiency checks and change breakdown resolution from available notes.
- **Transaction System (`src/systems/TransactionSystem.ts`)**:
  - Full 8-step conductor transaction workflow: passenger selection, fare lookup, tendered payment acceptance, required change calculation, conductor denomination selection from cash drawer, change validation, balance updates, and explicit user feedback.
  - Payment validation (exact payment, overpayment, underpayment).
  - Incomplete transaction management (accepting partial payments and recording remaining debt).
  - Conductor cash drawer updates (+tendered notes, -dispensed change notes).
- **Lagos Danfo Mechanics (`src/systems/DanfoMechanicsSystem.ts`)**:
  - **Hold**: Pocket tendered note immediately, defer change, settle later or risk commotion upon alighting.
  - **Marry**: Couple two passengers whose change dues sum up to a single matching banknote in the drawer.
  - **Break**: Exchange large banknotes (₦1,000, ₦500) into smaller denominations with roadside vendors.
- **Roadside Events (`src/data/events.ts`, `src/systems/RoadsideEventSystem.ts`)**:
  - Stop events including *Owo Agbero* (park union dues) and bridge levies with automatic drawer deductions.
- **Scoring & Reconciliation (`src/systems/ScoringSystem.ts`)**:
  - Cash reconciliation (starting cash, gross ticket revenue, change dispensed, roadside expenses, net profit).
  - Penalties for uncollected debts and unreturned change on alighting.
  - Conductor ranking system (Agba Conductor, Omo Igboro, Regular Conductor, JJC).
- **Journey System (`src/systems/JourneySystem.ts`)**:
  - Stop progression (Oshodi → Yaba → Ojuelegba → Ketu).
  - Passenger boarding at intermediate stops and automated alighting at destinations.
  - Route completion detection, live progress stats, and end-of-route financial summaries.
- **Rendering Layer (`src/scene/`)**:
  - Displays passengers with status badges (Waiting, Paid, Change Held, Married, Owes debt, Alighted).
  - Highlights selected passengers and disables alighted passengers.
  - Renders bus interior, windows, rails, lighting, conductor seat, and route signs.
- **Interface Layer (`src/ui/`)**:
  - **HUD**: Cash on hand total, stop progression indicator, roadside levies counter, onboard count, and "Depart → Next Stop" action.
  - **Transaction Panel**: Passenger travel details, 8-step flow breakdown, interactive cash drawer tray with stock counters, real-time validation banner, quick tender simulator chips, Hold button, Marry candidates, and Break note controls.
  - **Cash Tray**: Banknote buttons with held counts, selection multipliers, and clear selection action.
  - **Notification**: Contextual styling for errors, successes, and route arrivals.
  - **Results Panel**: Comprehensive danfo conductor report (delivered passengers, fares collected, debt remaining, net cash gain, penalties, conductor score, stars, and route restart).

## Run locally

From the repository root:

```bash
npm install
npm run dev
```

## Test suite & verification

The verification commands are:

```bash
npm test -- --run
npm run build
```

The test suite contains **81 passing tests across 12 test files**, verifying the entire game architecture, transaction integrity, journey progression, danfo mechanics, roadside events, and end-of-route reconciliation without requiring DOM or browser rendering:

- `src/tests/transaction_integrity.test.ts` (9 tests) — exact fare, overpayments, underpayments, cumulative partial payments, partial-to-full with change, drawer insufficiency, invalid denominations, duplicate execution prevention, alighted passenger protection.
- `src/tests/danfo_mechanics.test.ts` (15 tests) — comprehensive testing of Hold, Marry, and Break actions including failure modes, invalid breakdown rejection, denomination availability, and alighted passenger checks.
- `src/tests/journey_reconciliation.test.ts` (10 tests) — stop progression, boarding pool isolation, duplicate boarding prevention, roadside levy enforcement, and 7 end-of-route reconciliation scenarios (clean run, debt, unsettled change, marry+break, roadside events only, multiple partial payments, journey restarts).
- `src/tests/cash.test.ts` (11 tests) — denomination arithmetic, change breakdown, and drawer validation.
- `src/tests/conductor_transaction.test.ts` (5 tests) — 8-step transaction workflow.
- `src/tests/controller.test.ts` (7 tests) — GameController orchestration and state management.
- `src/tests/complete_journey.test.ts` (5 tests) — end-to-end multi-passenger journey.
- `src/tests/journey.test.ts` (6 tests) — stop transitions and boarding.
- `src/tests/transaction.test.ts` (5 tests) — payment validation.
- `src/tests/fare.test.ts` (5 tests) — fare lookups and balance calculations.
- `src/tests/gamestate.test.ts` (2 tests) — initial state factory validation.
- `src/tests/assets.test.ts` (1 test) — asset manifest structure.

## Code map

| Area | Responsibility |
| --- | --- |
| `src/game/GameState.ts` | State types, cash drawer, active transaction, and journey progress models. |
| `src/game/Game.ts` | Factory for initializing fresh game state with changeDispensed tracking. |
| `src/game/GameController.ts` | Orchestrates player actions, pure systems, event deduplication, and triggers re-renders. |
| `src/systems/FareSystem.ts` | Fare lookup, outstanding balances, and total revenue tracking. |
| `src/systems/CashSystem.ts` | Change math, note counts, drawer sufficiency, and denomination validation. |
| `src/systems/TransactionSystem.ts` | Payment validation, partial payment/debt management, balance updates, and transaction integrity. |
| `src/systems/DanfoMechanicsSystem.ts` | Validated Hold (deferred change), Marry (paired obligations), and Break (denomination splitting). |
| `src/systems/RoadsideEventSystem.ts` | Stop events including Owo Agbero and bridge levies with denomination-safe deductions. |
| `src/systems/ScoringSystem.ts` | Full financial reconciliation (change dispensed, debt, unsettled obligations, penalties, conductor rank). |
| `src/systems/JourneySystem.ts` | Route advancement, terminal stop drop-offs, boarding deduplication, and journey completion. |
| `src/data/` | Route stops, fare schedules, passenger roster, boarding pool, and asset IDs. |
| `src/scene/` | Bus interior, passenger DOM rendering, badges, and layout. |
| `src/ui/` | HUD, cash tray, transaction panel, notification banners, and results modal. |
| `src/tests/` | 100% DOM-free Vitest coverage for all core systems and controller behavior (81 tests). |

## Deliverable verification & Invariants

All gameplay rules are independent of DOM elements and images:
- Fares, debt, change, and denomination sufficiency are calculated numerically.
- Stop progression, boarding, drop-offs, and completion operate as pure state transitions.
- Change is calculated against the remaining due after partial payments, not the original fare.
- Cash drawer receives only tendered notes and dispenses only selected change.
- Alighted passengers cannot make payments, have change held, or be married.
- Hold, Marry, and Break operations are atomic and return explicit `{ success, error? }` results.
- End-of-route reconciliation tracks `changeDispensed`, `totalOutstandingDebt`, and `totalHeldChangeObligations` accurately without phantom money or duplicate accounting.
- The entire core game loop can be run and tested without loading the visual scene.

