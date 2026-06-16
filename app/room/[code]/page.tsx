"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket";
import type { Room, RoundResult } from "@/lib/types";
import Lobby from "@/components/Lobby";
import Countdown from "@/components/Countdown";
import Playing from "@/components/Playing";
import Voting from "@/components/Voting";
import Finished from "@/components/Finished";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { IArrowLeft, ICopy, ICheck, ICrown, IUsers } from "@/components/Icon";
import { sanitizeAvatar, randomAvatar } from "@/lib/avatar";

const STORAGE_NAME = "petitbac:name";
const STORAGE_AVATAR = "petitbac:avatar";

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code || "").toUpperCase();

  const [room, setRoom] = useState<Room | null>(null);
  const [you, setYou] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const joined = useRef(false);

  useEffect(() => {
    const name = (typeof window !== "undefined" && localStorage.getItem(STORAGE_NAME)) || "Joueur";
    let avatar: ReturnType<typeof sanitizeAvatar>;
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_AVATAR) : null;
      avatar = raw ? sanitizeAvatar(JSON.parse(raw)) : randomAvatar();
    } catch { avatar = randomAvatar(); }
    const sock = getSocket();

    const onUpdate = (r: Room) => setRoom(r);
    const onResult = (r: RoundResult) => setResult(r);
    const onRoundStart = () => setResult(null);

    sock.on("room:update", onUpdate);
    sock.on("round:result", onResult);
    sock.on("round:start", onRoundStart);

    function doJoin() {
      sock.emit("room:join", { code, name, avatar }, (res: any) => {
        if (!res?.ok) return setError(res?.error || "Erreur");
        setYou(res.you);
      });
    }
    if (sock.connected) doJoin();
    else sock.once("connect", doJoin);
    joined.current = true;

    return () => {
      sock.off("room:update", onUpdate);
      sock.off("round:result", onResult);
      sock.off("round:start", onRoundStart);
    };
  }, [code]);

  if (error) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center px-5 text-center gap-4">
        <div className="font-display text-6xl">×_×</div>
        <h2 className="font-display text-2xl font-bold">{error}</h2>
        <button className="btn-cobalt btn-b-lg" onClick={() => router.push("/")}>
          <IArrowLeft size={18} /> Retour à l'accueil
        </button>
      </main>
    );
  }
  if (!room || !you) {
    return (
      <main className="flex-1 flex items-center justify-center">
        <div className="font-display text-4xl animate-bob">…</div>
      </main>
    );
  }

  const isHost = room.hostId === you;

  return (
    <main className="flex-1 flex flex-col px-4 pt-4 pb-6">
      <Header
        room={room}
        isHost={isHost}
        you={you}
        onLeave={() => { getSocket().emit("room:leave"); router.push("/"); }}
      />
      {room.phase === "lobby" && <Lobby room={room} you={you} isHost={isHost} />}
      {room.phase === "countdown" && <Countdown room={room} result={result} />}
      {room.phase === "playing" && <Playing room={room} you={you} />}
      {room.phase === "voting" && <Voting room={room} you={you} isHost={isHost} />}
      {room.phase === "finished" && <Finished room={room} isHost={isHost} />}
    </main>
  );
}

function Header({ room, isHost, onLeave, you }: { room: Room; isHost: boolean; onLeave: () => void; you: string }) {
  const [copied, setCopied] = useState(false);
  const me = room.players.find((p) => p.id === you);
  function copy() {
    navigator.clipboard?.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <div className="flex items-center justify-between gap-2 mb-3">
      <button className="btn-paper !px-3 !py-2" onClick={onLeave} aria-label="Quitter">
        <IArrowLeft size={20} />
      </button>

      <button onClick={copy} className="group flex flex-col items-center active:scale-95 transition-transform">
        <span className="label-b">Code partie</span>
        <span className="mt-1 inline-flex items-center gap-2 font-mono font-bold text-xl tracking-[0.3em] bg-chalk border-3 border-stroke px-3 py-1 rounded-xl shadow-hardsm">
          {room.code}
          {copied ? <ICheck size={16} /> : <ICopy size={16} />}
        </span>
      </button>

      <div className="flex items-center gap-1.5">
        {me && (
          <div className="bg-chalk border-3 border-stroke rounded-xl p-0.5 shadow-hardsm">
            <Avatar config={me.avatar} size={32} />
          </div>
        )}
        <ThemeToggle className="!w-10 !h-10" />
      </div>
    </div>
  );
}
