# Match Odds Management Update

## Scope
- Keep the existing single-screen app, navigation, colors, wallet/header areas, tabs, and betting flow unchanged.
- Update only the existing match odds editor and public odds cards.

## Changes
- Reuse the current `MatchOdds`, `Selection`, slip, and market rendering structures.
- Display 1X2 as W1, X, W2 and Double Chance as 1X, 12, 2X in both admin and public views.
- Add per-selection admin lock controls. Locked selections remain visible publicly as `LOCKED` and cannot be selected.
- Let admins clear and type arbitrary odds values without automatic prefixes or clamping.
- Add right-aligned per-selection fluctuation controls and remove controls, plus preserve a prominent remove action in the match header.
- Update active, unlocked public odds every 30 seconds using a bounded random walk from 1.003 to 1.500.
- Track each tick direction and show higher odds in green, lower odds in red, and unchanged odds in the normal foreground color.

## Validation
- Add focused tests for market ordering, free-form admin values, locking/removal behavior, and bounded fluctuation direction.
- Run the existing odds/slip tests and verify the admin and public cards in the mobile preview without changing other screens.

## Note
- The referenced mockup was not included in the available upload area. Implementation will follow the written column order and control placement unless the image is reattached.