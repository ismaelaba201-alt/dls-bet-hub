import { useEffect, useRef, useState, type PointerEvent } from "react";
import { UserCog } from "lucide-react";

const KEY = "dls-admin-pos";
const TAP = 6;

export function DraggableAdmin({ admin, onToggle }: { admin: boolean; onToggle: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);

  const clamp = (x: number, y: number) => {
    const w = ref.current?.offsetWidth ?? 110;
    const h = ref.current?.offsetHeight ?? 36;
    return {
      x: Math.min(Math.max(8, x), window.innerWidth - w - 8),
      y: Math.min(Math.max(88, y), window.innerHeight - h - 88),
    };
  };

  useEffect(() => {
    let p = { x: window.innerWidth / 2 - 55, y: 100 };
    try {
      const s = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (s && typeof s.x === "number") p = s;
    } catch { /* ignore */ }
    setPos(clamp(p.x, p.y));
    const onResize = () => setPos((c) => (c ? clamp(c.x, c.y) : c));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const down = (e: PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
  };
  const move = (e: PointerEvent<HTMLButtonElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.sx, dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < TAP) return;
    d.moved = true;
    setPos(clamp(d.ox + dx, d.oy + dy));
  };
  const up = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) { if (pos) localStorage.setItem(KEY, JSON.stringify(pos)); }
    else onToggle();
  };

  if (!pos) return null;
  return (
    <button
      ref={ref}
      type="button"
      aria-pressed={admin}
      aria-label={admin ? "Admin mode on — tap to turn off, drag to move" : "Admin mode off — tap to turn on, drag to move"}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={() => (drag.current = null)}
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      className={`fixed z-50 flex h-9 select-none items-center gap-1.5 rounded-full border bg-background/90 px-3 text-[11px] font-bold shadow-lg backdrop-blur-md ${admin ? "border-primary/70 text-primary" : "border-border text-muted-foreground"}`}
    >
      <UserCog className="size-4" /> {admin ? "Admin: On" : "Admin: Off"}
    </button>
  );
}
