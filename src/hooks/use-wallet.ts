import { useEffect, useState } from "react";
import { DEFAULT_SETTINGS, type Currency, type Profile, type Settings, type Txn, type TxnKind } from "@/lib/wallet";

type State = { profile: Profile | null; mb: number; bc: number; txns: Txn[] };
const EMPTY: State = { profile: null, mb: 0, bc: 0, txns: [] };

export function useWallet() {
  const [s, setS] = useState<State>(EMPTY);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try { setS({ ...EMPTY, ...JSON.parse(localStorage.getItem("dls-wallet") ?? "{}") }); } catch {}
    try { setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem("dls-settings") ?? "{}") }); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem("dls-wallet", JSON.stringify(s)); }, [s, loaded]);

  const move = (currency: Currency, delta: number, kind: TxnKind, note?: string) =>
    setS((o) => ({
      ...o,
      [currency === "MB" ? "mb" : "bc"]: Math.round(((currency === "MB" ? o.mb : o.bc) + delta) * 100) / 100,
      txns: [{ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), at: Date.now(), kind, currency, amount: delta, note }, ...o.txns].slice(0, 50),
    }));

  return {
    ...s, settings,
    register: (profile: Profile) => setS((o) => ({ ...o, profile })),
    credit: (c: Currency, amt: number, kind: TxnKind, note?: string) => move(c, amt, kind, note),
    debit: (c: Currency, amt: number, kind: TxnKind, note?: string) => move(c, -amt, kind, note),
    saveSettings: (next: Settings) => { setSettings(next); localStorage.setItem("dls-settings", JSON.stringify(next)); },
  };
}
export type Wallet = ReturnType<typeof useWallet>;
