# Placeholder asset workflow

CHANGE uses a stable asset manifest in `src/data/assets.ts`. Game and scene code should import `assets` and use identifiers such as `assets.passengerDefault`; visual files must not be hard-coded throughout the application.

## Temporary assets

The MVP ships lightweight generated SVG placeholders in `public/assets/placeholders/`. They are deliberately labelled, use the intended rough proportions, and use transparent backgrounds for character assets. CSS remains a fallback for the existing scene composition, so a missing optional image should not stop the game from loading.

| Category | Current placeholder | Later replacement |
| --- | --- | --- |
| Bus interior | `bus-interior.svg` | Custom bus environment |
| Passengers | `passenger.svg` | Custom Nigerian passenger sprites |
| Conductor | `conductor.svg` | Custom conductor artwork |
| Naira notes | `note-100.svg`, `note-200.svg`, `note-500.svg`, `note-1000.svg` | Accurate custom currency sprites |
| Stops / route | `route-sign.svg` | Custom environmental props |
| Advertising | `interior-poster.svg`, `roadside-billboard.svg` | Sponsored artwork |

## Replacement rules

- Preserve the manifest key when replacing an asset.
- Keep the same approximate aspect ratio and transparent-background behavior for character assets.
- Prefer SVG or compressed WebP/PNG sized for the rendered slot; do not commit oversized source files.
- Record the source and license for freely licensed or stock assets before shipping them.
- Add new visual categories to the manifest first, then consume the new ID from scene/UI code.
