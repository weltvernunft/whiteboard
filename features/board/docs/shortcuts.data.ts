// features/board/docs/shortcuts.data.ts
export type Shortcut = {
  id: string;
  combo: string[]; // ["mod","B"], ["Shift","B"]
  when?: string; // условие (например, "canvasFocused")
  action: string; // "Activate Pen"
  group: "Tools" | "Edit" | "View" | "Arrange" | "Collab";
};

export const SHORTCUTS: Shortcut[] = [
  // Tools
  { id: "tool-select", combo: ["V"], action: "Select tool", group: "Tools" },
  { id: "tool-hand", combo: ["H"], action: "Hand/Pan", group: "Tools" },
  { id: "tool-pen", combo: ["B"], action: "Pen", group: "Tools" },
  {
    id: "tool-hl",
    combo: ["Shift", "B"],
    action: "Highlighter",
    group: "Tools",
  },
  { id: "tool-eraser", combo: ["E"], action: "Eraser", group: "Tools" },
  { id: "tool-rect", combo: ["R"], action: "Rectangle", group: "Tools" },
  { id: "tool-ellipse", combo: ["O"], action: "Ellipse", group: "Tools" },
  { id: "tool-line", combo: ["L"], action: "Line/Arrow", group: "Tools" },
  { id: "tool-text", combo: ["T"], action: "Text", group: "Tools" },
  { id: "tool-image", combo: ["I"], action: "Insert image", group: "Tools" },

  // Edit
  {
    id: "select-all",
    combo: ["mod", "A"],
    action: "Select all",
    group: "Edit",
  },
  { id: "delete", combo: ["Backspace"], action: "Delete", group: "Edit" },
  {
    id: "duplicate",
    combo: ["Alt", "Drag"],
    action: "Duplicate on drag",
    group: "Edit",
  },
  { id: "copy", combo: ["mod", "C"], action: "Copy", group: "Edit" },
  { id: "paste", combo: ["mod", "V"], action: "Paste", group: "Edit" },
  { id: "undo", combo: ["mod", "Z"], action: "Undo", group: "Edit" },
  { id: "redo", combo: ["Shift", "mod", "Z"], action: "Redo", group: "Edit" },

  // View
  { id: "zoom-in", combo: ["mod", "="], action: "Zoom in", group: "View" },
  { id: "zoom-out", combo: ["mod", "-"], action: "Zoom out", group: "View" },
  { id: "zoom-fit", combo: ["mod", "0"], action: "Zoom to fit", group: "View" },
  { id: "toggle-grid", combo: ["G"], action: "Toggle grid", group: "View" },

  // Arrange
  { id: "group", combo: ["mod", "G"], action: "Group", group: "Arrange" },
  {
    id: "ungroup",
    combo: ["Shift", "mod", "G"],
    action: "Ungroup",
    group: "Arrange",
  },
  {
    id: "flip-x",
    combo: ["Shift", "H"],
    action: "Flip horizontal",
    group: "Arrange",
  },
  {
    id: "flip-y",
    combo: ["Shift", "V"],
    action: "Flip vertical",
    group: "Arrange",
  },

  // Collab
  { id: "comments", combo: ["C"], action: "Add comment", group: "Collab" },
  {
    id: "reactions",
    combo: ["R", "R"],
    action: "Quick reaction",
    group: "Collab",
  },

  // Help
  {
    id: "help",
    combo: ["Shift", "/"],
    action: "Open shortcuts",
    group: "View",
  },
];
