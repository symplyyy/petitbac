export type AvatarConfig = {
  color: string;   // body color hex
  hat: HatId;
  eyes: EyesId;
  mouth: MouthId;
};

export type HatId = "none" | "crown" | "beret" | "cap" | "party" | "tophat";
export type EyesId = "dot" | "big" | "sleepy" | "star" | "heart";
export type MouthId = "smile" | "ooh" | "teeth" | "tongue" | "flat";

export const COLORS: { id: string; hex: string; name: string }[] = [
  { id: "pink",   hex: "#FF3D85", name: "Rose" },
  { id: "blue",   hex: "#2536EB", name: "Bleu" },
  { id: "mint",   hex: "#4FD1B7", name: "Menthe" },
  { id: "sky",    hex: "#6FC8FF", name: "Ciel" },
  { id: "sun",    hex: "#FFD15C", name: "Soleil" },
  { id: "coral",  hex: "#FFA177", name: "Corail" },
  { id: "lilac",  hex: "#C9A6FF", name: "Lilas" },
  { id: "cream",  hex: "#FFFAFC", name: "Crème" },
];

export const HATS: HatId[]  = ["none", "crown", "beret", "cap", "party", "tophat"];
export const EYES: EyesId[] = ["dot", "big", "sleepy", "star", "heart"];
export const MOUTHS: MouthId[] = ["smile", "ooh", "teeth", "tongue", "flat"];

export const DEFAULT_AVATAR: AvatarConfig = {
  color: "#FF3D85",
  hat: "none",
  eyes: "big",
  mouth: "smile",
};

export function randomAvatar(): AvatarConfig {
  const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
  return {
    color: pick(COLORS).hex,
    hat: pick(HATS),
    eyes: pick(EYES),
    mouth: pick(MOUTHS),
  };
}

export function sanitizeAvatar(a: any): AvatarConfig {
  const v = a && typeof a === "object" ? a : {};
  const safeHex = typeof v.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(v.color)
    ? v.color : DEFAULT_AVATAR.color;
  return {
    color: safeHex,
    hat:   HATS.includes(v.hat)     ? v.hat   : DEFAULT_AVATAR.hat,
    eyes:  EYES.includes(v.eyes)    ? v.eyes  : DEFAULT_AVATAR.eyes,
    mouth: MOUTHS.includes(v.mouth) ? v.mouth : DEFAULT_AVATAR.mouth,
  };
}
