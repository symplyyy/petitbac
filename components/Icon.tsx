import { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = (p: P) => ({
  width: p.size ?? 24,
  height: p.size ?? 24,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IDice = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
  </svg>
);

export const IPlay = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 4.5v15l13-7.5z" />
  </svg>
);

export const IKey = (p: P) => (
  <svg {...base(p)}>
    <circle cx="8" cy="14" r="4" />
    <path d="M11 12l9-9" />
    <path d="M16 5l3 3" />
  </svg>
);

export const IArrowLeft = (p: P) => (
  <svg {...base(p)}>
    <path d="M19 12H5" />
    <path d="M12 5l-7 7 7 7" />
  </svg>
);

export const IArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);

export const ICopy = (p: P) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const ICheck = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12l5 5L20 6" />
  </svg>
);

export const IX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const IPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IMinus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);

export const ICrown = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 17l2-10 5 5 2-8 2 8 5-5 2 10z" />
    <path d="M3 20h18" />
  </svg>
);

export const IUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
    <circle cx="17" cy="9" r="2.8" />
    <path d="M21.5 19.5c0-2.7-2-4.5-4.5-4.5" />
  </svg>
);

export const ISettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const IClock = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const IHand = (p: P) => (
  <svg {...base(p)}>
    <path d="M9 11V5.5a1.5 1.5 0 1 1 3 0V11" />
    <path d="M12 11V4.5a1.5 1.5 0 1 1 3 0V11" />
    <path d="M15 11V6.5a1.5 1.5 0 1 1 3 0V13c0 4-2.5 7-7 7s-7-3-7-7v-2a1.5 1.5 0 1 1 3 0V11" />
  </svg>
);

export const ITrophy = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 4h8v4a4 4 0 1 1-8 0V4z" />
    <path d="M16 6h3v2a3 3 0 0 1-3 3" />
    <path d="M8 6H5v2a3 3 0 0 0 3 3" />
    <path d="M10 14h4l-.5 4h-3z" />
    <path d="M7 21h10" />
  </svg>
);

export const IRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const ISpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v6M12 15v6M3 12h6M15 12h6M5.6 5.6l4.2 4.2M14.2 14.2l4.2 4.2M18.4 5.6l-4.2 4.2M9.8 14.2l-4.2 4.2" />
  </svg>
);

export const IAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3 2 20h20L12 3z" />
    <path d="M12 10v5" />
    <circle cx="12" cy="17.5" r="0.6" fill="currentColor" />
  </svg>
);

export const IStop = (p: P) => (
  <svg {...base(p)}>
    <rect x="5" y="5" width="14" height="14" rx="2" />
  </svg>
);

export const IFlag = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 21V4" />
    <path d="M5 4h11l-2 4 2 4H5" />
  </svg>
);

export const IBallot = (p: P) => (
  <svg {...base(p)}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M7 11l2.5 2.5L15 8" />
  </svg>
);

export const ISparkles = (p: P) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    {/* big 4-point sparkle */}
    <path d="M14 3 L15.6 9.4 L22 11 L15.6 12.6 L14 19 L12.4 12.6 L6 11 L12.4 9.4 Z" />
    {/* small sparkle */}
    <path d="M6.5 14 L7.2 16.3 L9.5 17 L7.2 17.7 L6.5 20 L5.8 17.7 L3.5 17 L5.8 16.3 Z" />
  </svg>
);

export const IList = (p: P) => (
  <svg {...base(p)}>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="4" cy="6" r="1" fill="currentColor" />
    <circle cx="4" cy="12" r="1" fill="currentColor" />
    <circle cx="4" cy="18" r="1" fill="currentColor" />
  </svg>
);
