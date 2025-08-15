// features/board/core/useClipboardImages.ts
import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import { Canvas, FabricImage, IText } from "fabric";

export function useClipboardImages(
  fabricRef: MutableRefObject<Canvas | null>,
  _wrapRef?: RefObject<HTMLElement | null>,
  onAfterPaste?: () => void // 👈 добавили колбэк
) {
  useEffect(() => {
    const addImage = async (canvas: Canvas, img: FabricImage) => {
      const iw = img.width ?? 0;
      const ih = img.height ?? 0;
      if (!iw || !ih) return;

      const cw = (canvas as any).getWidth?.() ?? (canvas as any).width ?? 1280;
      const ch = (canvas as any).getHeight?.() ?? (canvas as any).height ?? 720;
      const scale = Math.min((cw * 0.8) / iw, (ch * 0.8) / ih, 1);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: "center",
        originY: "center",
      });

      const center = (canvas as any).getCenterPoint();
      img.set({ left: center.x, top: center.y });

      (canvas as any).isDrawingMode = false; // 🔒 выключаем кисти
      (canvas as any).add(img);
      (canvas as any).setActiveObject?.(img);
      (canvas as any).requestRenderAll?.();

      onAfterPaste?.(); // ✅ сообщаем «переключи tool на select»
    };

    const fromURL = async (canvas: Canvas, url: string) => {
      const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const fimg = new FabricImage(imgEl);
      await addImage(canvas, fimg);
    };

    const addIText = (canvas: Canvas, text: string) => {
      if (!text?.trim()) return;
      const center = (canvas as any).getCenterPoint();
      const it = new IText(text, {
        left: center.x,
        top: center.y,
        originX: "center",
        originY: "center",
        fontSize: 20,
        fill: "#111",
      });
      (canvas as any).isDrawingMode = false; // 🔒
      (canvas as any).add(it);
      (canvas as any).setActiveObject?.(it);
      (canvas as any).requestRenderAll?.();
      onAfterPaste?.(); // ✅ тоже в select
    };

    const handlePaste = async (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.isContentEditable);
      if (typing) return;

      const canvas = fabricRef.current;
      if (!canvas) return;

      const cd = e.clipboardData;
      if (!cd) return;

      // 1) image/* файлы
      for (let i = 0; i < cd.items.length; i++) {
        const it = cd.items[i];
        if (it.kind === "file" && it.type.startsWith("image/")) {
          const file = it.getAsFile();
          if (file) {
            e.preventDefault();
            const url = URL.createObjectURL(file);
            try {
              await fromURL(canvas, url);
            } finally {
              setTimeout(() => URL.revokeObjectURL(url), 0);
            }
            return;
          }
        }
      }

      // 2) HTML <img src="...">
      const html = cd.getData("text/html");
      if (html) {
        try {
          const doc = new DOMParser().parseFromString(html, "text/html");
          const src = doc.querySelector("img")?.getAttribute("src") ?? null;
          if (src) {
            e.preventDefault();
            await fromURL(canvas, src);
            return;
          }
        } catch {}
      }

      // 3) текстовый URL/Data URI → либо картинка, либо текстовый объект
      const text = cd.getData("text/plain")?.trim();
      if (text) {
        const isImg =
          text.startsWith("data:image/") ||
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(text);
        e.preventDefault();
        if (isImg) {
          await fromURL(canvas, text);
        } else {
          addIText(canvas, text);
        }
      }
    };

    document.addEventListener("paste", handlePaste as EventListener);
    return () => {
      document.removeEventListener("paste", handlePaste as EventListener);
    };
  }, [fabricRef, _wrapRef, onAfterPaste]);
}
