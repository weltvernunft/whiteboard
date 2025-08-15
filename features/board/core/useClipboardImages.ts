// core/useClipboardImages.ts
import { useEffect } from "react";
import type { MutableRefObject, RefObject } from "react";
import {
  Canvas,
  FabricImage,
  IText,
  StaticCanvas,
  ActiveSelection,
} from "fabric";

const DEBUG = false;
const log = (...a: any[]) => DEBUG && console.log("[clip]", ...a);

// ---- utilities ----
function getCanvas(obj: any): Canvas | null {
  if (!obj) return null;
  if (obj instanceof Canvas) return obj;
  if (obj.canvas instanceof Canvas) return obj.canvas;
  return null;
}

function getViewportCenter(canvas: Canvas) {
  const vpt = canvas.viewportTransform ?? [1, 0, 0, 1, 0, 0];
  const zoom = canvas.getZoom ? canvas.getZoom() : 1;
  const cx = (canvas.getWidth() / 2 - (vpt[4] ?? 0)) / zoom;
  const cy = (canvas.getHeight() / 2 - (vpt[5] ?? 0)) / zoom;
  return { x: cx, y: cy };
}

async function fetchAsBlob(url: string) {
  const resp = await fetch(url, { mode: "cors" });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return await resp.blob();
}

async function uploadIfAvailable(blob: Blob) {
  try {
    const fd = new FormData();
    fd.append("file", blob, "pasted");
    const r = await fetch("/api/upload", { method: "POST", body: fd });
    if (!r.ok) throw new Error("upload failed");
    const { url } = await r.json();
    return typeof url === "string" ? url : null;
  } catch {
    return null;
  }
}

async function fabricImageFromBlob(blob: Blob): Promise<FabricImage> {
  // надёжно для fabric v6: через <img> + new FabricImage(imgEl)
  const url = URL.createObjectURL(blob);
  try {
    const imgEl = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const fimg = new FabricImage(imgEl);
    return fimg;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function addImageFromBlob(canvas: Canvas, blob: Blob) {
  const fimg = await fabricImageFromBlob(blob);
  const { x, y } = getViewportCenter(canvas);

  // масштабируем в пределы 60% viewport
  const maxW = canvas.getWidth() * 0.6;
  const maxH = canvas.getHeight() * 0.6;
  const bw = fimg.width ?? 1;
  const bh = fimg.height ?? 1;
  const scale = Math.min(1, maxW / bw, maxH / bh);

  fimg.set({
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    scaleX: scale,
    scaleY: scale,
  });

  const uploaded = await uploadIfAvailable(blob);
  if (uploaded) {
    // сохраним исходный URL для сериализации
    // @ts-ignore
    fimg.set({ src: uploaded });
  }

  canvas.add(fimg);
  canvas.setActiveObject(fimg);
  canvas.requestRenderAll();
}

function addIText(canvas: Canvas, text: string) {
  if (!text?.trim()) return;
  const { x, y } = getViewportCenter(canvas);
  const it = new IText(text, {
    left: x,
    top: y,
    originX: "center",
    originY: "center",
    fontSize: 20,
    fill: "#111",
  });
  canvas.add(it);
  canvas.setActiveObject(it);
  canvas.requestRenderAll();
}

function extractImgSrcFromHTML(html: string): string | null {
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const img = doc.querySelector("img");
    if (img?.src) return img.src;
    const styled = doc.querySelector("[style*='background-image']");
    if (styled) {
      const m = /url\(["']?(.*?)["']?\)/.exec(
        styled.getAttribute("style") || ""
      );
      if (m?.[1]) return m[1];
    }
    return null;
  } catch {
    return null;
  }
}

async function activeObjectToPNG(canvas: Canvas): Promise<string | null> {
  const active = canvas.getActiveObject();
  if (!active) return null;

  // v6: clone() -> Promise
  const clone = await active.clone();

  // v6: getBoundingRect() -> без аргументов
  const b = clone.getBoundingRect();

  const tmp = new StaticCanvas(null as any, {
    width: Math.ceil(b.width),
    height: Math.ceil(b.height),
    backgroundColor: "transparent",
  });

  clone.set({
    left: b.width / 2,
    top: b.height / 2,
    originX: "center",
    originY: "center",
  });
  // убираем визуальные маркеры на случай если вдруг попадут в экспорт
  // @ts-ignore
  clone.set({ hasControls: false, hasBorders: false });

  tmp.add(clone);
  tmp.renderAll();

  // v6: multiplier обязателен
  return tmp.toDataURL({ multiplier: 1, format: "png" });
}

// ===== NEW: paste-catcher infra =====
function createPasteCatcher(): HTMLDivElement {
  const el = document.createElement("div");
  el.setAttribute("contenteditable", "true");
  el.setAttribute("aria-hidden", "true");
  el.style.position = "fixed";
  el.style.opacity = "0";
  el.style.pointerEvents = "none";
  el.style.zIndex = "-1";
  el.style.width = "1px";
  el.style.height = "1px";
  el.style.left = "-9999px";
  el.style.top = "0";
  document.body.appendChild(el);
  return el;
}

export function useClipboardImages(
  fabricRef: MutableRefObject<any>,
  wrapRef?: RefObject<HTMLElement | null>
) {
  useEffect(() => {
    const canvas = getCanvas(fabricRef.current);
    if (!canvas) return;

    // ---- shared handlers ----
    const handlePasteData = async (dt: DataTransfer) => {
      const c = getCanvas(fabricRef.current);
      if (!c) return;

      // 1) image/*
      const imgItem = Array.from(dt.items).find((i) =>
        i.type.startsWith("image/")
      );
      if (imgItem) {
        const file = imgItem.getAsFile();
        if (file) {
          await addImageFromBlob(c, file);
          return;
        }
      }

      // 2) html -> img
      const html = dt.getData("text/html");
      if (html) {
        const src = extractImgSrcFromHTML(html);
        if (src) {
          try {
            const blob = src.startsWith("data:")
              ? await (await fetch(src)).blob()
              : await fetchAsBlob(src);
            await addImageFromBlob(c, blob);
            return;
          } catch (e) {
            log("html→img failed", e);
          }
        }
      }

      // 3) text / url
      const text = dt.getData("text/plain")?.trim();
      if (text) {
        const isImgUrl =
          /^https?:\/\/.+\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(text);
        if (isImgUrl) {
          try {
            const blob = await fetchAsBlob(text);
            await addImageFromBlob(c, blob);
          } catch {
            addIText(c, text);
          }
        } else {
          addIText(c, text);
        }
      }
    };

    // ---- paste-catcher element ----
    const catcher = createPasteCatcher();

    const onCatcherPaste = async (e: ClipboardEvent) => {
      e.preventDefault();
      if (e.clipboardData) await handlePasteData(e.clipboardData);
      // очищаем возможные текст-ноды, которые браузер мог вставить
      catcher.innerHTML = "";
      // возвращаем фокус на канвас-контейнер, если он есть
      if (wrapRef?.current) (wrapRef.current as HTMLElement).focus?.();
    };

    catcher.addEventListener("paste", onCatcherPaste as any);

    // ---- keydown: перехват Ctrl/Cmd+V, переводим фокус в catcher ----
    const onKeyDown = (e: KeyboardEvent) => {
      const isPaste =
        (e.key === "v" || e.key === "V") && (e.metaKey || e.ctrlKey);
      if (!isPaste) return;
      // Чтобы событие paste точно случилось — переводим фокус
      catcher.focus();
      // НЕ предотвращаем keydown — пусть браузер сгенерит paste на catcher
      // сам paste мы уже перехватим на catcher и e.preventDefault там сделаем
    };

    document.addEventListener("keydown", onKeyDown, true);

    // ---- copy / cut: оставляем как было ----
    const onCopy = async (e: ClipboardEvent) => {
      const c = getCanvas(fabricRef.current);
      const active = c?.getActiveObject();
      if (!c || !active) return;

      try {
        const json = JSON.stringify(active.toObject(["src"]));
        const png = await activeObjectToPNG(c);
        e.preventDefault();

        if (e.clipboardData) {
          e.clipboardData.setData("text/plain", json);
          e.clipboardData.setData("application/x-whiteboard-object+json", json);
          if (png) e.clipboardData.setData("image/png", png);
        } else if ((navigator as any).clipboard?.write) {
          const items: ClipboardItem[] = [
            new ClipboardItem({
              "text/plain": new Blob([json], { type: "text/plain" }),
              "application/x-whiteboard-object+json": new Blob([json], {
                type: "application/x-whiteboard-object+json",
              }),
              ...(png ? { "image/png": await (await fetch(png)).blob() } : {}),
            }),
          ];
          await (navigator as any).clipboard.write(items);
        }
      } catch (err) {
        log("copy failed", err);
      }
    };

    const onCut = async (e: ClipboardEvent) => {
      const c = getCanvas(fabricRef.current);
      const active = c?.getActiveObject();
      if (!c || !active) return;
      await onCopy(e);
      e.preventDefault();
      c.remove(active);
      c.discardActiveObject();
      c.requestRenderAll();
    };

    document.addEventListener("copy", onCopy as any);
    document.addEventListener("cut", onCut as any);

    // ---- DnD на wrapRef (у тебя уже работал, оставляю) ----
    const targetEl = wrapRef?.current ?? document.body;
    // делаем контейнер фокусируемым, чтобы по клику фокус возвращался туда
    if (wrapRef?.current) {
      wrapRef.current.setAttribute("tabindex", "0");
      (wrapRef.current as HTMLElement).style.outline = "none";
    }

    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    };
    const onDrop = async (e: DragEvent) => {
      const c = getCanvas(fabricRef.current);
      if (!c) return;
      e.preventDefault();
      const dt = e.dataTransfer;
      if (!dt) return;

      if (dt.files?.length) {
        for (const f of Array.from(dt.files)) {
          if (f.type.startsWith("image/")) await addImageFromBlob(c, f);
        }
        return;
      }
      const url = dt.getData("text/uri-list") || dt.getData("text/plain");
      if (url) {
        try {
          const blob = await fetchAsBlob(url);
          await addImageFromBlob(c, blob);
        } catch {
          addIText(c, url);
        }
      }
    };

    targetEl.addEventListener("dragover", onDragOver as any);
    targetEl.addEventListener("drop", onDrop as any);

    log("clipboard + catcher ready");

    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("copy", onCopy as any);
      document.removeEventListener("cut", onCut as any);
      targetEl.removeEventListener("dragover", onDragOver as any);
      targetEl.removeEventListener("drop", onDrop as any);
      catcher.removeEventListener("paste", onCatcherPaste as any);
      catcher.remove();
      log("cleanup done");
    };
  }, [fabricRef, wrapRef]);
}
