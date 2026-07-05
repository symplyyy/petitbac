"use client";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Player, Room, VotingItem } from "@/lib/types";
import { IBallot, ICheck, IX, ISparkles } from "./Icon";
import Avatar from "./Avatar";

type AiVerdict = {
  index: number;
  aiValid: boolean | null;
  aiExplanation: string | null;
  votes?: Record<string, boolean>;
};

const FALLBACK_TIMEOUT_MS = 12000;

export default function Voting({ room, you, isHost }: { room: Room; you: string; isHost: boolean }) {
  const [items, setItems] = useState<VotingItem[]>(room.voting?.items || []);
  const [forceReveal, setForceReveal] = useState(false);

  useEffect(() => {
    const s = getSocket();
    const onStart = (v: { items: VotingItem[] }) => setItems(v.items);
    const onUpdate = ({ index, votes }: { index: number; votes: Record<string, boolean> }) => {
      setItems((prev) => prev.map((it, i) => (i === index ? { ...it, votes } : it)));
    };
    const onAi = (updates: AiVerdict[]) => {
      setItems((prev) => {
        const next = prev.slice();
        for (const u of updates) {
          if (!next[u.index]) continue;
          next[u.index] = {
            ...next[u.index],
            aiValid: u.aiValid,
            aiExplanation: u.aiExplanation,
            votes: u.votes ?? next[u.index].votes,
          };
        }
        return next;
      });
    };
    s.on("voting:start", onStart);
    s.on("voting:update", onUpdate);
    s.on("ai:verdicts", onAi);
    return () => {
      s.off("voting:start", onStart);
      s.off("voting:update", onUpdate);
      s.off("ai:verdicts", onAi);
    };
  }, []);

  useEffect(() => { setItems(room.voting?.items || []); }, [room.voting]);

  // Safety net: never lock the UI forever if AI never replies
  useEffect(() => {
    setForceReveal(false);
    const t = setTimeout(() => setForceReveal(true), FALLBACK_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [room.currentLetter]);

  const totalAi = items.filter((it) => it.answer && it.autoValid).length;
  const doneAi  = items.filter((it) => it.answer && it.autoValid && typeof it.aiValid === "boolean").length;
  const stillLoading = !forceReveal && totalAi > 0 && doneAi < totalAi;

  if (stillLoading) return <PrepLoader doneAi={doneAi} totalAi={totalAi} />;

  const grouped = items.reduce<Record<string, { idx: number; item: VotingItem }[]>>((acc, it, idx) => {
    (acc[it.category] = acc[it.category] || []).push({ idx, item: it });
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col gap-3 pb-28">
      <VotingHeader items={items} letter={room.currentLetter} />

      <div className="md:grid md:grid-cols-2 md:gap-3 flex flex-col gap-3">
        {Object.entries(grouped).map(([cat, list]) => (
          <section key={cat} className="brut p-3">
            <h4 className="font-display font-bold text-cobalt uppercase tracking-wide text-sm">{cat}</h4>
            <div className="mt-2 flex flex-col gap-2">
              {list.map(({ idx, item }) => (
                <VoteRow
                  key={idx}
                  item={item}
                  you={you}
                  players={room.players}
                  onVote={(value) => getSocket().emit("vote:cast", { index: idx, value })}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3 bg-paper/95 backdrop-blur border-t-3 border-stroke">
        <div className="mx-auto w-full max-w-md md:max-w-xl lg:max-w-2xl">
          {isHost ? (
            <button className="btn-cobalt btn-b-lg w-full" onClick={() => getSocket().emit("vote:finish")}>
              <ICheck size={22} /> Calculer les scores
            </button>
          ) : (
            <div className="text-center font-display font-bold text-ink/70 py-3">L'hôte valide les scores…</div>
          )}
        </div>
      </div>
    </div>
  );
}

function VotingHeader({ items, letter }: { items: VotingItem[]; letter: string | null }) {
  return (
    <div className="brut p-3 flex items-center gap-3">
      <IBallot size={26} />
      <div className="flex-1 min-w-0">
        <div className="font-display font-bold text-lg">Validation</div>
        <div className="text-sm text-ink/60 truncate">
          Lettre <span className="font-mono font-bold">{letter}</span> · clique uniquement pour changer un avis
        </div>
      </div>
    </div>
  );
}

function PrepLoader({ doneAi, totalAi }: { doneAi: number; totalAi: number }) {
  const pct = totalAi > 0 ? Math.round((doneAi / totalAi) * 100) : 0;
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 py-10 px-4">
      <div className="relative">
        <div className="absolute inset-0 -translate-x-1 -translate-y-1 bg-cobalt/30 rounded-3xl blur-md animate-pulse" />
        <div className="relative bg-chalk border-3 border-stroke rounded-3xl shadow-hardlg w-24 h-24 flex items-center justify-center text-cobalt">
          <ISparkles size={42} className="animate-pulse" />
        </div>
      </div>
      <div className="text-center">
        <div className="font-display font-bold text-2xl">Préparation de la validation…</div>
        <div className="mt-1 text-ink/60 text-sm">On rassemble les réponses, c'est bientôt à toi.</div>
      </div>
      <div className="w-full max-w-xs">
        <div className="h-3 w-full border-3 border-stroke rounded-full bg-chalk overflow-hidden shadow-hardsm">
          <div className="h-full bg-cobalt transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function VoteRow({
  item, you, players, onVote,
}: { item: VotingItem; you: string; players: Player[]; onVote: (v: boolean) => void }) {
  const mine = item.playerId === you;
  const myVote = item.votes[you];
  const baseline = (typeof item.aiValid === "boolean") ? item.aiValid : item.autoValid;
  const aiPending = item.autoValid && item.answer && typeof item.aiValid !== "boolean";

  const nayIds = Object.entries(item.votes)
    .filter(([, v]) => v === false)
    .map(([id]) => id);
  const nays = nayIds
    .map((id) => players.find((p) => p.id === id))
    .filter((p): p is Player => !!p);

  const tone = !item.answer
    ? "bg-paper2"
    : !item.autoValid
      ? "bg-paper2"
      : baseline
        ? "bg-chalk"
        : "bg-paper2";

  return (
    <div className={`rounded-xl border-3 border-stroke p-2 ${tone}`}>
      <div className="flex items-center gap-2">
        <Avatar config={item.playerAvatar} size={32} className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-wider text-ink/50 truncate">
            {item.playerName}{mine && " · toi"}
          </div>
          <div className={`font-display font-bold truncate ${baseline ? "" : "line-through text-ink/40"}`}>
            {item.answer || <span className="text-ink/30">—</span>}
          </div>
        </div>

        {/* AI badge */}
        {item.answer && item.autoValid && (
          aiPending
            ? <span className="sticker bg-mustard !shadow-none animate-pulse"><ISparkles size={14} /> …</span>
            : typeof item.aiValid === "boolean"
              ? <span className={`sticker !shadow-none ${item.aiValid ? "bg-moss text-chalk" : "bg-tomato text-chalk"}`}>
                  <ISparkles size={14} /> {item.aiValid ? <ICheck size={12} /> : <IX size={12} />}
                </span>
              : null
        )}

        {/* Override buttons — only if it's not your own answer */}
        {item.answer && item.autoValid && !mine && (
          <div className="flex gap-1">
            <button
              onClick={() => onVote(true)}
              aria-label="Valider"
              className={`w-9 h-9 rounded-xl border-3 border-stroke shadow-hardsm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center ${myVote === true ? "bg-moss text-chalk" : "bg-chalk"}`}
            ><ICheck size={16} /></button>
            <button
              onClick={() => onVote(false)}
              aria-label="Refuser"
              className={`w-9 h-9 rounded-xl border-3 border-stroke shadow-hardsm active:translate-x-[2px] active:translate-y-[2px] active:shadow-none flex items-center justify-center ${myVote === false ? "bg-tomato text-chalk" : "bg-chalk"}`}
            ><IX size={16} /></button>
          </div>
        )}
      </div>

      {/* AI explanation — small culture-G snippet under the answer */}
      {item.aiExplanation && (
        <div className="mt-2 ml-10 text-[12px] leading-snug text-ink/70 italic flex gap-1.5">
          <ISparkles size={14} className="shrink-0 mt-0.5 opacity-50" />
          <span>{item.aiExplanation}</span>
        </div>
      )}

      {/* Refusé par — who voted this answer down */}
      {nays.length > 0 && (
        <div className="mt-2 ml-10 flex items-center gap-1.5 flex-wrap text-[11px] font-bold text-ink/70">
          <span className="inline-flex items-center gap-1 text-tomato">
            <IX size={12} /> Refusé par
          </span>
          {nays.map((p) => (
            <span
              key={p.id}
              className="inline-flex items-center gap-1 rounded-full bg-chalk border-3 border-stroke px-1.5 py-0.5"
              title={p.name}
            >
              <Avatar config={p.avatar} size={16} />
              <span className="truncate max-w-[80px]">
                {p.id === you ? "toi" : p.name}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
