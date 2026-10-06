export const MIN_ODDS = 1.003;
export const MAX_ODDS = 1.5;

export type Fixture = { home: string; away: string; time: string };
export type Market = "1X2" | "Double Chance" | "Over/Under";
export type Selection = { key: string; label: string; market: Market; odds: number };
export type MatchOdds = Fixture & { id: string; selections: Selection[] };

// Historical baseline strength (0-100) for well-known clubs.
const RATINGS: Record<string, number> = {
  "real madrid": 95, "manchester city": 95, "man city": 95, "bayern munich": 92, bayern: 92,
  barcelona: 90, liverpool: 91, arsenal: 89, psg: 88, "paris saint-germain": 88, inter: 87,
  "inter milan": 87, chelsea: 84, "manchester united": 83, "man united": 83, "man utd": 83,
  juventus: 84, "atletico madrid": 85, "borussia dortmund": 83, dortmund: 83, "ac milan": 83,
  milan: 83, napoli: 82, tottenham: 81, spurs: 81, "bayer leverkusen": 84, leverkusen: 84,
  newcastle: 80, "aston villa": 79, roma: 78, benfica: 79, porto: 78, ajax: 76, sevilla: 75,
};

export function teamStrength(name: string): number {
  const key = name.trim().toLowerCase();
  if (RATINGS[key] != null) return RATINGS[key];
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return 60 + (h % 21); // unknown teams: stable 60-80
}

export const clampOdds = (v: number) => Math.round(Math.min(MAX_ODDS, Math.max(MIN_ODDS, v)) * 1000) / 1000;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function generateOdds(f: Fixture, id: string): MatchOdds {
  const sh = teamStrength(f.home);
  const sa = teamStrength(f.away);
  const gap = Math.min(1, Math.abs(sh - sa) / 35); // 0 = even, 1 = mismatch
  const fav = lerp(1.25, MIN_ODDS, gap); // favourite: 1.003-1.250
  const dog = lerp(1.35, MAX_ODDS, gap); // underdog: 1.350-1.500
  const homeFav = sh >= sa;
  const home = homeFav ? fav : dog;
  const away = homeFav ? dog : fav;
  const draw = lerp(1.3, 1.45, gap); // draws less likely in mismatches

  // Combined attacking strength drives goal markets (0..1).
  const attack = Math.min(1, Math.max(0, (sh + sa - 120) / 80));
  const over = (line: number) => lerp(1.1, 1.45, Math.min(1, (line - 2.5) / 2 * 0.7 + (1 - attack) * 0.3));
  const under = (line: number) => lerp(1.45, 1.05, Math.min(1, (line - 2.5) / 2 * 0.7 + (1 - attack) * 0.3));

  const s = (key: string, label: string, market: Market, odds: number): Selection => ({ key, label, market, odds: clampOdds(odds) });
  return {
    ...f,
    id,
    selections: [
      s("1", "1", "1X2", home),
      s("X", "X", "1X2", draw),
      s("2", "2", "1X2", away),
      s("1X", "1X", "Double Chance", (home + draw) / 2 - 0.1),
      s("X2", "X2", "Double Chance", (away + draw) / 2 - 0.1),
      s("12", "12", "Double Chance", Math.min(home, away) - 0.05),
      ...[2.5, 3.5, 4.5].flatMap((l) => [s(`O${l}`, `Over ${l}`, "Over/Under", over(l)), s(`U${l}`, `Under ${l}`, "Over/Under", under(l))]),
    ],
  };
}
