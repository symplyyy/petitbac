export type Phase = "lobby" | "countdown" | "playing" | "voting" | "finished";

import type { AvatarConfig } from "./avatar";

export type Player = {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  connected: boolean;
  isHost: boolean;
  avatar: AvatarConfig | null;
};

export type Settings = {
  categories: string[];
  duration: number;
  totalRounds: number;
  maxPlayers: number;
  stopMode: "first" | "timer";
};

export type VotingItem = {
  category: string;
  playerId: string;
  playerName: string;
  playerAvatar?: AvatarConfig | null;
  answer: string;
  autoValid: boolean;
  aiValid?: boolean | null;
  aiExplanation?: string | null;
  aiFailed?: boolean;
  votes: Record<string, boolean>;
};

export type Room = {
  code: string;
  hostId: string;
  phase: Phase;
  players: Player[];
  settings: Settings;
  round: number;
  totalRounds: number;
  currentLetter: string | null;
  timerEnd: number | null;
  countdownEnd: number | null;
  stoppedBy: string | null;
  voting: { items: VotingItem[] } | null;
};

export type ChatMessage = {
  id: string;
  playerId: string;
  name: string;
  text: string;
  at: number;
};

export type ReactionEvent = {
  emoji: string;
  playerId: string;
  at: number;
};

export type RoundResult = {
  letter: string;
  items: VotingItem[];
  gained: Record<string, number>;
  players: { id: string; name: string; score: number; avatar?: AvatarConfig | null }[];
  round: number;
  totalRounds: number;
  finished: boolean;
};
