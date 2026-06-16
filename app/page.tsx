"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import { IPlay, IKey, IArrowLeft, IAlert, ISpark, ISettings, IX } from "@/components/Icon";
import AvatarPicker from "@/components/AvatarPicker";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { AvatarConfig, DEFAULT_AVATAR, randomAvatar, sanitizeAvatar } from "@/lib/avatar";

const STORAGE_NAME = "petitbac:name";
const STORAGE_AVATAR = "petitbac:avatar";

export default function HomePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<"home" | "create" | "join">("home");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setName(localStorage.getItem(STORAGE_NAME) || "");
    try {
      const raw = localStorage.getItem(STORAGE_AVATAR);
      setAvatar(raw ? sanitizeAvatar(JSON.parse(raw)) : randomAvatar());
    } catch {
      setAvatar(randomAvatar());
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_NAME, name);
  }, [name, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_AVATAR, JSON.stringify(avatar));
  }, [avatar, hydrated]);

  // ESC closes picker
  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setPickerOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pickerOpen]);

  function createRoom() {
    if (!name.trim()) return setError("Choisis un pseudo");
    setLoading(true); setError(null);
    getSocket().emit("room:create", { name: name.trim(), avatar }, (res: any) => {
      setLoading(false);
      if (!res?.ok) return setError(res?.error || "Erreur");
      router.push(`/room/${res.code}`);
    });
  }

  function joinRoom() {
    if (!name.trim()) return setError("Choisis un pseudo");
    if (!code.trim()) return setError("Entre un code");
    setLoading(true); setError(null);
    getSocket().emit("room:join", { code: code.trim().toUpperCase(), name: name.trim(), avatar }, (res: any) => {
      setLoading(false);
      if (!res?.ok) return setError(res?.error || "Erreur");
      router.push(`/room/${res.code}`);
    });
  }

  return (
    <main className="flex-1 flex flex-col items-center px-5 pt-4 pb-8 relative">
      <div className="self-end">
        <ThemeToggle />
      </div>
      {/* Hero */}
      <div className="w-full flex flex-col items-center mt-2">
        <div className="tape mb-3">multijoueur · en direct</div>
        <h1 className="font-display font-bold text-[64px] sm:text-[80px] leading-[0.9] tracking-tight text-center">
          PETIT<br />
          <span className="inline-block bg-tomato text-chalk border-3 border-stroke px-2 -rotate-1 shadow-hard">BAC</span>
        </h1>
        <p className="mt-4 font-bold text-ink/70 text-center max-w-xs">
          Le jeu de mots fulgurant — avec tes potes, où qu'ils soient.
        </p>
      </div>

      {/* Identity row: avatar preview + name */}
      <div className="w-full max-w-md mt-8 flex items-end gap-3">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Personnaliser l'avatar"
          className="relative shrink-0 group"
        >
          <div className="absolute inset-0 translate-x-1 translate-y-1 bg-stroke rounded-2xl" />
          <div className="relative bg-chalk border-3 border-stroke rounded-2xl p-1 transition-transform group-active:translate-x-[2px] group-active:translate-y-[2px]">
            <Avatar config={avatar} size={64} />
          </div>
          {/* edit badge */}
          <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-tomato border-3 border-stroke flex items-center justify-center text-chalk shadow-hardsm">
            <ISettings size={14} />
          </div>
        </button>

        <div className="flex-1">
          <label className="label-b">Ton pseudo</label>
          <input
            className="input-b mt-2"
            maxLength={20}
            placeholder="Ex. Tim"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      </div>

      {/* CTAs */}
      <div className="w-full max-w-md mt-5 flex flex-col gap-3">
        {mode === "home" && (
          <>
            <button className="btn-tomato btn-b-lg w-full" onClick={() => setMode("create")}>
              <IPlay size={22} /> Créer une partie
            </button>
            <button className="btn-cobalt btn-b-lg w-full" onClick={() => setMode("join")}>
              <IKey size={22} /> Rejoindre avec un code
            </button>
          </>
        )}

        {mode === "create" && (
          <div className="brut-lg p-5 animate-slidein">
            <h2 className="font-display text-2xl font-bold">Nouvelle partie</h2>
            <p className="mt-1 text-ink/70 text-sm">Tu seras l'hôte. Partage le code aux potes.</p>
            <button className="btn-tomato btn-b-lg w-full mt-4" disabled={loading} onClick={createRoom}>
              {loading ? "Création…" : <>C'est parti <IPlay size={20} /></>}
            </button>
            <button className="btn-paper w-full mt-2" onClick={() => setMode("home")}>
              <IArrowLeft size={18} /> Retour
            </button>
          </div>
        )}

        {mode === "join" && (
          <div className="brut-lg p-5 animate-slidein">
            <h2 className="font-display text-2xl font-bold">Code de partie</h2>
            <input
              className="input-b mt-3 font-mono tracking-[0.4em] text-center text-2xl uppercase"
              placeholder="ABC123"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
            />
            <button className="btn-cobalt btn-b-lg w-full mt-4" disabled={loading} onClick={joinRoom}>
              {loading ? "Connexion…" : <>Rejoindre <IKey size={20} /></>}
            </button>
            <button className="btn-paper w-full mt-2" onClick={() => setMode("home")}>
              <IArrowLeft size={18} /> Retour
            </button>
          </div>
        )}

        {error && (
          <div className="sticker bg-tomato text-chalk sticker-tilt-l">
            <IAlert size={16} /> {error}
          </div>
        )}
      </div>

      <div className="mt-auto pt-10 w-full">
        <div className="flex items-center justify-center gap-2 text-ink/40 text-xs font-mono uppercase tracking-widest">
          <ISpark size={14} /> v1 · made with grain & ink <ISpark size={14} />
        </div>
      </div>

      {/* Avatar picker modal */}
      {pickerOpen && (
        <AvatarModal
          avatar={avatar}
          onChange={setAvatar}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </main>
  );
}

function AvatarModal({
  avatar, onChange, onClose,
}: { avatar: AvatarConfig; onChange: (a: AvatarConfig) => void; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-slidein"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
      <div
        className="relative w-full sm:max-w-md sm:m-4 bg-paper border-3 border-stroke rounded-t-3xl sm:rounded-3xl shadow-hardxl max-h-[92vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-paper border-b-3 border-stroke">
          <h2 className="font-display font-bold text-xl">Customise ton avatar</h2>
          <button onClick={onClose} className="btn-paper !px-2.5 !py-2" aria-label="Fermer">
            <IX size={18} />
          </button>
        </div>
        <div className="p-4">
          <AvatarPicker value={avatar} onChange={onChange} />
          <button className="btn-tomato btn-b-lg w-full mt-4" onClick={onClose}>
            C'est bon
          </button>
        </div>
      </div>
    </div>
  );
}
