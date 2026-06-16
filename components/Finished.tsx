"use client";
import { useMemo } from "react";
import { getSocket } from "@/lib/socket";
import type { Room } from "@/lib/types";
import type { AvatarConfig } from "@/lib/avatar";
import { ITrophy, IRefresh, ISparkles } from "./Icon";
import Avatar from "./Avatar";

export default function Finished({ room, isHost }: { room: Room; isHost: boolean }) {
  const sorted = useMemo(
    () => [...room.players].sort((a, b) => b.score - a.score),
    [room.players]
  );
  const [first, second, third, ...rest] = sorted;

  return (
    <div className="relative flex-1 flex flex-col items-center gap-5 px-2 py-4 overflow-hidden">
      <Confetti />

      <div className="relative z-10 inline-block animate-stamp">
        <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-stroke rounded-3xl" />
        <div className="relative halftone overflow-hidden bg-tomato text-chalk border-3 border-stroke rounded-3xl px-6 py-3 flex items-center gap-3">
          <ITrophy size={28} />
          <span className="font-display font-bold text-2xl tracking-wider">CHAMPION</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-md flex items-end justify-center gap-3 mt-2">
        {second && <PodiumStep player={second} rank={2} />}
        {first  && <PodiumStep player={first}  rank={1} />}
        {third  && <PodiumStep player={third}  rank={3} />}
      </div>

      {rest.length > 0 && (
        <div className="relative z-10 brut p-3 w-full max-w-md">
          <div className="label-b">Aussi présents</div>
          <div className="mt-2 flex flex-col gap-2">
            {rest.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 rounded-xl border-3 border-stroke p-2 bg-chalk">
                <div className="w-8 h-8 rounded-lg border-3 border-stroke bg-paper text-ink flex items-center justify-center font-display font-bold text-sm">{i + 4}</div>
                <Avatar config={p.avatar} size={32} className="shrink-0" />
                <div className="flex-1 font-display font-bold truncate">{p.name}</div>
                <div className="font-display font-bold text-lg tabular-nums">{p.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isHost ? (
        <button className="relative z-10 btn-tomato btn-b-lg w-full max-w-md" onClick={() => getSocket().emit("game:start")}>
          <IRefresh size={22} /> Rejouer
        </button>
      ) : (
        <div className="relative z-10 brut p-3 w-full max-w-md font-display font-bold text-center">
          L'hôte peut relancer une partie
        </div>
      )}
    </div>
  );
}

const STEP_HEIGHTS:  Record<number, string> = { 1: "h-44 sm:h-52", 2: "h-32 sm:h-40", 3: "h-24 sm:h-32" };
const STEP_BG:       Record<number, string> = { 1: "bg-tomato text-chalk", 2: "bg-bubble", 3: "bg-mustard" };
const STEP_DELAY_MS: Record<number, number> = { 1: 600, 2: 350, 3: 100 };
const AVATAR_SIZE:   Record<number, number> = { 1: 104, 2: 80, 3: 68 };
const MEDAL:         Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };
const HOP_CLASS:     Record<number, string> = { 1: "animate-hop1", 2: "animate-hop2", 3: "animate-hop3" };

function PodiumStep({
  player, rank,
}: {
  player: { id: string; name: string; score: number; avatar: AvatarConfig | null };
  rank: 1 | 2 | 3;
}) {
  const dropDelay = `${STEP_DELAY_MS[rank] + 200}ms`;
  const hopDelay  = `${STEP_DELAY_MS[rank] + 1100}ms`;

  return (
    <div
      className="flex-1 flex flex-col items-center justify-end"
      style={{ animation: `podiumRise 700ms cubic-bezier(.2,.9,.3,1.4) both`, animationDelay: `${STEP_DELAY_MS[rank]}ms` }}
    >
      <div className="relative -mb-1.5">
        {rank === 1 && (
          <div
            aria-hidden
            className="absolute -inset-3 rounded-full bg-mustard/60 blur-md animate-haloPulse"
            style={{ animationDelay: hopDelay }}
          />
        )}

        <div className="relative animate-dropIn" style={{ animationDelay: dropDelay }}>
          <div className={HOP_CLASS[rank]} style={{ animationDelay: hopDelay }}>
            <Avatar config={player.avatar} size={AVATAR_SIZE[rank]} />
          </div>
        </div>

        {rank === 1 && (
          <>
            <Twinkle className="-top-2 -left-4 text-mustard"  size={20} delay={`${STEP_DELAY_MS[1] + 1200}ms`} />
            <Twinkle className="-top-5 -right-2 text-tomato"  size={16} delay={`${STEP_DELAY_MS[1] + 1500}ms`} />
            <Twinkle className="top-1/2 -left-7 text-cobalt"  size={14} delay={`${STEP_DELAY_MS[1] + 1700}ms`} />
            <Twinkle className="top-1/3 -right-7 text-moss"   size={18} delay={`${STEP_DELAY_MS[1] + 1900}ms`} />
            <Twinkle className="-bottom-1 left-2 text-tomato" size={12} delay={`${STEP_DELAY_MS[1] + 2100}ms`} />
          </>
        )}
      </div>

      <div className={`relative w-full ${STEP_HEIGHTS[rank]} ${STEP_BG[rank]} border-3 border-stroke rounded-t-2xl shadow-hardlg flex flex-col items-center justify-start pt-2`}>
        <div className="text-2xl leading-none">{MEDAL[rank]}</div>
        <div className="font-display font-bold text-3xl sm:text-4xl leading-none mt-1">{rank}</div>
        <div className="font-display font-bold text-sm mt-2 px-1 truncate max-w-full">{player.name}</div>
        <div className="absolute bottom-2 font-display font-bold text-lg tabular-nums bg-chalk text-ink border-3 border-stroke rounded-lg px-2 shadow-hardsm">
          {player.score}
        </div>
      </div>
    </div>
  );
}

function Twinkle({
  className = "", size = 18, delay = "0ms",
}: { className?: string; size?: number; delay?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute pointer-events-none animate-twinkle ${className}`}
      style={{ animationDelay: delay }}
    >
      <ISparkles size={size} />
    </span>
  );
}

const CONFETTI_PIECES = 36;
const CONFETTI_COLORS = ["bg-tomato", "bg-cobalt", "bg-mustard", "bg-moss", "bg-bubble"];

function Confetti() {
  const pieces = useMemo(() => {
    return Array.from({ length: CONFETTI_PIECES }, (_, i) => {
      const left = (i * 17 + 7) % 100;
      const delay = ((i * 173) % 2500) / 1000;
      const dur = 3 + ((i * 53) % 2000) / 1000;
      const w = 8 + ((i * 7) % 8);
      const h = 6 + ((i * 11) % 10);
      const rot = (i * 47) % 360;
      const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
      const rounded = i % 4 === 0 ? "rounded-full" : "rounded-sm";
      return { i, left, delay, dur, w, h, rot, color, rounded };
    });
  }, []);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className={`absolute ${p.color} ${p.rounded} border-2 border-stroke`}
          style={{
            left: `${p.left}%`,
            top: "-12%",
            width: p.w,
            height: p.h,
            transform: `rotate(${p.rot}deg)`,
            animation: `confettiFall ${p.dur}s linear ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
