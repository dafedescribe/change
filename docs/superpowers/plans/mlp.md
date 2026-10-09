# CHANGE
## Minimum Lovable Product (MLP) Specification
**Product:** CHANGE  
**Genre:** Nigerian danfo conductor simulation / arcade management game  
**Platform:** Current repository target; preserve the existing technology stack  
**Status:** Product and implementation specification  
**Core route:** Oshodi → Yaba → Ojuelegba → Ketu

---

# 1. Product Vision

CHANGE is a fast-paced, replayable simulation of working as a Lagos danfo conductor.

The player collects fares, calculates and gives change, manages passengers who cannot be paid immediately, negotiates Hold / Marry / Break situations, deals with roadside levies, and tries to finish the journey with the best possible financial result and passenger experience.

The game should feel recognisably Nigerian through its transport culture, language, currency, passenger behaviour, roadside interactions, and atmosphere.

It should be easy to understand, challenging to master, and entertaining enough that players want to restart after a poor run or return to beat their previous score.

The experience should prioritise the conductor's job, not become a generic driving simulator or a static bus-interior viewer.

## Product promise

Every journey is a small financial and social puzzle. The player must collect the right fares, manage limited change, make decisions under pressure, and finish the route without losing too much money, time, or passenger goodwill.

## Core design principles

1. **Gameplay before decoration.** Every visual and system should support the conductor simulation.
2. **Meaningful decisions.** Players should choose between competing priorities rather than simply tap through dialogue.
3. **Readable financial state.** Players must understand what they collected, what they owe, what they spent, and what they earned.
4. **Replayable journeys.** Passenger combinations, cash constraints, and events should produce different decisions across runs.
5. **Fair difficulty.** Players should be punished for mistakes, not for unclear rules or unavoidable randomness.
6. **Authentic but accessible.** Use Nigerian transport culture without requiring prior knowledge of every local expression.
7. **Fast retries.** A completed or failed run should lead quickly into another attempt.
8. **Replaceable assets.** Temporary artwork must be easy to swap without rewriting gameplay logic.
9. **Honest monetisation.** Advertising should fit the transport setting and must not interfere with essential controls.
10. **Small, complete product.** Deliver one polished, replayable route before expanding the game's scope.

---

# 2. Target Player Experience

The player should experience five things:

- **Recognition:** The bus, passengers, cash, route, and conductor role feel familiar and distinct.
- **Pressure:** Several passengers may need attention while cash and time are limited.
- **Agency:** The player can make sensible choices to resolve difficult situations.
- **Consequences:** Mistakes affect cash, passenger satisfaction, journey performance, or final rank.
- **Mastery:** Better decisions and improved mental arithmetic lead to better results over repeated runs.

The intended session is a short, self-contained journey suitable for repeated play. Actual session length should be measured during testing rather than assumed.

---

# 3. The Core Gameplay Loop

Every run follows this loop:

1. Start a journey with a defined route, starting cash, and passenger scenario.
2. Observe passengers boarding and their fare requirements.
3. Collect fares and identify the denominations tendered.
4. Calculate the amount of change owed.
5. Give change immediately, or use an available Hold / Marry / Break action when appropriate.
6. Track unresolved payments and passenger obligations.
7. Respond to roadside levies and other journey events.
8. Advance through stops and resolve passengers leaving the bus.
9. Complete the route and reconcile the cash.
10. Receive a breakdown of earnings, losses, mistakes, satisfaction, and final rank.
11. Restart immediately or return to the main menu.

The player should always know what needs attention next.

The central tension is that a conductor cannot treat every transaction independently. A decision that solves one passenger's problem may create a cash shortage or delay another transaction.

---

# 4. Product Scope

## Included in the MLP

- One complete playable route: Oshodi → Yaba → Ojuelegba → Ketu.
- A bus-interior gameplay view.
- Passenger boarding, fare collection, change calculation, and passenger departure.
- Hold / Marry / Break mechanics.
- Partial-payment and outstanding-balance handling where supported by the design rules.
- Cash inventory and transaction accounting.
- Roadside levies and a small pool of other contextual events.
- Journey progression and end-of-run reconciliation.
- Scoring, grades or stars, and a final performance summary.
- Meaningful run variation and immediate replay.
- Basic sound and visual feedback, using temporary assets where necessary.
- A minimal main menu, pause/settings access, and game-over/results flow.
- An advertising-ready architecture with clearly separated gameplay and advertising content.
- Automated tests for core gameplay rules.
- Basic analytics hooks if feasible without introducing a costly external service.
- Documentation that accurately reflects implemented functionality.

## Explicitly out of scope for the initial MLP

Unless already substantially implemented, do not make these prerequisites for launch:

- Multiple playable roles.
- A complete driving simulator.
- Open-world Lagos exploration.
- A large map or many routes.
- Multiplayer.
- Real-time online leaderboards.
- A complex story campaign.
- Player accounts or cloud saves.
- A large permanent progression tree.
- A user-generated content system.
- Complex vehicle upgrades.
- Real-money gambling, betting, or paid random rewards.
- A fully voiced cast of passengers.
- A large custom 3D asset production pipeline.

The architecture should not unnecessarily block future expansion, but future possibilities must not delay the MLP.

---

# 5. Main Game Structure

The game should have the following functional states.

## 5.1 Main Menu

Purpose: Let players start playing with minimal friction.

Required elements:
- Game title and recognisable visual identity.
- Primary Play button.
- Best score or best journey result, if local persistence is available.
- Settings access.
- Sound controls.
- Optional How to Play entry for new players.
- Optional Credits or About entry.

Requirements:
- Play starts a new run without unnecessary intermediate screens.
- Returning players should not have to repeat the tutorial on every launch.
- A previous run must not accidentally leak its passengers, outstanding balances, or cash state into the next run.

## 5.2 Optional First-Run Tutorial

Teach the minimum rules needed to play.

The tutorial should introduce:
1. A passenger and the required fare.
2. How to inspect the money tendered.
3. How to calculate change.
4. How to give change.
5. What Hold means.
6. How Marry combines compatible transactions, if that is the intended game rule.
7. How Break resolves a held transaction or group.
8. How to identify a roadside levy.
9. How the journey ends and how final cash is reconciled.

Use short, contextual prompts rather than a long instructional wall.

The tutorial should teach the actual rules implemented in the game. It must not describe actions that the player cannot perform.

After completion, players should be able to skip the tutorial.

## 5.3 Active Gameplay

This is the primary game view.

The player should remain focused on the bus interior and conductor's tasks while still receiving enough context to understand the journey.

The active view must support:
- Passenger visibility and identification.
- Passenger fare information.
- Cash tendered and change owed.
- Transaction status.
- Hold / Marry / Break actions when valid.
- A readable cash summary.
- Journey progress and current stop.
- Active roadside or passenger events.
- Clear success, warning, and failure feedback.
- Pause or settings access.

Do not overload the screen with permanent menus, decorative statistics, or advertising.

## 5.4 Journey Results

At the end of the route, display:
- Total fares collected.
- Total money spent on legitimate in-game costs and levies.
- Outstanding amounts.
- Incorrect transactions or penalties.
- Net journey result.
- Passenger satisfaction or equivalent performance metric.
- Journey completion status.
- Final score and grade or stars.
- Personal best comparison, if available.
- Replay button.
- Main Menu button.

The results must explain the player's performance, not just display a score.

## 5.5 Pause and Settings

Provide:
- Resume.
- Restart Journey, with confirmation if progress would be lost.
- Sound on/off.
- Music on/off if music exists.
- Return to Main Menu.
- Any platform-specific pause handling already supported by the project.

Pausing must not silently advance passengers, timers, or financial events.

---

# 6. Bus Interior and Visual Presentation

The bus interior is the primary gameplay environment.

It should communicate the conductor's workplace immediately, with a clear sense of passenger seating, the front of the bus, the aisle, and the relationship between the conductor and passengers.

## Required visual information

- Distinct passenger positions.
- Clear visual or textual passenger identifiers.
- Visible passenger states.
- A consistent location for the fare transaction controls.
- A cash or money-management area.
- A route indicator.
- Space for contextual event prompts.
- Feedback that distinguishes successful actions, unresolved obligations, and mistakes.

## Visual style

Use a coherent, stylised representation of a Nigerian danfo rather than an overly generic modern bus.

The visual treatment can be illustrative, low-poly, hand-painted, or otherwise suited to the existing rendering technology. The important requirements are recognisability, consistency, legibility, and affordable asset production.

Avoid photorealistic complexity if it delays gameplay delivery.

## Asset replacement requirements

Every temporary asset should have a clear replacement path.

Separate:
- Gameplay rules.
- Passenger data.
- Asset references.
- Layout and presentation.
- Animation and sound triggers.

Passenger identities and gameplay states should not depend on filenames or hardcoded visual positions.

If an image is replaced, the fare system must continue to work.

Use a documented asset manifest or equivalent organisation so placeholder artwork can be replaced without modifying transaction logic.

---

# 7. Passenger System

Passengers are the principal source of gameplay variation.

Each passenger should have a stable identifier and an explicit state.

## Passenger data

Where applicable, represent:
- Unique passenger ID.
- Display name or short identifier.
- Fare required.
- Current location or seat.
- Boarding stop.
- Intended destination or departure stop.
- Payment status.
- Amount tendered.
- Outstanding balance.
- Change owed.
- Hold status.
- Satisfaction or patience state.
- Departure status.
- Any special behaviour or scenario tag.

Do not add personality fields simply for appearance if they do not affect gameplay.

## Passenger lifecycle

A passenger should progress through a coherent lifecycle, such as:

Waiting to board → On board → Payment pending → Paid or awaiting settlement → Ready to depart → Departed.

The exact states may differ according to the existing architecture, but transitions must be explicit and validated.

A passenger must not:
- Pay twice for the same obligation.
- Depart while still owing or being owed money unless the game rules explicitly permit it.
- Remain active after departure.
- Be processed twice by the same event.
- Reappear incorrectly after a journey restart.

## Passenger variation

Create a compact but varied set of passenger scenarios.

Examples:
- Passenger with exact fare.
- Passenger tendering a denomination larger than the fare.
- Passenger tendering an amount that cannot be changed immediately.
- Passenger who can participate in a valid Marry arrangement.
- Passenger whose outstanding change is needed to resolve another transaction.
- Passenger who has already paid and should not be charged again.
- Passenger approaching their destination with an unresolved balance.

Special behaviour should affect decisions, not exist solely as flavour text.

## Fairness

Players must be able to see the information required for a reasonable decision. Avoid hidden fare requirements or unannounced transaction rules.

If a passenger's patience is a mechanic, show clear feedback before a consequence occurs.

---

# 8. Fare and Payment System

Financial correctness is foundational. The player must be able to trust the game's money.

## Fare collection

For each transaction, the game must identify:
- Required fare.
- Amount tendered.
- Amount paid toward the fare.
- Change owed, if any.
- Remaining fare balance, if any.
- Transaction status.

For a fully paid fare:

**Change owed = Amount tendered − Fare required**

This formula applies only when the tendered amount is at least the required fare.

## Exact payment

If the passenger tenders the exact fare:
- Accept the payment.
- Record the fare as collected.
- Set change owed to zero.
- Mark the fare obligation as settled.

## Overpayment

If the passenger tenders more than the fare:
- Record the fare collected.
- Calculate the correct change.
- Prevent the same payment from being counted more than once.
- Allow the valid change-resolution mechanics to operate.

## Underpayment

If the passenger tenders less than the fare:
- Do not silently mark the full fare as paid.
- Record the amount received.
- Record the outstanding fare balance.
- Allow further payment if the game supports it.
- Otherwise reject the transaction with clear feedback.

An underpayment must not inflate revenue or make the passenger eligible for actions that require a fully paid fare unless the rules explicitly support that case.

## Transaction integrity

Each financial transaction should have a unique ID or equivalent identity.

The system must preserve a clear record of:
- Money received.
- Money returned as change.
- Outstanding balances.
- Money spent.
- Money owed to or by a passenger.
- Any adjustments or penalties.

Where feasible, represent money as integer minor units or whole naira rather than floating-point values. Do not allow rounding errors to create or destroy money.

Every transaction must be applied once, and only once.

---

# 9. Hold / Marry / Break Mechanics

These mechanics are central to the game's identity and should be treated as real financial rules, not merely themed buttons.

The implementation must use one consistent definition for each action. If existing code and documentation disagree, resolve the intended behaviour explicitly before changing it.

## 9.1 Hold

Purpose: Temporarily defer an unresolved change obligation or other supported transaction while the conductor manages cash.

Requirements:
- Hold is only available when the transaction meets the game's eligibility rules.
- The held transaction remains financially unresolved.
- The passenger's actual payment status must not be falsified.
- The amount owed must remain visible and accurate.
- Holding a transaction must not duplicate revenue.
- The player must be able to identify held transactions and resolve them later.
- A held transaction must not disappear when the player moves to another passenger.
- Any time, patience, or penalty consequence must be explicit and testable.

Holding a transaction must not automatically imply that the passenger has completed every payment obligation.

## 9.2 Marry

Purpose: Combine compatible outstanding change obligations or transactions to reduce immediate cash pressure, according to the game's chosen rules.

Requirements:
- Only valid candidates should be shown.
- Candidate eligibility must match the documented gameplay rules.
- The amount owed by each participating transaction must be tracked independently.
- The combined settlement must preserve total money.
- The player must understand which transactions are being combined.
- An invalid combination must be rejected safely.
- The same obligation must not be used twice.
- A successful Marry must produce a clear status change and feedback.

If the design allows pending and held transactions to participate, implement and test both cases. Do not restrict candidate discovery to held transactions while the documented rule says otherwise.

## 9.3 Break

Purpose: Resolve or separate a held or combined transaction when the required cash or compatible transaction becomes available, according to the intended game rules.

Requirements:
- Define exactly which transaction states can be broken.
- Verify that the player has the required denominations or settlement capacity.
- Prevent negative cash balances unless a specific game rule allows them.
- Ensure that every participating transaction reaches a valid state.
- Restore individual obligations correctly if a combination is undone.
- Prevent the same money from being allocated to multiple passengers.
- Display the result clearly.

## 9.4 Invalid actions

If an action is unavailable or invalid:
- Do not mutate financial state.
- Do not remove a passenger.
- Do not deduct money.
- Show a short explanation.
- Keep the player in the active journey.

The rules for Hold, Marry, and Break must be covered by automated tests.

---

# 10. Cash Inventory and Reconciliation

The player should manage cash as a limited resource, not merely watch a single revenue counter.

## Cash inventory

Track the player's available cash and, if denominations are part of the gameplay, the number or value of each denomination.

The system should distinguish:
- Starting cash.
- Fares received.
- Change paid out.
- Money spent on levies or other events.
- Outstanding change obligations.
- Outstanding fare balances.
- Final cash on hand.

## Denomination management

If denominations are modelled:
- Display denominations clearly.
- Only allow change to be paid when the player has sufficient valid denominations.
- Update the inventory immediately after a successful payment.
- Do not allow the inventory to go negative accidentally.
- Ensure that a failed transaction leaves the inventory unchanged.

The UI should not require the player to inspect a long accounting table during active play.

## Reconciliation

At the end of a run, calculate the financial result from the underlying transaction ledger.

The final accounting should be consistent with:

**Ending cash = Starting cash + Cash received − Cash paid out**

Cash paid out includes change, levies, expenses, and any other valid outflow.

Outstanding obligations must be reported separately. They must not be silently treated as settled cash.

If the game has a concept of profit, distinguish profit from cash on hand and define how outstanding amounts affect the final score.

The ledger is the source of truth. Do not calculate the final result by summing unrelated UI counters.

---

# 11. Journey System

The initial MLP uses one route:

**Oshodi → Yaba → Ojuelegba → Ketu**

The route should be a complete, playable journey with identifiable stops and meaningful progression.

## Required behaviour

- The journey starts at Oshodi.
- Stops advance in the intended order.
- The current stop is always visible.
- Passengers can board and depart according to their destinations.
- Stop progression cannot occur accidentally or twice from a single action.
- Any required passenger obligations are handled according to the game rules.
- The final stop triggers the end-of-journey process.
- Restarting creates a clean new journey.

## Stop-based variation

Passenger destinations and boarding points should create different passenger combinations at different stops.

This should make journey progression matter. The player should not simply resolve a fixed list of identical transactions with no relationship to the route.

## Completion

The route should finish when its completion conditions are met.

Define what happens if:
- A passenger still has an outstanding balance.
- Change is still owed.
- A passenger is unresolved.
- A roadside event is still active.
- The player has insufficient cash.
- A passenger leaves before a transaction is settled.

The player should receive a coherent result rather than being silently forced into a perfect financial state.

---

# 12. Roadside Events and Levies

Roadside events introduce additional pressure and variation.

The MLP should include a small, controlled set of event types rather than a large random-event catalogue.

## Required event category

At least one roadside levy or equivalent cost should be implemented as a real financial transaction.

## Optional event types

Where appropriate to the existing design:
- A roadside levy.
- A temporary traffic delay.
- A passenger dispute.
- A change-related complication.
- A time-sensitive decision.
- An unexpected expense or opportunity.

Do not add all of these automatically. Prioritise the events that create meaningful conductor decisions.

## Event requirements

Every event must define:
- Trigger conditions.
- Whether it is random or scenario-driven.
- Available player choices.
- Financial consequences.
- Any effects on passenger satisfaction or journey progress.
- Completion conditions.
- Failure or cancellation behaviour.

Events must be understandable before the player commits to a consequential action.

## Fair randomness

Random events should change the situation without making a successful run impossible through bad luck alone.

Use bounded randomness and validate event consequences.

Provide a way to reproduce a scenario using a fixed seed or equivalent deterministic setup during development and testing, if supported by the architecture.

Do not make the first run needlessly punishing.

---

# 13. Replayability System

Replayability is a core MLP requirement, not a future cosmetic feature.

A complete route is not automatically replayable. The game needs meaningful variation between runs.

## 13.1 Passenger scenario variation

Vary combinations of:
- Fare values.
- Tendered denominations.
- Exact payments and overpayments.
- Change shortages.
- Hold eligibility.
- Marry compatibility.
- Passenger destinations.
- Arrival and departure order.
- Special situations.

Variation should affect decisions, not merely change passenger names or colours.

## 13.2 Starting conditions

Use a small set of balanced starting scenarios.

Possible variations:
- Different starting cash compositions.
- Different concentrations of passengers requiring change.
- Different passenger combinations.
- Different starting cash pressure.
- Different event sequences.

Do not make every variable random. The player must still have a fair opportunity to succeed.

## 13.3 Event variation

Select from a small pool of validated events.

Avoid:
- Repeating the same event too frequently without a reason.
- Unavoidable sequences that guarantee failure.
- Event effects that contradict the financial ledger.
- Events that interrupt essential transaction feedback.

## 13.4 Meaningful decisions

Replayability must emerge from situations where the player chooses between competing priorities.

Examples:
- Give available change to one passenger now or hold a valid transaction while managing another.
- Resolve a transaction individually or combine compatible obligations.
- Preserve small denominations for later passengers or spend them now.
- Accept an event cost or take another permitted action.
- Prioritise an approaching passenger departure or another unresolved transaction.

These examples describe the intended design space. Implement only choices supported by the actual gameplay rules.

## 13.5 Personal best

Store a local personal best if the current platform and architecture support reliable local persistence.

Track an appropriate combination of:
- Best score.
- Best net result.
- Best star rating.
- Completed journeys.
- Optional consecutive successful runs.

Keep the initial implementation simple. Do not require a backend account system.

## 13.6 Immediate replay

The results screen must provide a prominent Replay action.

Replay must:
- Reset the journey state.
- Reset or regenerate passengers according to the scenario rules.
- Reset transaction ledgers.
- Reset the cash inventory.
- Reset event state.
- Reset timers and temporary UI state.
- Preserve legitimate persistent records such as personal bests.
- Avoid carrying unresolved obligations into the new run.

## Replayability acceptance test

After several consecutive runs, the player should face materially different decisions and have a reason to improve their result.

Changing only names, colours, or event text does not count as meaningful replayability.

---

# 14. Scoring and Performance

The score should reward good conductorship rather than simply rewarding the collection of more money.

## Potential scoring dimensions

- Journey completion.
- Correct fare collection.
- Correct change calculations.
- Accurate financial reconciliation.
- Appropriate handling of outstanding balances.
- Successful Hold / Marry / Break decisions.
- Avoidance of preventable losses.
- Passenger satisfaction, if implemented.
- Effective management of roadside costs.

## Scoring rules

- Define scoring rules centrally.
- Avoid duplicating score calculations across UI components.
- Ensure the same action cannot earn points repeatedly.
- Penalise only clearly communicated mistakes.
- Avoid making one optional mechanic mandatory for a good score unless the design explicitly requires it.
- Do not award a perfect result if the financial ledger contains unresolved discrepancies.

## Grade or star rating

Use a small, understandable grading scale.

The exact thresholds should be tuned during playtesting.

Show the player:
- Their grade or stars.
- The most important reasons for the result.
- One or two actionable areas for improvement.
- Their personal best comparison when available.

The results screen should motivate another run without shaming the player.

---

# 15. Advertising and Monetisation

Advertising is part of the commercial plan, but it must not weaken the core game.

## Principle

The in-world bus environment provides natural opportunities for branded content. Advertising should feel like part of the setting, while the actual gameplay remains readable and uninterrupted.

## MLP advertising approach

Prepare an advertising-ready asset and content structure.

Potential placements:
- Interior bus posters.
- Small branded stickers.
- Passenger clothing or accessories.
- Roadside billboards visible during route progression.
- Optional branded event content.

Use generic fictional brands as placeholders until legitimate brand assets and agreements are available.

## Advertising requirements

- Gameplay rules must not depend on an advertisement loading.
- Advertising assets must be replaceable without changing gameplay code.
- Ads must not obscure passenger information, fare controls, or critical feedback.
- Ads must not make text unreadable.
- Ads must not interrupt a transaction.
- Ads must not secretly change gameplay difficulty.
- Branded content must not be presented as an actual partnership unless one exists.

## Initial implementation

For the MLP:
1. Establish reserved placement points or a small content configuration for in-world advertisements.
2. Use fictional placeholder advertisements.
3. Keep the advertising content separate from the transaction and scoring systems.
4. Document how a real advertising provider could be integrated later.

Do not make live ad-network integration a launch blocker unless it is already a confirmed product requirement.

If live ads are introduced, use the appropriate platform-supported SDK and comply with its privacy and advertising requirements.

## Monetisation measurement

If analytics are available without unnecessary cost, prepare to measure:
- Journey starts.
- Journey completions.
- Replay frequency.
- Session duration.
- Results-screen exits.
- Ad placement visibility or impressions, only where supported and compliant.

Do not collect unnecessary personal information. Do not fabricate impressions or count decorative placeholder posters as paid advertising views.

---

# 16. Audio and Feedback

Sound should reinforce the setting and the player's actions.

## Priority sounds

- Fare accepted.
- Change paid.
- Hold activated.
- Marry completed.
- Break completed.
- Invalid transaction.
- Roadside event.
- Journey completed.
- Results revealed.

Optional ambience can include a restrained bus interior or Lagos transport atmosphere.

## Requirements

- Important feedback must also be visible, not audio-only.
- Sound must be switchable.
- Missing audio assets must not break gameplay.
- Repeated actions must not produce overwhelming sound spam.
- Use placeholder audio when necessary and document replacement paths.
- Avoid expensive custom voice acting in the initial MLP.

---

# 17. Interface and Accessibility

The interface must support fast decisions and clear financial understanding.

## Readability

- Use high-contrast text.
- Keep fare, tendered amount, change owed, and transaction status distinct.
- Use consistent labels and number formatting.
- Do not rely on colour alone to indicate success or failure.
- Provide text labels or tooltips for unfamiliar mechanics.
- Ensure interactive controls have sufficiently large hit areas for the intended platform.

## Interaction

- Show only valid actions when practical.
- If invalid actions remain visible, explain why they are unavailable.
- Provide immediate feedback after an action.
- Prevent double taps from duplicating financial transactions.
- Make the current passenger or transaction obvious.
- Keep the player's current cash and outstanding obligations easy to inspect.

## Layout

The primary gameplay view should prioritise:
1. Passenger and transaction context.
2. Available action controls.
3. Cash status.
4. Journey progress.
5. Secondary information and decoration.

Do not sacrifice transaction clarity to fit more decorative content.

---

# 18. Technical Architecture

Preserve the repository's existing framework, module boundaries, and established patterns wherever practical.

Do not rewrite the project simply to make it conform to a preferred architecture.

## Recommended separation of responsibilities

### Game state
Owns the authoritative current journey state.

### Fare system
Validates fare requirements, payments, underpayments, and change calculations.

### Cash system
Owns cash inventory and denomination changes.

### Transaction system
Records financial transactions and maintains outstanding obligations.

### Danfo mechanics system
Implements Hold / Marry / Break eligibility, execution, and state transitions.

### Journey system
Owns route progression, stop transitions, and journey completion.

### Roadside event system
Owns event eligibility, choices, and event consequences.

### Scoring system
Calculates performance from authoritative gameplay results.

### Presentation layer
Renders the bus interior, passengers, controls, animation, and feedback.

### Data and assets
Owns passenger definitions, fares, route configuration, events, sound references, and replaceable visual assets.

These are conceptual responsibilities. Reuse existing modules where they already fulfil the role.

## Architecture rules

- Keep financial calculations outside presentation components.
- Keep gameplay rules testable without rendering the game.
- Avoid duplicating transaction state in unrelated modules.
- Avoid using visual labels as authoritative gameplay data.
- Validate actions before applying state changes.
- Keep asset references replaceable.
- Use typed data structures where supported.
- Keep random scenario generation separate from deterministic gameplay resolution.
- Avoid adding unnecessary services, databases, or external dependencies.
- Do not commit secrets, private credentials, or unnecessary environment files.

---

# 19. Error Handling and Edge Cases

The MLP must handle invalid states safely.

At minimum, test:
- Passenger ID not found.
- Passenger already departed.
- Passenger already fully paid.
- Duplicate fare collection.
- Tendered amount below the fare.
- Insufficient change.
- Invalid denomination selection.
- Attempt to pay the same change obligation twice.
- Hold on an ineligible transaction.
- Marry with incompatible transactions.
- Marry with an already settled obligation.
- Break on an ineligible transaction.
- Insufficient cash for an event.
- Event triggered twice.
- Journey advanced twice.
- Passenger departure with unresolved obligations.
- Results calculated before all required transitions finish.
- Restart during a pending transaction.
- Replay after a failed or incomplete journey.
- Empty or malformed passenger scenario.
- Missing placeholder asset.
- Missing optional sound.
- Rapid repeated input.
- App pause and resume during gameplay, where supported.

An invalid action should never corrupt the financial ledger.

---

# 20. Automated Testing Requirements

Tests must verify gameplay behaviour, not just whether functions return a value.

## Fare tests
- Exact fare.
- Overpayment.
- Underpayment.
- Correct change.
- No duplicate fare collection.
- Correct outstanding balance.
- Invalid passenger or transaction handling.

## Cash tests
- Correct cash received.
- Correct change paid.
- Correct denomination updates.
- Insufficient change.
- Invalid cash action leaves inventory unchanged.
- No accidental negative cash.
- Reconciliation matches the ledger.

## Hold / Marry / Break tests
- Hold an eligible transaction.
- Reject an ineligible Hold.
- Correctly discover valid Marry candidates.
- Support all transaction states allowed by the design.
- Reject incompatible Marry candidates.
- Preserve each obligation's identity.
- Correctly resolve a valid Break.
- Reject invalid Break actions.
- Prevent duplicate settlement.
- Preserve total money through every transition.

## Journey tests
- Correct route order.
- Correct stop progression.
- Passenger boarding and departure.
- Final-stop completion.
- Unresolved obligations handled consistently.
- No double progression.
- Clean restart.

## Roadside event tests
- Valid trigger conditions.
- Correct financial impact.
- No duplicate charge.
- Correct cancellation or resolution.
- Insufficient funds handled according to the rules.

## Scoring tests
- Score reflects valid gameplay outcomes.
- No duplicate rewards.
- Penalties are applied once.
- Unresolved obligations affect the result as designed.
- Final score matches the authoritative state.

## Replay tests
- New journey state is clean.
- Cash resets correctly.
- Passenger state resets correctly.
- Transaction ledger resets correctly.
- Event state resets correctly.
- Personal best persists when expected.
- Different scenario seeds can produce different valid situations.
- Fixed seeds reproduce scenarios during tests.

## Complete-journey test

At least one integration test must run a full journey from start to finish, perform realistic transactions and events, reconcile the cash, calculate the score, and verify the final result.

Do not declare the game ready based only on isolated unit tests.

---

# 21. Content Authoring and Placeholder Asset Plan

The MLP should use a small set of coherent, temporary assets rather than waiting for a complete art pipeline.

## Required placeholder groups

- Bus interior background.
- Passenger sprites or portraits.
- Passenger seat or position markers.
- Cash and denomination visuals.
- Route and stop indicators.
- Hold / Marry / Break visual indicators.
- Roadside event illustrations or icons.
- Results-screen graphics.
- Generic advertising posters and stickers.
- Basic audio cues.

## Asset rules

- Every placeholder should have a documented replacement location.
- Use consistent dimensions and visual style within each group.
- Do not hardcode gameplay meaning into images.
- Use fallbacks for optional missing assets.
- Keep licensed, generated, and temporary assets identifiable in project documentation.
- Avoid watermarked images or unlicensed commercial artwork.
- Use generic fictional brands for advertisement placeholders.
- Prefer fewer coherent assets over a large collection of mismatched visuals.

The first art pass should make the game readable and recognisable. Detailed animation and polished art can follow after the core loop is stable.

---

# 22. Analytics and Playtesting

If practical, instrument a small set of anonymous gameplay events.

Useful events:
- Run started.
- Tutorial completed.
- Transaction completed.
- Invalid action attempted.
- Hold / Marry / Break used.
- Roadside event resolved.
- Run completed.
- Run abandoned.
- Replay started.
- Personal best beaten.

Do not add analytics infrastructure that creates disproportionate cost or complexity.

## Playtesting questions

Observe whether players can answer:
- What fare does this passenger owe?
- How much money did the passenger tender?
- How much change is owed?
- Why can or cannot this transaction be held?
- Which transactions can be married?
- What happens when a transaction is broken?
- How much cash do they have left?
- Why did their score change?
- What should they do differently on the next run?

If players repeatedly misunderstand a rule, fix the rule presentation before adding more features.

## Replayability questions

After several runs, determine:
- Are passenger situations sufficiently different?
- Does the player make different decisions?
- Can players explain how to improve?
- Are losses caused by understandable mistakes?
- Are some scenarios unfair or effectively unwinnable?
- Do players choose Replay without being prompted?
- Do they attempt to beat their previous score?

These observations are more valuable than adding features based on assumptions.

---

# 23. Implementation Order

Implement in dependency order, adapting the sequence to the repository's current state.

## Phase 1: Audit and establish a baseline

- Inspect the repository and current implementation.
- Read the existing product and technical documentation.
- Identify implemented, incomplete, duplicated, and missing systems.
- Run the existing tests and build.
- Record existing failures before changing code.
- Establish the intended rules for Hold / Marry / Break and outstanding balances.
- Identify any architecture changes necessary to prevent financial inconsistencies.

**Exit condition:** A clear baseline and a documented list of defects.

## Phase 2: Correct financial integrity

- Fix fare collection and underpayment handling.
- Fix change calculations.
- Make transaction state explicit.
- Correct cash inventory updates.
- Correct Hold / Marry / Break eligibility and settlement.
- Ensure all financial actions are atomic and cannot be applied twice.
- Establish authoritative reconciliation.

**Exit condition:** Financial unit tests pass and invalid actions do not corrupt state.

## Phase 3: Complete the journey

- Verify route order and stop progression.
- Implement or repair passenger lifecycle transitions.
- Resolve passenger departure and outstanding obligations.
- Ensure the final stop triggers the correct results process.
- Ensure restart resets the entire run.

**Exit condition:** A full journey can be completed without inconsistent state.

## Phase 4: Complete scoring and roadside events

- Verify event triggers and financial consequences.
- Add or repair event resolution.
- Implement consistent score calculation.
- Implement the final results breakdown.
- Add meaningful grade or star thresholds.

**Exit condition:** The final result accurately reflects the journey ledger.

## Phase 5: Add minimum replayability

- Implement validated passenger scenario variation.
- Introduce a small pool of balanced starting conditions.
- Add controlled event variation.
- Add reproducible scenario seeds for development if supported.
- Store a personal best locally where practical.
- Add immediate replay.

**Exit condition:** Repeated runs can create different valid decisions, and the player can compare results.

## Phase 6: Complete the visual experience

- Finish the active bus-interior view.
- Ensure all important gameplay states are visible.
- Add success, failure, and warning feedback.
- Add basic sound.
- Add the results screen and simple settings.
- Replace missing or broken asset references with documented placeholders.

**Exit condition:** A new player can understand and complete a journey without developer intervention.

## Phase 7: Advertising readiness

- Add fictional in-world advertising placeholders.
- Separate advertisement configuration from gameplay code.
- Verify ads cannot obscure critical controls.
- Document possible future ad-network integration.

**Exit condition:** The game has replaceable advertising placements without depending on live advertising services.

## Phase 8: Final verification

- Run the complete automated test suite.
- Run the production build.
- Fix regressions.
- Complete at least one full journey manually.
- Complete multiple runs to assess variation.
- Verify replay and personal-best behaviour.
- Review documentation against the actual code.
- Record remaining limitations honestly.

**Exit condition:** The MLP is playable, testable, coherent, and ready for structured playtesting.

---

# 24. Definition of Done

CHANGE's MLP is complete only when all critical conditions below are met.

## Functional completeness
- [ ] The player can start a new journey.
- [ ] The player can collect fares.
- [ ] Exact payments, overpayments, and underpayments behave correctly.
- [ ] Change calculations are correct.
- [ ] Cash inventory updates accurately.
- [ ] Hold works according to explicit eligibility rules.
- [ ] Marry works for valid combinations.
- [ ] Break resolves or separates eligible transactions correctly.
- [ ] Invalid actions do not corrupt the game state.
- [ ] Passengers progress through a coherent lifecycle.
- [ ] The route progresses from Oshodi through Yaba and Ojuelegba to Ketu.
- [ ] Roadside events have valid and consistent consequences.
- [ ] A completed journey produces a financial reconciliation.
- [ ] The player receives a score and understandable result.
- [ ] Replay creates a clean new run.
- [ ] Repeated runs can produce meaningfully different situations.
- [ ] Personal best persists when supported by the platform.
- [ ] Placeholder assets can be replaced without rewriting gameplay logic.

## Quality
- [ ] Core gameplay rules have automated tests.
- [ ] At least one complete journey has an integration test.
- [ ] The test suite passes.
- [ ] The production build succeeds.
- [ ] No known critical financial-state corruption remains.
- [ ] Critical controls remain visible and usable.
- [ ] Missing optional assets do not crash the game.
- [ ] Documentation accurately reflects the implementation.

Do not mark a checklist item complete without verifying it.

---

# 25. Prioritisation Rules

When time or resources are limited, prioritise in this order:

1. Correct financial logic.
2. A complete and understandable journey.
3. Working Hold / Marry / Break mechanics.
4. Reliable cash reconciliation.
5. Meaningful replayability.
6. Clear feedback and usable controls.
7. Results, grades, and personal best.
8. Coherent placeholder art and sound.
9. Advertising-ready placements.
10. Additional polish and optional features.

Do not add new routes, extensive passenger dialogue, complex animations, live advertising integrations, or permanent progression systems while essential gameplay rules remain unreliable.

---

# 26. Final Product Standard

The MLP should not be judged by how many screens or features it contains.

It should be judged by whether the player can experience a complete, coherent, recognisably Nigerian conductor journey; make difficult but fair financial decisions; understand the consequences; finish with a trustworthy result; and immediately want to try again.

The target is not simply a playable prototype.

It is a small but genuinely enjoyable game whose core mechanics already provide a reason to return.

**Release principle: One excellent route with a dependable, replayable gameplay loop is more valuable than several incomplete routes with shallow mechanics.**