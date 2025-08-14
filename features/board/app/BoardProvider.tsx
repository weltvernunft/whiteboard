// features/board/app/BoardProvider.tsx
"use client";
import { RoomProvider } from "../collab/liveblocks";
import { LiveList } from "@liveblocks/client"; // ← обязательный импорт

export default function BoardProvider({
  roomId,
  children,
}: {
  roomId: string;
  children: React.ReactNode;
}) {
  return (
    <RoomProvider
      id={`board:${roomId}`}
      initialPresence={{ cursor: null, tool: "pen" }}
      initialStorage={() => ({ objects: new LiveList<any>([]) })}
    >
      {children}
    </RoomProvider>
  );
}
