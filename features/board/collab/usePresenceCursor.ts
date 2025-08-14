// features/board/collab/usePresenceCursor.ts
import { useEffect } from "react";
import type { Canvas } from "fabric";
import { util } from "fabric";

type PresenceFn = (p: {
  cursor: { x: number; y: number } | null;
  lastSeen: number;
}) => void;

/**
 * Трэкает позицию курсора на канвасе и шлёт presence.
 * Сам вешает/снимает fabric-события, ничего не течёт.
 */
export function usePresenceCursor(
  fabricRef: React.MutableRefObject<Canvas | null>,
  sendPresence: PresenceFn
) {
  useEffect(() => {
    const f = fabricRef.current;
    if (!f) return;

    const onMouseMovePresence = (opt: any) => {
      const e = opt.e as MouseEvent;
      const rect = f.upperCanvasEl.getBoundingClientRect();
      const p = util.getPointer(e);
      sendPresence({
        cursor: { x: p.x - rect.left, y: p.y - rect.top },
        lastSeen: Date.now(),
      });
    };

    const onMouseOutPresence = () => {
      sendPresence({ cursor: null, lastSeen: Date.now() });
    };

    f.on("mouse:move", onMouseMovePresence as any);
    f.on("mouse:out", onMouseOutPresence as any);

    return () => {
      f.off("mouse:move", onMouseMovePresence as any);
      f.off("mouse:out", onMouseOutPresence as any);
    };
  }, [fabricRef, sendPresence]);
}
