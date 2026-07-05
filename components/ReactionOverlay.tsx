"use client";
import { useCallback, useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";

type FlyingReaction = {
  id: string;
  emoji: string;
  x: number;
  drift: number;
  spin: number;
  duration: number;
};

declare global {
  interface Window {
    __spawnReaction?: (emoji: string) => void;
  }
}

export default function ReactionOverlay() {
  const [items, setItems] = useState<FlyingReaction[]>([]);

  const spawn = useCallback((emoji: string) => {
    const item: FlyingReaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      emoji,
      x: 15 + Math.random() * 70,
      drift: (Math.random() - 0.5) * 220,
      spin: (Math.random() - 0.5) * 60,
      duration: 2600 + Math.random() * 1400,
    };
    setItems((prev) => [...prev, item]);
    window.setTimeout(() => {
      setItems((prev) => prev.filter((r) => r.id !== item.id));
    }, item.duration + 200);
  }, []);

  useEffect(() => {
    const sock = getSocket();
    const onShow = ({ emoji }: { emoji: string }) => spawn(emoji);
    sock.on("reaction:show", onShow);
    window.__spawnReaction = spawn;
    return () => {
      sock.off("reaction:show", onShow);
      if (window.__spawnReaction === spawn) delete window.__spawnReaction;
    };
  }, [spawn]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {items.map((r) => (
        <span
          key={r.id}
          className="reaction-fly absolute bottom-[10%] select-none text-4xl md:text-5xl"
          style={{
            left: `${r.x}%`,
            animationDuration: `${r.duration}ms`,
            // CSS custom properties consumed by the floatUp keyframe
            ["--drift" as any]: `${r.drift}px`,
            ["--spin" as any]: `${r.spin}deg`,
          }}
        >
          {r.emoji}
        </span>
      ))}
    </div>
  );
}
