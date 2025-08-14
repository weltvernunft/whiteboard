import {
  FabricObject,
  InteractiveFabricObject,
  FabricText,
  Textbox,
  IText,
} from "fabric";

export function applyFabricDefaults() {
  InteractiveFabricObject.ownDefaults = {
    ...InteractiveFabricObject.ownDefaults,
    cornerSize: 10,
    transparentCorners: false,
    cornerColor: "rgb(0,153,255)",
    cornerStrokeColor: "#fff",
    cornerStyle: "circle",
    padding: 4,
    borderColor: "rgba(0,153,255,0.9)",
    borderDashArray: [4, 2],
    borderScaleFactor: 1.5,
    perPixelTargetFind: true,
    objectCaching: false,
    noScaleCache: true,
  };

  FabricObject.ownDefaults = {
    ...FabricObject.ownDefaults,
    originX: "center",
    originY: "center",
  };

  FabricText.ownDefaults = {
    ...FabricText.ownDefaults,
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial",
    fontSize: 20,
    fill: "#111827",
  };
  IText.ownDefaults = { ...IText.ownDefaults, cursorColor: "#0099ff" };
  Textbox.ownDefaults = {
    ...Textbox.ownDefaults,
    width: 320,
    textAlign: "left",
  };
}

export const CONFIG = {
  WORLD_WIDTH: 5000,
  WORLD_HEIGHT: 3000,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3,
  SCALE_PER_PIXEL: 0.0006,
  MAX_ZOOM_STEP: 1.5,
  PAN_FACTOR: 0.55,
  PAN_MAX_PER_TICK: 60,
  GRID_BASE: 20,
  BRUSH_WIDTH: { pen: 4, hl: 12 },
  BRUSH_COLOR: { pen: "#111827", hl: "#ffeb3b80" },
};

export const CURSORS = {
  select: "default",
  pen: "crosshair",
  hl: "crosshair",
  pan: "grab",
  panning: "grabbing",
  hand: "grab", // опционально, если хотите явный alias
};
