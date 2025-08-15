"use client";
import { useEffect } from "react";
import { useMyPresence } from "../collab/liveblocks";

const isEditable = (t: EventTarget | null) =>
  !!(
    t && (t as HTMLElement).closest("input, textarea, [contenteditable='true']")
  );

export default function useBoardShortcuts() {
  const [{ tool }, update] = useMyPresence();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 1) не трогаем системные сочетания
      if (e.metaKey || e.ctrlKey) return;
      if (e.repeat || isEditable(e.target)) return;

      switch (e.code) {
        case "KeyV":
          e.preventDefault();
          update({ tool: "select" });
          break;
        case "KeyB":
          e.preventDefault();
          update({ tool: e.shiftKey ? "hl" : "pen" });
          break;
        case "KeyE":
          e.preventDefault();
          update({ tool: "hl" });
          break;
        default:
          break;
      }
    };

    // БЕЗ capture
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [update]);

  return tool;
}
