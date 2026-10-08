# Match Odds Management Update

## Scope
- Keep the existing single-screen app, navigation, colors, wallet/header areas, tabs, and betting flow unchanged.
- Update only the existing match odds editor and public odds cards.

## Changes
- Reuse the current `MatchOdds`, `Selection`, slip, and market rendering structures.
- Display 1X2 as W1, X, W2 and Double Chance as 1X, 12, 2X in both admin and public views.
- Match the supplied Admin Panel card: a settings/title header with a prominent top-right `X Remove Market` action, followed by bordered 1X2, Double chance, and Over/under sections.
- In 1X2 and Double chance, place three odds cells on the left, one shared fluctuation cell beside them, and one narrow remove-market cell at the far right.
- In Over/under, use three rows (2.5, 3.5, 4.5); each row has Over and Under odds cells, paired `0.10 >` / `0.10 <` controls, and a far-right red X.
- Put each selection label at the upper left of its odds cell and its individual lock icon at the upper right, exactly as shown. Locked selections remain visible publicly as `LOCKED` and cannot be selected.
- Let admins clear and type arbitrary odds values without automatic prefixes or clamping. Each section/row fluctuation control applies its displayed step to the visible selections in that group.
- Keep the admin grid usable on the existing mobile width by preserving the mockup’s column relationships in a compact horizontal grid rather than redesigning other screens.
- Update active, unlocked public odds every 30 seconds using a bounded random walk from 1.003 to 1.500.
- Track each tick direction and show higher odds in green, lower odds in red, and unchanged odds in the normal foreground color.

## Validation
- Add focused tests for market ordering, free-form admin values, locking/removal behavior, and bounded fluctuation direction.
- Run the existing odds/slip tests and verify the admin and public cards in the mobile preview without changing other screens.

## Note
- The uploaded mockup is the visual source of truth for section borders, odds-cell labels, lock placement, fluctuation pairs, and right-edge remove actions. Existing app colors and reusable controls remain authoritative.