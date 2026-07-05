"use client";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";
import type { ChatMessage, Phase, Player } from "@/lib/types";
import Avatar from "./Avatar";
import { IChat, ISend, IX } from "./Icon";

export default function ChatPanel({
  players,
  you,
  phase,
}: {
  players: Player[];
  you: string;
  phase: Phase;
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [unread, setUnread] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const sock = getSocket();
    const onMsg = (m: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), m]);
    };
    sock.on("chat:msg", onMsg);
    return () => {
      sock.off("chat:msg", onMsg);
    };
  }, []);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    if (!open && last.playerId !== you) setUnread((n) => n + 1);
  }, [messages, open, you]);

  useEffect(() => {
    if (!open) return;
    setUnread(0);
    const t = window.setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      inputRef.current?.focus();
    }, 30);
    return () => window.clearTimeout(t);
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function send() {
    const t = text.trim();
    if (!t) return;
    getSocket().emit("chat:send", { text: t });
    setText("");
  }

  const bottomClass = phase === "playing" ? "bottom-24" : "bottom-3";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={unread > 0 ? `Chat, ${unread} non lus` : "Ouvrir le chat"}
        className={`fixed ${bottomClass} right-3 z-40 w-12 h-12 rounded-2xl bg-cobalt text-chalk border-3 border-stroke shadow-hard flex items-center justify-center active:translate-x-[2px] active:translate-y-[2px] active:shadow-hardsm transition-transform pb-[env(safe-area-inset-bottom)]`}
      >
        <IChat size={22} />
        {unread > 0 && (
          <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-tomato text-chalk border-3 border-stroke text-[11px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-slidein"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" />
          <div
            className="relative w-full sm:max-w-md sm:m-4 bg-paper border-3 border-stroke rounded-t-3xl sm:rounded-3xl shadow-hardxl flex flex-col h-[82vh] sm:h-[70vh]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Chat de la partie"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b-3 border-stroke">
              <h2 className="font-display font-bold text-xl">Chat</h2>
              <button
                onClick={() => setOpen(false)}
                className="btn-paper !px-2.5 !py-2"
                aria-label="Fermer"
              >
                <IX size={18} />
              </button>
            </div>

            <div
              ref={listRef}
              className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 flex flex-col gap-2"
            >
              {messages.length === 0 ? (
                <div className="text-ink/50 text-center text-sm mt-6 font-bold">
                  Aucun message. Lance la discussion !
                </div>
              ) : (
                messages.map((m) => {
                  const mine = m.playerId === you;
                  const p = players.find((pp) => pp.id === m.playerId);
                  return (
                    <div
                      key={m.id}
                      className={`flex gap-2 items-end ${mine ? "flex-row-reverse" : ""}`}
                    >
                      {!mine && p?.avatar && (
                        <div className="shrink-0">
                          <Avatar config={p.avatar} size={28} />
                        </div>
                      )}
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 border-3 border-stroke shadow-hardsm ${
                          mine ? "bg-cobalt text-chalk" : "bg-chalk"
                        }`}
                      >
                        {!mine && (
                          <div className="text-[11px] font-bold opacity-60 mb-0.5">
                            {m.name}
                          </div>
                        )}
                        <div className="text-sm font-bold break-words whitespace-pre-wrap">
                          {m.text}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 p-3 border-t-3 border-stroke pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <input
                ref={inputRef}
                className="input-b flex-1"
                placeholder="Écris un message…"
                value={text}
                maxLength={200}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
              />
              <button
                type="button"
                className="btn-tomato !px-4"
                onClick={send}
                disabled={!text.trim()}
                aria-label="Envoyer"
              >
                <ISend size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
