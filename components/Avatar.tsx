"use client";
import type { AvatarConfig, EyesId, HatId, MouthId } from "@/lib/avatar";
import { DEFAULT_AVATAR } from "@/lib/avatar";

const INK = "#141426";
const WHITE = "#FFFAFC";
const BLUSH = "#FF6FB1";

export default function Avatar({
  config,
  size = 56,
  className = "",
}: { config?: AvatarConfig | null; size?: number; className?: string }) {
  const a = config || DEFAULT_AVATAR;
  const hasHat = a.hat !== "none";

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className={className} aria-hidden>
      {/* Floor shadow — gives 'standing' feel without legs */}
      <ellipse cx="50" cy="93" rx="30" ry="3.5" fill={INK} opacity="0.15" />

      {/* Hair tuft (only when no hat) — drawn first so body overlaps */}
      {!hasHat && (
        <path
          d="M 47 11 q -3 -9 4 -10 q 4 0 4 4 q 0 4 -8 6 Z"
          fill={a.color}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
      )}

      {/* Body — chubby mochi blob */}
      <path
        d="
          M 50 14
          C 80 14 90 34 90 54
          C 90 78 74 90 50 90
          C 26 90 10 78 10 54
          C 10 34 20 14 50 14 Z"
        fill={a.color}
        stroke={INK}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      {/* Upper-left soft shine */}
      <ellipse cx="30" cy="32" rx="10" ry="6" fill={WHITE} opacity="0.55" transform="rotate(-22 30 32)" />

      {/* Cheek blushes — small soft dots */}
      <ellipse cx="24" cy="64" rx="5" ry="3.5" fill={BLUSH} opacity="0.7" />
      <ellipse cx="76" cy="64" rx="5" ry="3.5" fill={BLUSH} opacity="0.7" />

      {/* Face */}
      <Eyes id={a.eyes} />
      <Mouth id={a.mouth} />

      {/* Hat — drawn last so it sits on top */}
      <Hat id={a.hat} />
    </svg>
  );
}

function Eyes({ id }: { id: EyesId }) {
  const cx1 = 35, cx2 = 65, cy = 50;
  switch (id) {
    case "dot":
      return (
        <g fill={INK}>
          <ellipse cx={cx1} cy={cy} rx="3.5" ry="4.5" />
          <ellipse cx={cx2} cy={cy} rx="3.5" ry="4.5" />
        </g>
      );
    case "big":
      return (
        <g>
          {/* outer */}
          <circle cx={cx1} cy={cy} r="9" fill={WHITE} stroke={INK} strokeWidth="3.8" />
          <circle cx={cx2} cy={cy} r="9" fill={WHITE} stroke={INK} strokeWidth="3.8" />
          {/* pupil */}
          <circle cx={cx1 + 1} cy={cy + 2} r="4.6" fill={INK} />
          <circle cx={cx2 + 1} cy={cy + 2} r="4.6" fill={INK} />
          {/* sparkles */}
          <circle cx={cx1 + 3} cy={cy - 0.4} r="1.8" fill={WHITE} />
          <circle cx={cx2 + 3} cy={cy - 0.4} r="1.8" fill={WHITE} />
          <circle cx={cx1 - 1.6} cy={cy + 3.6} r="0.9" fill={WHITE} />
          <circle cx={cx2 - 1.6} cy={cy + 3.6} r="0.9" fill={WHITE} />
        </g>
      );
    case "sleepy":
      return (
        <g fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round">
          <path d={`M${cx1 - 7} ${cy + 1} q7 6 14 0`} />
          <path d={`M${cx2 - 7} ${cy + 1} q7 6 14 0`} />
          {/* tiny lashes */}
          <path d={`M${cx1 - 8} ${cy - 1} l -2 -2`} />
          <path d={`M${cx2 + 8} ${cy - 1} l 2 -2`} />
        </g>
      );
    case "star":
      return (
        <g fill={INK}>
          <Star cx={cx1} cy={cy} r={7} />
          <Star cx={cx2} cy={cy} r={7} />
        </g>
      );
    case "heart":
      return (
        <g fill="#FF3D85" stroke={INK} strokeWidth="2.8" strokeLinejoin="round">
          <Heart cx={cx1} cy={cy} s={7.5} />
          <Heart cx={cx2} cy={cy} s={7.5} />
        </g>
      );
  }
}

function Mouth({ id }: { id: MouthId }) {
  const cx = 50, cy = 70;
  switch (id) {
    case "smile":
      return (
        <path
          d={`M${cx - 6} ${cy} q6 6 12 0`}
          fill="none"
          stroke={INK}
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      );
    case "ooh":
      return <ellipse cx={cx} cy={cy + 1} rx="3.5" ry="4.5" fill={INK} />;
    case "teeth":
      return (
        <g>
          <rect x={cx - 8} y={cy - 3} width="16" height="8" rx="3" fill={WHITE} stroke={INK} strokeWidth="3" />
          <line x1={cx} y1={cy - 3} x2={cx} y2={cy + 5} stroke={INK} strokeWidth="2" />
        </g>
      );
    case "tongue":
      return (
        <g>
          <path d={`M${cx - 8} ${cy} q8 10 16 0`} fill={WHITE} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
          <path d={`M${cx - 4} ${cy + 4} q4 6 8 0 v-2 h-8 z`} fill={BLUSH} stroke={INK} strokeWidth="2" />
        </g>
      );
    case "flat":
      return (
        <line
          x1={cx - 6} y1={cy + 1} x2={cx + 6} y2={cy + 1}
          stroke={INK} strokeWidth="3.5" strokeLinecap="round"
        />
      );
  }
}

function Hat({ id }: { id: HatId }) {
  switch (id) {
    case "none":
      return null;
    case "crown":
      return (
        <g transform="translate(0 -1)">
          <path
            d="M 22 22 L 30 8 L 40 18 L 50 4 L 60 18 L 70 8 L 78 22 Z"
            fill="#FFD15C"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="30" cy="8"  r="1.8" fill="#FF3D85" stroke={INK} strokeWidth="1.4" />
          <circle cx="50" cy="4"  r="2.2" fill="#FF3D85" stroke={INK} strokeWidth="1.4" />
          <circle cx="70" cy="8"  r="1.8" fill="#FF3D85" stroke={INK} strokeWidth="1.4" />
        </g>
      );
    case "beret":
      return (
        <g transform="translate(0 -1)">
          <ellipse cx="50" cy="18" rx="28" ry="7" fill="#2536EB" stroke={INK} strokeWidth="3.5" />
          <ellipse cx="50" cy="13" rx="22" ry="6" fill="#2536EB" stroke={INK} strokeWidth="3.5" />
          <circle cx="68" cy="5" r="3.5" fill="#2536EB" stroke={INK} strokeWidth="3" />
        </g>
      );
    case "cap":
      return (
        <g transform="translate(0 -1)">
          <path
            d="M 20 22 Q 20 4 50 4 Q 80 4 80 22 Z"
            fill="#FF3D85"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <rect x="58" y="20" width="22" height="6" rx="3" fill="#FF3D85" stroke={INK} strokeWidth="3.5" />
          <circle cx="50" cy="9" r="2.4" fill={WHITE} stroke={INK} strokeWidth="1.6" />
        </g>
      );
    case "party":
      return (
        <g transform="translate(0 -1)">
          <path
            d="M 50 -4 L 32 26 L 68 26 Z"
            fill="#4FD1B7"
            stroke={INK}
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <circle cx="50" cy="-3" r="4" fill="#FFD15C" stroke={INK} strokeWidth="2.5" />
          <circle cx="42" cy="12" r="2" fill="#FF3D85" />
          <circle cx="58" cy="16" r="2" fill="#FFD15C" />
          <circle cx="48" cy="20" r="1.6" fill="#FF3D85" />
        </g>
      );
    case "tophat":
      return (
        <g transform="translate(0 -1)">
          <rect x="32" y="0" width="36" height="22" fill={INK} />
          <rect x="20" y="20" width="60" height="6" rx="2" fill={INK} />
          <rect x="32" y="14" width="36" height="3" fill="#FF3D85" />
          <rect x="36" y="3" width="3" height="7" fill={WHITE} opacity="0.5" />
        </g>
      );
  }
}

function Star({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    pts.push(`${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`);
  }
  return <polygon points={pts.join(" ")} />;
}

function Heart({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  return (
    <path
      d={`M${cx} ${cy + s * 0.55}
          C ${cx - s} ${cy}, ${cx - s} ${cy - s * 0.55}, ${cx} ${cy - s * 0.2}
          C ${cx + s} ${cy - s * 0.55}, ${cx + s} ${cy}, ${cx} ${cy + s * 0.55} Z`}
    />
  );
}
