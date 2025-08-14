// features/board/core/useSpacePan.ts
import { useEffect } from "react";
import type { Canvas } from "fabric";
import { util } from "fabric";
import { CURSORS } from "./Defaults";
import { updateCanvasTransform } from "./utils/canvasUtils";

type DivRef = React.RefObject<HTMLDivElement | null>;
type FabricRef = React.MutableRefObject<Canvas | null>;

/**
 * Временная рука при зажатом Space.
 * Подписки/отписки — внутри. CanvasView не засоряем.
 */
export function useSpacePan(
  fabricRef: FabricRef,
  tool: string,
  wrapRef: DivRef
) {
  useEffect(() => {
    const f = fabricRef.current;
    if (!f) return;

    let panning = false;
    let last = { x: 0, y: 0 };
    let prevSelection = f.selection;

    const isTypingEl = (el: EventTarget | null) =>
      !!el &&
      el instanceof HTMLElement &&
      (el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA" ||
        el.isContentEditable);

    const setCursor = (isGrabbing = false) => {
      f.setCursor(isGrabbing ? CURSORS.panning : CURSORS.pan);
    };

    const onKeyDownSpace = (ev: KeyboardEvent) => {
      if (ev.code !== "Space" || ev.repeat) return;
      if (isTypingEl(ev.target)) return;

      ev.preventDefault();
      panning = true;
      prevSelection = f.selection;
      f.selection = false;
      f.discardActiveObject();
      setCursor(false);
    };

    const onKeyUpSpace = (ev: KeyboardEvent) => {
      if (ev.code !== "Space") return;
      panning = false;
      f.selection = prevSelection;
      f.setCursor((CURSORS as any)[tool] || CURSORS.select);
    };

    const onMouseDownSpacePan = (opt: any) => {
      if (!panning) return;
      setCursor(true);
      last = util.getPointer(opt.e as MouseEvent);
    };

    const onMouseMoveSpacePan = (opt: any) => {
      if (!panning) return;
      const p = util.getPointer(opt.e as MouseEvent);
      const vpt = f.viewportTransform!;
      vpt[4] += p.x - last.x;
      vpt[5] += p.y - last.y;
      last = p;
      // важно: оставляем прежнюю сигнатуру — передаём wrapRef
      updateCanvasTransform(f, vpt, wrapRef as any);
    };

    const onMouseUpSpacePan = () => {
      if (panning) setCursor(false);
    };

    window.addEventListener("keydown", onKeyDownSpace, { capture: true });
    window.addEventListener("keyup", onKeyUpSpace, { capture: true });

    f.on("mouse:down", onMouseDownSpacePan as any);
    f.on("mouse:move", onMouseMoveSpacePan as any);
    f.on("mouse:up", onMouseUpSpacePan as any);

    return () => {
      window.removeEventListener("keydown", onKeyDownSpace, {
        capture: true,
      } as any);
      window.removeEventListener("keyup", onKeyUpSpace, {
        capture: true,
      } as any);

      f.off("mouse:down", onMouseDownSpacePan as any);
      f.off("mouse:move", onMouseMoveSpacePan as any);
      f.off("mouse:up", onMouseUpSpacePan as any);
    };
  }, [fabricRef, tool, wrapRef]);
}
