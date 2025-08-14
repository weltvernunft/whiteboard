import { createClient } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import type { LiveList } from "@liveblocks/client";

export type Storage = {
  objects?: LiveList<any>; // ❗ optional
};

export type Presence = {
  cursor: { x: number; y: number } | null;
  tool: "pen" | "hl" | "select";
  lastSeen?: number;
};

// ✅ UserMeta должен содержать id и info
export type UserMeta = {
  id: string; // userId, приходит из auth-эндпоинта или генерится провайдером
  info?: {
    name?: string;
    color?: string;
    avatar?: string;
  };
};

export type RoomEvent = { type: "reaction"; emoji: string };

const client = createClient({
  publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!,
});

export const {
  RoomProvider,
  useMyPresence,
  useOthers,
  useStorage,
  useMutation,
  useRoom,
} = createRoomContext<Presence, Storage, UserMeta, RoomEvent>(client);
