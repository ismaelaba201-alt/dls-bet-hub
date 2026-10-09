// Dual-wallet rules (Real MB + virtual Battle Coins). Pure functions; storage lives in use-wallet.
export type Network = "MTN" | "Airtel" | "Glo" | "9mobile";
export const NETWORKS: Network[] = ["MTN", "Airtel", "Glo", "9mobile"];
export type Currency = "MB" | "BC";
export type Profile = { phone: string; network: Network };
export type TxnKind = "Deposit" | "Withdraw" | "Stake" | "Win" | "BC Purchase" | "BC Credit";
export type Txn = { id: string; at: number; kind: TxnKind; currency: Currency; amount: number; note?: string | undefined };
export type Tier = { id: string; mb: number; bc: number; badge: string };
export type Settings = {
  ussd: string; currencyName: string; currencySymbol: string; tiers: Tier[];
  promoHeadline: string; promoBody: string; promoCta: string; slipNotice: string; slipLink: string;
};

export const DEFAULT_SETTINGS: Settings = {
  ussd: "*312*1#",
  currencyName: "Battle Coins",
  currencySymbol: "BC",
  tiers: [
    { id: "t1", mb: 50, bc: 500, badge: "Starter" },
    { id: "t2", mb: 100, bc: 1100, badge: "Popular" },
    { id: "t3", mb: 250, bc: 3000, badge: "Best Value" },
  ],
  promoHeadline: "Want real Data & MB?",
  promoBody: "Play Official Matches to win up to 10GB Data directly to your line!",
  promoCta: "Play Official Matches",
  slipNotice: "Playing for fun coins? Win real data on official matchdays.",
  slipLink: "Browse Official Game Codes ➔",
};

export type Limits = { min: number; max: number };
export const MB_LIMITS: Limits = { min: 10, max: 500 };
export const BC_LIMITS: Limits = { min: 50, max: 1000 };
export const STAKE_CHIPS = [10, 50, 100, 200, 500];
export const WITHDRAW_MIN = 500;
export const WITHDRAW_RESERVE = 100;

export function formatMB(mb: number): string {
  if (mb > 1000) return `${(Math.round(mb / 10) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} GB`;
  return `${(Math.round(mb * 100) / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })} MB`;
}

export function withdrawError(amount: number, balance: number): string | null {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount";
  if (amount > balance) return "Insufficient Balance";
  if (amount < WITHDRAW_MIN) return `Minimum withdrawal is ${WITHDRAW_MIN} MB`;
  if (amount !== balance && balance - amount < WITHDRAW_RESERVE) return `Keep at least ${WITHDRAW_RESERVE} MB in your wallet, or withdraw your full balance`;
  return null;
}

export function buyTierError(tier: Tier, mb: number): string | null {
  return tier.mb > mb ? "Insufficient Data Balance" : null;
}

export const validPhone = (p: string) => /^0\d{10}$/.test(p.replace(/\s/g, ""));

// Placeholder for the VTU provider; swap for a real server call later.
export async function dispatchVtu(req: { phone: string; network: Network; mb: number }): Promise<{ ref: string }> {
  void req;
  return { ref: "VTU-" + Date.now().toString(36).toUpperCase() };
}

export const ussdHref = (code: string) => "tel:" + code.replace(/#/g, "%23");
