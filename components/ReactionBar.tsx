"use client";
import { getSocket } from "@/lib/socket";
import type { Phase } from "@/lib/types";

const EMOJIS = ["👍", "❤️", "😂", "🔥", "👏", "🎉"];

export default function ReactionBar({ phase }: { phase: Phase }) {
  function send(emoji: string) {
    window.__spawnReaction?.(emoji);
    getSocket().emit("reaction:send", { emoji });
  }
  // Sit above the fixed STOP bar during play, otherwise hug the bottom.
  const bottomClass = phase === "playing" ? "bottom-24" : "bottom-3";
  return (
    <div
      className={`fixed ${bottomClass} left-2 z-40 flex gap-1 pb-[env(safe-area-inset-bottom)]`}
      role="toolbar"
      aria-label="Réactions"
    >
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => send(e)}
          aria-label={`Envoyer ${e}`}
          className="w-10 h-10 rounded-2xl bg-chalk border-3 border-stroke shadow-hardsm text-xl leading-none flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-transform"
        >
          <span aria-hidden>{e}</span>
        </button>
      ))}
    </div>
  );
}
