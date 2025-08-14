"use client";
import { useMyPresence } from "../collab/liveblocks";
import type { Presence } from "../collab/liveblocks";

export default function Toolbar() {
  const [{ tool }, update] = useMyPresence();
  return (
    <div className="h-14 px-3 gap-2 flex items-center border-b bg-white/80 backdrop-blur sticky top-0 z-10">
      <button
        className={btn(tool === "select")}
        onClick={() => update({ tool: "select" })}
      >
        Select (V)
      </button>
      <button
        className={btn(tool === "pen")}
        onClick={() => update({ tool: "pen" })}
      >
        Pen (B)
      </button>
      <button
        className={btn(tool === "hl")}
        onClick={() => update({ tool: "hl" })}
      >
        Highlighter (E)
      </button>
    </div>
  );
}
function btn(active: boolean) {
  return `px-3 py-1 rounded-md border ${
    active ? "bg-blue-600 text-white" : "bg-white hover:bg-neutral-100"
  }`;
}
