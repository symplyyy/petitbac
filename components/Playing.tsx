"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Room } from "@/lib/types";
import { IClock, IHand, IFlag } from "./Icon";

export default function Playing({ room, you }: { room: Room; you: string }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [now, setNow] = useState(Date.now());
  const sentRef = useRef<string>("");

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { setAnswers({}); sentRef.current = ""; }, [room.currentLetter]);

  useEffect(() => {
    const payload = JSON.stringify(answers);
    if (payload === sentRef.current) return;
    sentRef.current = payload;
    const t = setTimeout(() => getSocket().emit("answers:update", { answers }), 250);
    return () => clearTimeout(t);
  }, [answers]);

  const remaining = Math.max(0, Math.ceil(((room.timerEnd || 0) - now) / 1000));
  const total = room.settings.duration;
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const filled = Object.values(answers).filter((v) => (v || "").trim().length > 0).length;
  const allFilled = filled >= room.settings.categories.length;
  const urgent = remaining <= 10;

  function stop() {
    if (room.settings.stopMode !== "first") return;
    getSocket().emit("answers:update", { answers });
    setTimeout(() => getSocket().emit("game:stop"), 80);
  }

  const letter = room.currentLetter || "?";

  return (
    <div className="flex-1 flex flex-col gap-3 pb-28">
      {/* Top bar: round + timer */}
      <div className="flex items-center gap-3">
        <div className="sticker bg-paper sticker-tilt-l">
          <IFlag size={14} /> Manche {room.round}/{room.totalRounds}
        </div>
        <div className={`ml-auto sticker font-mono ${urgent ? "bg-tomato text-chalk animate-jitter" : "bg-chalk"}`}>
          <IClock size={14} /> {remaining}s
        </div>
      </div>

      {/* Progress bar — chunky brutalist */}
      <div className="h-4 w-full border-3 border-stroke rounded-full bg-chalk overflow-hidden shadow-hardsm">
        <div
          className={`h-full ${urgent ? "bg-tomato" : "bg-moss"} transition-[width] duration-200`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Big letter card — signature element */}
      <div className="flex flex-col items-center mt-2">
        <div className="label-b">Lettre du tour</div>
        <div className="relative mt-2 animate-stamp">
          <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-stroke rounded-3xl" />
          <div className="relative halftone overflow-hidden bg-tomato border-3 border-stroke rounded-3xl w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
            <span className="font-display font-bold text-[100px] md:text-[120px] leading-none text-chalk">{letter}</span>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-3 flex flex-col gap-2 md:grid md:grid-cols-2 md:gap-3">
        {room.settings.categories.map((c, i) => (
          <label key={c} className="brut p-3 flex items-center gap-3">
            <span className="font-display font-bold text-ink/80 text-sm w-24 shrink-0">{c}</span>
            <input
              className="input-b !py-2 !border-2 !shadow-none focus:!translate-x-0 focus:!translate-y-0 focus:!shadow-none focus:!border-tomato"
              placeholder={`en ${letter}…`}
              maxLength={32}
              value={answers[c] || ""}
              onChange={(e) => setAnswers((a) => ({ ...a, [c]: e.target.value }))}
              autoComplete="off"
              autoCapitalize="words"
            />
          </label>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-paper/95 backdrop-blur border-t-3 border-stroke">
        <div className="mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl">
          {room.settings.stopMode === "first" ? (
            <button
              onClick={stop}
              className={`btn-b-lg w-full ${allFilled ? "btn-tomato" : "btn-cobalt"}`}
            >
              <IHand size={22} /> STOP · {filled}/{room.settings.categories.length}
            </button>
          ) : (
            <div className="text-center font-display font-bold text-ink/70 py-3">Continue à remplir…</div>
          )}
        </div>
      </div>
    </div>
  );
}
