# CHANGE

CHANGE is a small danfo-conductor game prototype. The MVP starts with one bus interior, three selectable passengers, and one fare-and-change transaction.

## MVP controls

- Click a passenger to inspect their destination and fare.
- Choose one or more payment notes in the fare panel.
- Click **Collect fare** to validate the payment and calculate change.
- Underpayment leaves the passenger waiting; a valid payment marks them paid.

The first slice intentionally uses CSS/HTML placeholder artwork. The planned `public/assets` folders can replace the visual layer later without changing the game rules.

## Current scope

Implemented: one route, one bus interior, three passengers, fare lookup, denomination selection, payment validation, change calculation, and cash updates.

Next: stops, boarding/drop-offs, debt handling, Marry/Break/Hold decisions, scoring, results, audio, and deploy setup.

## Development

```bash
npm install
npm run dev
```

Run the test suite with `npm test -- --run` and build with `npm run build`.
