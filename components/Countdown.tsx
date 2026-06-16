"use client";
import { useEffect, useMemo, useState } from "react";
import type { Room, RoundResult } from "@/lib/types";
import Avatar from "./Avatar";
import { IFlag, ITrophy } from "./Icon";

export default function Countdown({ room, result }: { room: Room; result: RoundResult | null }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 80);
    return () => clearInterval(t);
  }, []);

  const remainingMs = Math.max(0, (room.countdownEnd || 0) - now);
  const sec = Math.ceil(remainingMs / 1000);
  const label = sec <= 0 ? "GO" : String(sec);
  const showScores = !!result && result.round < room.round;
  // result is from the round just finished — only show if it corresponds to a prior round in this game.

  const sorted = useMemo(() => {
    if (!result) return [];
    return [...result.players].sort((a, b) => b.score - a.score);
  }, [result]);

  return (
    <div className="flex-1 flex flex-col items-center gap-5 py-6">
      <div className="sticker bg-paper sticker-tilt-l">
        <IFlag size={14} /> Manche {room.round}/{room.totalRounds}
      </div>

      {/* 3-2-1 stamp */}
      <div key={label} className="relative animate-stamp">
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-stroke rounded-3xl" />
        <div
          className={`relative halftone overflow-hidden border-3 border-stroke rounded-3xl w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center ${
            label === "GO" ? "bg-moss" : "bg-tomato"
          }`}
        >
          <span className="font-display font-bold text-chalk text-[72px] sm:text-[88px] leading-none">{label}</span>
        </div>
      </div>

      {/* Letter card — always below the timer */}
      <div className="flex flex-col items-center">
        <div className="label-b">Lettre</div>
        <div className="mt-1 font-display font-bold text-4xl sm:text-5xl bg-chalk border-3 border-stroke rounded-2xl px-4 py-1 shadow-hard">
          {room.currentLetter}
        </div>
      </div>

      {/* Scores animated reveal (only after round 1) */}
      {showScores ? (
        <section className="brut p-3 w-full mt-2">
          <h3 className="font-display font-bold text-base flex items-center gap-2">
            <ITrophy size={18} /> Classement
            <span className="ml-auto label-b">après manche {result!.round}</span>
          </h3>
          <div className="mt-3 flex flex-col gap-2">
            {sorted.map((p, i) => {
              const gained = result!.gained[p.id] || 0;
              const prev = p.score - gained;
              const podium =
                i === 0 ? "bg-tomato text-chalk" :
                i === 1 ? "bg-bubble" :
                i === 2 ? "bg-mustard" : "bg-chalk";
              return (
                <ScoreRow
                  key={p.id}
                  rank={i + 1}
                  name={p.name}
                  avatar={p.avatar || null}
                  from={prev}
                  to={p.score}
                  gained={gained}
                  podium={podium}
                  delay={120 + i * 110}
                />
              );
            })}
          </div>
        </section>
      ) : (
        <div className="font-display font-bold text-ink/70 text-sm uppercase tracking-widest">
          Préparez-vous · {room.settings.categories.length} catégories · {room.settings.duration}s
        </div>
      )}
    </div>
  );
}

const TICK_MS = 800;

function ScoreRow({
  rank, name, avatar, from, to, gained, podium, delay,
}: {
  rank: number; name: string; avatar: any; from: number; to: number; gained: number;
  podium: string; delay: number;
}) {
  const [visible, setVisible] = useState(false);
  const [displayed, setDisplayed] = useState(from);
  const [showGain, setShowGain] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), Math.max(0, delay - 150));
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (gained === 0) {
      const t = setTimeout(() => setDisplayed(to), delay);
      return () => clearTimeout(t);
    }
    const startAt = performance.now() + delay;
    let raf: number;
    const step = (t: number) => {
      const elapsed = t - startAt;
      if (elapsed < 0) { raf = requestAnimationFrame(step); return; }
      if (!showGain) setShowGain(true);
      const k = Math.min(1, elapsed / TICK_MS);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, gained, delay]);

  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 rounded-xl border-3 border-stroke p-1.5 sm:p-2 transition-all duration-300 ${podium} ${
        visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-3"
      }`}
    >
      <div className="w-8 h-8 rounded-lg border-3 border-stroke bg-chalk text-ink flex items-center justify-center font-display font-bold text-sm shrink-0">
        {rank}
      </div>
      <Avatar config={avatar} size={32} className="shrink-0" />
      <div className="flex-1 font-display font-bold truncate text-sm sm:text-base">{name}</div>
      {gained > 0 && (
        <div
          className={`sticker !shadow-none !py-0.5 !text-xs bg-moss text-chalk transition-all duration-300 ${
            showGain ? "opacity-100 scale-100 -rotate-3" : "opacity-0 scale-50 -rotate-12"
          }`}
        >
          +{gained}
        </div>
      )}
      <div className="font-display font-bold text-lg tabular-nums w-10 text-right">{displayed}</div>
    </div>
  );
}
