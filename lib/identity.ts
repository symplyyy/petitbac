"use client";

const KEY_PLAYER = "petitbac:playerId";
const KEY_ROOM = "petitbac:room";

function randomId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function getPlayerId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(KEY_PLAYER);
  if (!id) {
    id = randomId();
    localStorage.setItem(KEY_PLAYER, id);
  }
  return id;
}

export function getCurrentRoom(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_ROOM);
}

export function setCurrentRoom(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY_ROOM, code);
}

export function clearCurrentRoom(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(KEY_ROOM);
}
