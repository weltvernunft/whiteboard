"use client";
import BoardProvider from "./BoardProvider";
import CanvasView from "../view/CanvasView";
import Toolbar from "../ui/Toolbar";
import LiveCursors from "../collab/LiveCursors";
import useBoardShortcuts from "../core/useBoardShortcuts";

export default function BoardPage({ id = "demo" }: { id?: string }) {
  return (
    <BoardProvider roomId={id}>
      <BoardInner />
    </BoardProvider>
  );
}

function BoardInner() {
  useBoardShortcuts();
  return (
    <main className="fixed inset-0 flex flex-col bg-neutral-50">
      <Toolbar />
      <div className="relative flex-1">
        <CanvasView />
        <LiveCursors /> {/* вот тут — поверх канвы */}
      </div>
    </main>
  );
}
