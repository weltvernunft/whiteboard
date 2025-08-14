"use client";
import { useEffect, useMemo, useRef } from "react";
import { useOthers } from "../collab/liveblocks";
import Cursor from "./Cursor";

const COLORS = [
  "#E57373",
  "#9575CD",
  "#4FC3F7",
  "#81C784",
  "#FFF176",
  "#FF8A65",
  "#F06292",
  "#7986CB",
] as const;

const IDLE_HIDE_MS = 3000;
const LERP = 0.22;

type Smooth = { x: number; y: number };

function toolIcon(tool?: string) {
  switch (tool) {
    case "pen":
      return "✏️";
    case "hl":
      return "🖍️";
    case "select":
      return "🖱️";
    default:
      return "";
  }
}

export default function LiveCursors() {
  const others = useOthers(); // массив

  const smoothRef = useRef<Map<number, Smooth>>(new Map());
  const targetsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const elRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef<number | null>(null);

  const entries = useMemo(() => {
    const now = Date.now();
    return others
      .map((o) => {
        const id = o.connectionId;
        const presence = o.presence ?? {};
        const info = o.info ?? {};
        const c = (presence as any).cursor ?? null;
        const last = (presence as any).lastSeen ?? 0;
        const color = (info as any).color ?? COLORS[id % COLORS.length];
        const name = (info as any).name ?? `user-${id}`;
        const tool = (presence as any).tool ?? "select";
        return { id, c, last, color, name, tool };
      })
      .filter((e) => e.c && now - e.last < IDLE_HIDE_MS);
  }, [others]);

  useEffect(() => {
    const t = targetsRef.current;
    const s = smoothRef.current;

    for (const e of entries) {
      t.set(e.id, e.c!);
      if (!s.has(e.id)) s.set(e.id, { x: e.c!.x, y: e.c!.y });
    }
    for (const id of [...s.keys()]) {
      if (!entries.find((e) => e.id === id)) {
        s.delete(id);
        t.delete(id);
        const el = elRef.current.get(id);
        if (el) {
          el.style.transform = "translate(-9999px,-9999px)";
          elRef.current.delete(id);
        }
      }
    }
  }, [entries]);

  useEffect(() => {
    const tick = () => {
      const s = smoothRef.current;
      const t = targetsRef.current;
      for (const [id, sm] of s) {
        const target = t.get(id);
        const el = elRef.current.get(id);
        if (!target || !el) continue;
        sm.x += (target.x - sm.x) * LERP;
        sm.y += (target.y - sm.y) * LERP;
        el.style.transform = `translate(${sm.x}px, ${sm.y}px)`;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0">
      {entries.map(({ id, color, name, tool, c }) => (
        <Cursor
          key={id}
          color={color}
          label={name}
          toolIcon={toolIcon(tool)}
          x={c!.x}
          y={c!.y}
          ref={(el) => {
            if (!el) return;
            elRef.current.set(id, el);
          }}
        />
      ))}
    </div>
  );
}
