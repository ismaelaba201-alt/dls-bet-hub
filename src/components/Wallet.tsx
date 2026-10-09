import { useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowDownToLine, ArrowUpFromLine, Bell, Coins, Plus, Save, Smartphone, Wifi, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Wallet } from "@/hooks/use-wallet";
import { NETWORKS, WITHDRAW_MIN, WITHDRAW_RESERVE, buyTierError, dispatchVtu, formatMB, ussdHref, validPhone, withdrawError, type Network, type Settings, type Tier } from "@/lib/wallet";

export type WalletModal = null | "activate" | "green" | "deposit" | "bc";

export function WalletPills({ wallet, setModal }: { wallet: Wallet; setModal: (m: WalletModal) => void }) {
  const [bell, setBell] = useState(false);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col gap-1">
        <button onClick={() => setModal(wallet.profile ? "green" : "activate")} aria-label="Data wallet" className="flex h-6 items-center gap-1 rounded-full border border-primary/50 bg-primary/15 px-2 font-mono text-[10px] font-black text-primary">
          <Wifi size={11} /> {formatMB(wallet.mb).replace(" ", "")}
        </button>
        <button onClick={() => setModal("bc")} aria-label={wallet.settings.currencyName} className="flex h-6 items-center gap-1 rounded-full border border-warning/50 bg-warning/15 px-2 font-mono text-[10px] font-black text-warning">
          <Coins size={11} /> {wallet.bc.toLocaleString("en-US")} {wallet.settings.currencySymbol}
        </button>
      </div>
      <div className="relative">
        <Button variant="ghost" size="icon" onClick={() => setBell((v) => !v)} aria-label="Notifications" className="size-8">
          <Bell size={17} />
          {wallet.txns.length > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive" />}
        </Button>
        {bell && (
          <div className="absolute right-0 top-9 z-50 w-64 rounded-lg border border-border bg-background p-3 shadow-xl">
            <p className="mb-2 text-[10px] font-black uppercase text-muted-foreground">Notifications</p>
            {wallet.txns.length ? <TxnList wallet={wallet} limit={5} /> : <p className="text-xs text-muted-foreground">No notifications yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function WalletModals({ wallet, modal, setModal, admin, notify, onOfficial }: { wallet: Wallet; modal: WalletModal; setModal: (m: WalletModal) => void; admin: boolean; notify: (m: string) => void; onOfficial: () => void }) {
  if (!modal) return null;
  const close = () => setModal(null);
  if (modal === "activate") return <Activate wallet={wallet} close={close} onDone={() => { setModal("green"); notify("Wallet activated"); }} />;
  if (modal === "green" || modal === "deposit") return <Green wallet={wallet} close={close} admin={admin} notify={notify} startDeposit={modal === "deposit"} />;
  return admin ? <BcAdmin wallet={wallet} close={close} notify={notify} /> : <BcUser wallet={wallet} close={close} notify={notify} onOfficial={() => { close(); onOfficial(); }} />;
}

function Sheet({ title, close, children }: { title: string; close: () => void; children: ReactNode }) {
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="glass-panel flex max-h-[90dvh] w-full max-w-md flex-col rounded-lg">
        <div className="flex shrink-0 items-center justify-between p-4 pb-2">
          <h2 className="font-heading text-2xl font-bold uppercase">{title}</h2>
          <Button variant="ghost" size="icon" onClick={close} aria-label="Close"><X /></Button>
        </div>
        <div className="space-y-3 overflow-y-auto overscroll-contain p-4 pt-1">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

function PhoneFields({ phone, network, setPhone, setNetwork }: { phone: string; network: Network; setPhone: (v: string) => void; setNetwork: (n: Network) => void }) {
  return (
    <>
      <label className="block text-[10px] font-bold uppercase text-muted-foreground">Phone number
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="08012345678" className="mt-1 bg-field text-sm" />
      </label>
      <div>
        <p className="mb-1 text-[10px] font-bold uppercase text-muted-foreground">Network provider</p>
        <div className="grid grid-cols-4 gap-1.5">
          {NETWORKS.map((n) => <Button key={n} type="button" variant={network === n ? "default" : "secondary"} onClick={() => setNetwork(n)} className="h-9 text-[11px] font-black">{n}</Button>)}
        </div>
      </div>
    </>
  );
}

function Activate({ wallet, close, onDone }: { wallet: Wallet; close: () => void; onDone: () => void }) {
  const [phone, setPhone] = useState("");
  const [network, setNetwork] = useState<Network>("MTN");
  const ok = validPhone(phone);
  return (
    <Sheet title="Activate Wallet" close={close}>
      <p className="text-xs text-muted-foreground">Link your line to stake and receive data winnings.</p>
      <PhoneFields phone={phone} network={network} setPhone={setPhone} setNetwork={setNetwork} />
      {phone && !ok && <p className="text-xs text-destructive">Enter an 11-digit number starting with 0</p>}
      <Button disabled={!ok} onClick={() => { wallet.register({ phone: phone.replace(/\s/g, ""), network }); onDone(); }} className="h-12 w-full text-xs font-black uppercase">Save & activate</Button>
    </Sheet>
  );
}

function Green({ wallet, close, admin, notify, startDeposit }: { wallet: Wallet; close: () => void; admin: boolean; notify: (m: string) => void; startDeposit: boolean }) {
  const [view, setView] = useState<"home" | "deposit" | "withdraw">(startDeposit ? "deposit" : "home");
  const [phone, setPhone] = useState(wallet.profile?.phone ?? "");
  const [network, setNetwork] = useState<Network>(wallet.profile?.network ?? "MTN");
  const [amt, setAmt] = useState("");
  const [busy, setBusy] = useState(false);
  const amount = Number(amt);
  const err = withdrawError(amount, wallet.mb);
  const withdraw = async () => {
    if (err || !validPhone(phone)) return;
    setBusy(true);
    const { ref } = await dispatchVtu({ phone, network, mb: amount });
    setBusy(false);
    wallet.debit("MB", amount, "Withdraw", `${network} ${phone} • ${ref}`);
    notify(`${formatMB(amount)} sent to ${phone}`);
    setView("home"); setAmt("");
  };
  return (
    <Sheet title="Data Wallet" close={close}>
      <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-center">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Live balance</p>
        <p className="font-mono text-4xl font-black text-primary">{formatMB(wallet.mb)}</p>
        {wallet.profile && <p className="mt-1 text-[10px] text-muted-foreground">{wallet.profile.network} • {wallet.profile.phone}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => setView("deposit")} className="h-11 text-xs font-black uppercase"><ArrowDownToLine /> Deposit</Button>
        <Button variant="secondary" onClick={() => setView("withdraw")} className="h-11 text-xs font-black uppercase"><ArrowUpFromLine /> Withdraw</Button>
      </div>
      {view === "deposit" && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs">Dial <span className="font-mono font-black text-primary">{wallet.settings.ussd}</span> to send data to the game. Your balance updates once it is confirmed.</p>
          <Button asChild className="h-11 w-full text-xs font-black uppercase"><a href={ussdHref(wallet.settings.ussd)}><Smartphone /> Open dialer</a></Button>
          {admin && <Button variant="outline" onClick={() => { wallet.credit("MB", 500, "Deposit", "Admin test credit"); notify("500 MB credited"); }} className="w-full border-dashed text-xs text-primary"><Plus /> Admin: credit 500 MB</Button>}
        </div>
      )}
      {view === "withdraw" && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <PhoneFields phone={phone} network={network} setPhone={setPhone} setNetwork={setNetwork} />
          <label className="block text-[10px] font-bold uppercase text-muted-foreground">Amount (MB)
            <Input type="number" inputMode="numeric" value={amt} onChange={(e) => setAmt(e.target.value)} placeholder={`Min ${WITHDRAW_MIN}`} className="mt-1 bg-field text-sm" />
          </label>
          <p className="text-[10px] text-muted-foreground">Minimum {WITHDRAW_MIN} MB. Keep {WITHDRAW_RESERVE} MB in the wallet, or withdraw everything.</p>
          {amt && err && <p role="alert" className="text-xs font-bold text-destructive">{err}</p>}
          <Button disabled={!!err || busy || !validPhone(phone)} onClick={withdraw} className="h-11 w-full text-xs font-black uppercase">Withdraw to line</Button>
        </div>
      )}
      <div>
        <p className="mb-2 text-[10px] font-black uppercase text-muted-foreground">Recent transactions</p>
        {wallet.txns.length ? <TxnList wallet={wallet} limit={10} /> : <p className="text-xs text-muted-foreground">No transactions yet.</p>}
      </div>
    </Sheet>
  );
}

function TxnList({ wallet, limit }: { wallet: Wallet; limit: number }) {
  return (
    <ul className="space-y-1.5">
      {wallet.txns.slice(0, limit).map((t) => (
        <li key={t.id} className="flex items-center justify-between gap-2 text-xs">
          <span className="min-w-0 truncate">{t.kind}{t.note ? <span className="text-muted-foreground"> • {t.note}</span> : null}</span>
          <span className={`shrink-0 font-mono font-black ${t.amount >= 0 ? "text-primary" : "text-destructive"}`}>{t.amount >= 0 ? "+" : "−"}{t.currency === "MB" ? formatMB(Math.abs(t.amount)) : `${Math.abs(t.amount).toLocaleString("en-US")} ${wallet.settings.currencySymbol}`}</span>
        </li>
      ))}
    </ul>
  );
}

function BcUser({ wallet, close, notify, onOfficial }: { wallet: Wallet; close: () => void; notify: (m: string) => void; onOfficial: () => void }) {
  const s = wallet.settings;
  const buy = (t: Tier) => {
    const e = buyTierError(t, wallet.mb);
    if (e) { notify(e); return; }
    wallet.debit("MB", t.mb, "BC Purchase", `${t.bc} ${s.currencySymbol}`);
    wallet.credit("BC", t.bc, "BC Credit", `${t.badge}`);
    notify(`+${t.bc.toLocaleString("en-US")} ${s.currencySymbol}`);
  };
  return (
    <Sheet title={`${s.currencyName} Center`} close={close}>
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Your balance</p>
        <p className="font-mono text-4xl font-black text-warning">{wallet.bc.toLocaleString("en-US")} {s.currencySymbol}</p>
      </div>
      <div className="rounded-lg border border-primary/40 bg-gradient-to-br from-primary/20 to-accent p-4">
        <p className="font-heading text-xl font-bold uppercase">{s.promoHeadline}</p>
        <p className="mt-1 text-xs text-muted-foreground">{s.promoBody}</p>
        <Button onClick={onOfficial} className="mt-3 h-10 w-full text-xs font-black uppercase">{s.promoCta}</Button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {s.tiers.map((t) => (
          <button key={t.id} onClick={() => buy(t)} className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-left">
            {t.badge && <span className="rounded-sm bg-warning px-1.5 py-0.5 text-[9px] font-black text-background">{t.badge}</span>}
            <p className="mt-2 font-mono text-lg font-black text-warning">{t.bc.toLocaleString("en-US")} {s.currencySymbol}</p>
            <p className="text-[10px] text-muted-foreground">for {formatMB(t.mb)}</p>
          </button>
        ))}
      </div>
      <p className="text-center text-[10px] text-muted-foreground">Data balance: {formatMB(wallet.mb)}</p>
    </Sheet>
  );
}

function BcAdmin({ wallet, close, notify }: { wallet: Wallet; close: () => void; notify: (m: string) => void }) {
  const [d, setD] = useState<Settings>(wallet.settings);
  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setD((o) => ({ ...o, [k]: v }));
  const setTier = (id: string, patch: Partial<Tier>) => set("tiers", d.tiers.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const F = ({ label, k }: { label: string; k: "ussd" | "currencyName" | "currencySymbol" | "promoHeadline" | "promoBody" | "promoCta" | "slipNotice" | "slipLink" }) => (
    <label className="block text-[10px] font-bold uppercase text-muted-foreground">{label}
      <Input value={d[k]} onChange={(e) => set(k, e.target.value)} className="mt-1 bg-field text-xs normal-case" />
    </label>
  );
  return (
    <Sheet title="Economy Configurator" close={close}>
      <Group title="Payment settings"><F label="Deposit USSD number" k="ussd" /></Group>
      <Group title="Virtual currency"><div className="grid grid-cols-2 gap-2"><F label="Currency name" k="currencyName" /><F label="Symbol" k="currencySymbol" /></div></Group>
      <Group title="Purchase tiers">
        {d.tiers.map((t) => (
          <div key={t.id} className="grid grid-cols-[1fr_1fr_1fr_auto] items-end gap-1.5">
            <TierInput label="MB price" value={t.mb} onChange={(v) => setTier(t.id, { mb: v })} />
            <TierInput label={d.currencySymbol} value={t.bc} onChange={(v) => setTier(t.id, { bc: v })} />
            <label className="text-[9px] font-bold uppercase text-muted-foreground">Badge<Input value={t.badge} onChange={(e) => setTier(t.id, { badge: e.target.value })} className="mt-1 h-9 bg-field px-2 text-xs" /></label>
            <Button variant="ghost" size="icon" onClick={() => set("tiers", d.tiers.filter((x) => x.id !== t.id))} aria-label="Delete tier" className="size-9 text-destructive"><X /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={() => set("tiers", [...d.tiers, { id: Date.now().toString(36), mb: 100, bc: 1000, badge: "" }])} className="w-full border-dashed text-xs text-primary"><Plus /> Add new tier</Button>
      </Group>
      <Group title="Wallet promo banner"><F label="Headline" k="promoHeadline" /><F label="Body" k="promoBody" /><F label="Button label" k="promoCta" /></Group>
      <Group title="Custom bet slip promo"><F label="Notice text" k="slipNotice" /><F label="Link text" k="slipLink" /></Group>
      <Button onClick={() => { wallet.saveSettings({ ...d, tiers: d.tiers.filter((t) => t.mb > 0 && t.bc > 0) }); notify("Settings saved"); close(); }} className="h-12 w-full text-xs font-black uppercase"><Save /> Save all settings</Button>
    </Sheet>
  );
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return <div className="space-y-2 rounded-lg border border-border p-3"><p className="text-[10px] font-black uppercase text-warning">{title}</p>{children}</div>;
}
function TierInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return <label className="text-[9px] font-bold uppercase text-muted-foreground">{label}<Input type="number" value={value || ""} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 h-9 bg-field px-2 text-xs" /></label>;
}
