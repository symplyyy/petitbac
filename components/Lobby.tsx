"use client";
import { useState } from "react";
import { getSocket } from "@/lib/socket";
import type { Room } from "@/lib/types";
import { IUsers, ISettings, IPlus, IMinus, ICheck, IPlay, IHand, IClock, ICrown } from "./Icon";
import Avatar from "./Avatar";

const PRESET_CATEGORIES = [
  "Prénom", "Pays", "Ville", "Animal", "Métier",
  "Fruit ou légume", "Objet", "Couleur", "Marque", "Célébrité",
  "Plat", "Film", "Sport", "Instrument", "Vêtement", "Boisson",
];

export default function Lobby({ room, you, isHost }: { room: Room; you: string; isHost: boolean }) {
  const [newCat, setNewCat] = useState("");
  const s = getSocket();

  function updateSettings(patch: Partial<Room["settings"]>) {
    s.emit("room:settings", { settings: { ...room.settings, ...patch } });
  }
  function toggleCat(c: string) {
    if (!isHost) return;
    const has = room.settings.categories.includes(c);
    updateSettings({
      categories: has
        ? room.settings.categories.filter((x) => x !== c)
        : [...room.settings.categories, c],
    });
  }
  function addCustom() {
    const v = newCat.trim();
    if (!v) return;
    if (!room.settings.categories.includes(v)) updateSettings({ categories: [...room.settings.categories, v] });
    setNewCat("");
  }

  return (
    <div className="flex-1 flex flex-col gap-4 md:grid md:grid-cols-2 md:gap-5 md:items-start">
      <section className="brut p-4 md:col-span-2">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <IUsers size={20} /> Joueurs
          <span className="ml-auto sticker bg-paper">{room.players.length}</span>
        </h3>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {room.players.map((p, i) => (
            <div
              key={p.id}
              className={`brut !shadow-hardsm p-2 flex flex-col items-center text-center ${p.connected ? "" : "opacity-50"} ${i % 2 ? "rotate-[1.5deg]" : "rotate-[-1.5deg]"}`}
            >
              <Avatar config={p.avatar} size={56} />
              <div className="mt-1 font-display font-bold text-sm flex items-center gap-1 max-w-full truncate">
                {p.isHost && <ICrown size={12} />}
                <span className="truncate">{p.name}</span>
              </div>
              {p.id === you && <div className="text-[10px] uppercase font-bold tracking-wider text-ink/50">toi</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="brut p-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <ISettings size={20} /> Catégories
          <span className="ml-auto sticker bg-paper">{room.settings.categories.length}</span>
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESET_CATEGORIES.map((c) => {
            const on = room.settings.categories.includes(c);
            return (
              <button
                key={c}
                disabled={!isHost}
                onClick={() => toggleCat(c)}
                className={`sticker transition-transform ${on ? "bg-cobalt text-chalk" : "bg-chalk"} ${!isHost && "opacity-80 cursor-not-allowed"}`}
              >
                {on && <ICheck size={12} />}
                {c}
              </button>
            );
          })}
          {room.settings.categories.filter((c) => !PRESET_CATEGORIES.includes(c)).map((c) => (
            <button key={c} disabled={!isHost} onClick={() => toggleCat(c)} className="sticker bg-tomato text-chalk">
              <ICheck size={12} /> {c}
            </button>
          ))}
        </div>
        {isHost && (
          <div className="mt-3 flex gap-2">
            <input
              className="input-b !py-2"
              placeholder="Catégorie perso…"
              value={newCat}
              maxLength={24}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
            />
            <button className="btn-moss !px-4" onClick={addCustom} aria-label="Ajouter"><IPlus size={20} /></button>
          </div>
        )}
      </section>

      <section className="brut p-4">
        <h3 className="font-display text-xl font-bold flex items-center gap-2">
          <IClock size={20} /> Règles
        </h3>

        <div className="mt-3 flex flex-col gap-4">
          <Stepper
            label="Durée"
            value={`${room.settings.duration}s`}
            disabled={!isHost}
            onDec={() => updateSettings({ duration: Math.max(15, room.settings.duration - 15) })}
            onInc={() => updateSettings({ duration: Math.min(180, room.settings.duration + 15) })}
          />
          <Stepper
            label="Manches"
            value={`${room.settings.totalRounds}`}
            disabled={!isHost}
            onDec={() => updateSettings({ totalRounds: Math.max(1, room.settings.totalRounds - 1) })}
            onInc={() => updateSettings({ totalRounds: Math.min(15, room.settings.totalRounds + 1) })}
          />
          <Stepper
            label={`Joueurs max (${room.players.length} actuels)`}
            value={`${room.settings.maxPlayers}`}
            disabled={!isHost}
            onDec={() => updateSettings({ maxPlayers: Math.max(Math.max(2, room.players.length), room.settings.maxPlayers - 1) })}
            onInc={() => updateSettings({ maxPlayers: Math.min(12, room.settings.maxPlayers + 1) })}
          />
        </div>

        <div className="mt-4">
          <div className="label-b">Mode d'arrêt</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              disabled={!isHost}
              onClick={() => updateSettings({ stopMode: "first" })}
              className={`btn-b ${room.settings.stopMode === "first" ? "bg-tomato text-chalk" : "bg-chalk"}`}
            >
              <IHand size={18} /> Stop libre
            </button>
            <button
              disabled={!isHost}
              onClick={() => updateSettings({ stopMode: "timer" })}
              className={`btn-b ${room.settings.stopMode === "timer" ? "bg-tomato text-chalk" : "bg-chalk"}`}
            >
              <IClock size={18} /> Timer seul
            </button>
          </div>
        </div>
      </section>

      {isHost ? (
        <button
          className="btn-moss btn-b-lg w-full mt-2 md:col-span-2"
          disabled={room.settings.categories.length < 2}
          onClick={() => s.emit("game:start")}
        >
          <IPlay size={22} /> Démarrer la partie
        </button>
      ) : (
        <div className="brut p-4 text-center md:col-span-2">
          <div className="font-display text-xl font-bold animate-bob inline-block">En attente de l'hôte…</div>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label, value, disabled, onDec, onInc,
}: { label: string; value: string; disabled: boolean; onDec: () => void; onInc: () => void; }) {
  return (
    <div>
      <div className="label-b">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        <button disabled={disabled} className="btn-paper !px-3 !py-2" onClick={onDec} aria-label="−"><IMinus size={18} /></button>
        <div className="flex-1 text-center font-display text-2xl font-bold tabular-nums">{value}</div>
        <button disabled={disabled} className="btn-paper !px-3 !py-2" onClick={onInc} aria-label="+"><IPlus size={18} /></button>
      </div>
    </div>
  );
}
