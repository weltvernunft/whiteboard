import { Canvas } from "fabric";
import { CONFIG } from "../Defaults";
import { RefObject } from "react";

// Хелпер-утилита для ограничения значения в заданном диапазоне
export const clamp = (v: number, a: number, b: number) =>
  Math.max(a, Math.min(b, v));

// Хелпер для обновления трансформаций и сетки
export const updateCanvasTransform = (
  f: Canvas,
  vpt: number[],
  // Вот здесь я добавил `| null`, чтобы TypeScript знал, что реф может быть пустым
  wrapRef: RefObject<HTMLDivElement | null>,
  zoom?: number
) => {
  if (zoom) f.setZoom(clamp(zoom, CONFIG.MIN_ZOOM, CONFIG.MAX_ZOOM));
  const z = f.getZoom();
  const cw = f.getWidth();
  const ch = f.getHeight();
  const minX = Math.min(0, cw - CONFIG.WORLD_WIDTH * z);
  const minY = Math.min(0, ch - CONFIG.WORLD_HEIGHT * z);
  vpt[4] = Math.min(0, Math.max(minX, vpt[4]));
  vpt[5] = Math.min(0, Math.max(minY, vpt[5]));
  const cell = CONFIG.GRID_BASE * z;
  const ox = ((vpt[4] % cell) + cell) % cell;
  const oy = ((vpt[5] % cell) + cell) % cell;
  // А вот здесь мы делаем проверку на `null`, чтобы не было ошибок
  if (wrapRef.current) {
    wrapRef.current.style.backgroundSize = `${cell}px ${cell}px`;
    wrapRef.current.style.backgroundPosition = `${ox}px ${oy}px`;
  }
  f.requestRenderAll();
};
