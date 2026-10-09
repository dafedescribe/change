# CHANGE MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a small, playable danfo-conductor MVP with one bus interior, three selectable passengers, and one complete fare-and-change transaction.

**Architecture:** Keep game rules as pure TypeScript modules under `src/game` and `src/systems`, with typed data under `src/data`. Use a thin DOM renderer for the scene and HUD so passenger artwork and layout can change without changing fare or cash rules. The first milestone ends after a successful transaction; journey progression and results are represented only where needed to make the slice playable.

**Tech Stack:** Vite, TypeScript, Vitest, semantic HTML/CSS, browser DOM APIs.

**Spec:** User-provided `CHANGE MVP structure` brief in the conversation.

## Global Constraints

- Keep the MVP to one persistent bus interior and three interactive passengers.
- Keep game rules independent of images and DOM rendering.
- Do not add accounts, backend APIs, multiplayer, multiple routes, advanced AI, ad integration, or complex animation.
- Use placeholder CSS-drawn/emoji visuals when binary art assets are unavailable.
- The first milestone must support selecting a passenger, seeing their fare, paying with denominations, calculating change, validating the result, and updating cash.

### Task 1: Scaffold the Vite TypeScript app

**Files:**
- Create: `index.html`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.ts`
- Create: `src/styles/global.css`
- Create: `src/styles/scene.css`
- Create: `src/styles/interface.css`
- Create: `README.md`

**Interfaces:**
- Produces a browser entry point at `#app` and scripts `dev`, `build`, and `test`.

- [ ] **Step 1: Write the package and configuration files** with Vite, TypeScript, Vitest, and a `test` environment of `node`.
- [ ] **Step 2: Add the minimal HTML shell** with a viewport, title, and `<main id="app"></main>`.
- [ ] **Step 3: Add the entry module and CSS imports** so `npm run build` has a valid empty app.
- [ ] **Step 4: Run `npm install` and `npm run build`**; expect a successful production build.
- [ ] **Step 5: Add README setup and MVP scope** and commit `chore: scaffold change mvp`.

### Task 2: Define fare, passenger, and cash domain behavior with tests first

**Files:**
- Create: `src/data/fares.ts`
- Create: `src/data/passengers.ts`
- Create: `src/data/journey.ts`
- Create: `src/game/GameState.ts`
- Create: `src/systems/FareSystem.ts`
- Create: `src/systems/CashSystem.ts`
- Create: `src/systems/TransactionSystem.ts`
- Create: `src/utils/currency.ts`
- Create: `src/tests/fare.test.ts`
- Create: `src/tests/cash.test.ts`

**Interfaces:**
- `Passenger` has `id`, `name`, `destination`, `fare`, `accent`, and `status`.
- `Cash` is `Record<number, number>` keyed by naira denomination.
- `calculateChange(totalPaid: number, fare: number): number` returns the positive difference or `0`.
- `selectDenominations(cash: Cash, selected: number[]): Cash` returns a copy with selected notes removed and rejects unavailable notes.
- `completeTransaction(fare: number, selected: number[]): { totalPaid: number; change: number; accepted: boolean; reason?: string }` accepts only payment at least equal to fare.

- [ ] **Step 1: Write failing tests** for fare lookup, underpayment rejection, exact payment, overpayment/change calculation, and denomination inventory updates.
- [ ] **Step 2: Run `npm test -- --run src/tests/fare.test.ts src/tests/cash.test.ts`** and confirm failure because the modules do not exist.
- [ ] **Step 3: Implement the smallest pure functions and typed starter data** needed by those tests.
- [ ] **Step 4: Run the focused tests again** and confirm they pass.
- [ ] **Step 5: Commit `feat: add fare and cash transaction rules`**.

### Task 3: Add the bus scene and interactive passenger selection

**Files:**
- Create: `src/scene/SceneLayout.ts`
- Create: `src/scene/PassengerRenderer.ts`
- Create: `src/scene/BusScene.ts`
- Create: `src/ui/HUD.ts`
- Modify: `src/main.ts`
- Modify: `src/styles/scene.css`
- Modify: `src/styles/interface.css`

**Interfaces:**
- `BusScene.mount(root: HTMLElement, passengers: Passenger[], onSelect: (passenger: Passenger) => void): void` renders the interior, driver/conductor area, route sign, and three passenger buttons.
- `HUD.render(root: HTMLElement, state: { cash: Cash; stop: string; selectedPassenger?: Passenger }): void` renders cash and current journey status.

- [ ] **Step 1: Write a browser-free renderer test** that mounts three passenger buttons and invokes the callback with the correct passenger when one is clicked.
- [ ] **Step 2: Run the test and confirm it fails** because the scene modules are absent.
- [ ] **Step 3: Implement the scene as semantic DOM** using placeholder visual classes and data attributes; do not put fare logic in the renderer.
- [ ] **Step 4: Wire `main.ts`** to initialize a starter `GameState`, render the bus, and show the selected passenger’s fare.
- [ ] **Step 5: Run tests and `npm run build`**; confirm the app compiles and the scene test passes.
- [ ] **Step 6: Commit `feat: add interactive bus scene`**.

### Task 4: Add the transaction panel and complete the playable loop

**Files:**
- Create: `src/ui/TransactionPanel.ts`
- Create: `src/ui/CashTray.ts`
- Create: `src/ui/Notification.ts`
- Create: `src/game/GameController.ts`
- Create: `src/game/Game.ts`
- Modify: `src/main.ts`
- Modify: `src/styles/interface.css`

**Interfaces:**
- `GameController.selectPassenger(id: string): void` selects a passenger and opens the transaction panel.
- `GameController.toggleDenomination(value: number): void` adds/removes one available note from the pending payment.
- `GameController.completePayment(): void` validates payment, updates cash, marks the passenger paid, and renders feedback.

- [ ] **Step 1: Write failing controller tests** for selecting a passenger, rejecting underpayment without changing state, and completing exact/overpayment while updating cash and passenger status.
- [ ] **Step 2: Run the controller tests** and confirm they fail before implementation.
- [ ] **Step 3: Implement `GameController` around the pure systems** with immutable state updates and a single render callback.
- [ ] **Step 4: Implement `CashTray` denomination buttons** showing available counts and selected payment total.
- [ ] **Step 5: Implement `TransactionPanel`** with fare, payment, change, a complete button, and reset/new-passenger action.
- [ ] **Step 6: Run all tests and `npm run build`**; confirm the complete payment loop works without console errors.
- [ ] **Step 7: Commit `feat: complete fare and change gameplay loop`**.

### Task 5: Polish the MVP handoff

**Files:**
- Modify: `README.md`
- Modify: `src/styles/global.css`
- Modify: `src/styles/scene.css`
- Modify: `src/styles/interface.css`
- Create: `public/assets/.gitkeep` files for the planned asset folders only where needed.

- [ ] **Step 1: Add responsive styling** for a 16:9 desktop view and narrow mobile fallback.
- [ ] **Step 2: Add clear keyboard focus states and accessible button labels.**
- [ ] **Step 3: Run `npm test -- --run`, `npm run build`, and manually verify passenger selection, underpayment, exact payment, and change payment.**
- [ ] **Step 4: Document the controls, rules, and next-step journey work in README.**
- [ ] **Step 5: Commit `docs: document change mvp`**.

## Self-review

- The plan covers the first milestone, not the later Marry/Break/Hold mechanics or full journey results because their rules are not specified yet.
- The asset tree remains intentionally lightweight; the scene uses replaceable asset hooks and placeholders until artwork is supplied.
- Domain tests run independently of the DOM, preserving the rule/rendering boundary.
