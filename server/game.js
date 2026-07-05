const { customAlphabet } = require("nanoid");
const { validateBatch } = require("./ai");
const nanoCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6);

const HATS = ["none", "crown", "beret", "cap", "party", "tophat"];
const EYES_K = ["dot", "big", "sleepy", "star", "heart"];
const MOUTHS = ["smile", "ooh", "teeth", "tongue", "flat"];

function sanitizeAvatar(a) {
  const v = a && typeof a === "object" ? a : {};
  const color = typeof v.color === "string" && /^#[0-9A-Fa-f]{6}$/.test(v.color) ? v.color : "#FF3D85";
  return {
    color,
    hat:   HATS.includes(v.hat)     ? v.hat   : "none",
    eyes:  EYES_K.includes(v.eyes)  ? v.eyes  : "big",
    mouth: MOUTHS.includes(v.mouth) ? v.mouth : "smile",
  };
}

const DEFAULT_CATEGORIES = [
  "Prénom", "Pays", "Ville", "Animal", "Métier",
  "Fruit ou légume", "Objet", "Couleur", "Marque", "Célébrité",
];
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter((l) => !["K", "W", "X", "Y", "Z"].includes(l));

// In-memory store. For prod use Redis.
const rooms = new Map();

function newRoom(hostId, hostName, hostAvatar) {
  let code;
  do { code = nanoCode(); } while (rooms.has(code));
  const room = {
    code,
    hostId,
    phase: "lobby", // lobby | playing | voting | scoreboard | finished
    players: new Map(), // id -> { id, name, score, ready, connected }
    settings: {
      categories: [...DEFAULT_CATEGORIES.slice(0, 6)],
      duration: 60,
      totalRounds: 5,
      maxPlayers: 8,
      stopMode: "first", // 'first' (un joueur peut stopper) | 'timer'
    },
    round: 0,
    currentLetter: null,
    usedLetters: [],
    answers: {}, // playerId -> { category -> string }
    stoppedBy: null,
    timer: null,
    timerEnd: null,
    voting: null, // { items: [{category, playerId, answer, votes: {voterId: bool}}] }
    messages: [],
  };
  room.players.set(hostId, { id: hostId, name: hostName, avatar: hostAvatar, score: 0, ready: false, connected: true, isHost: true });
  rooms.set(code, room);
  return room;
}

function publicRoom(room) {
  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    players: [...room.players.values()].map((p) => ({
      id: p.id, name: p.name, avatar: p.avatar || null, score: p.score, ready: p.ready, connected: p.connected, isHost: p.id === room.hostId,
    })),
    settings: room.settings,
    round: room.round,
    totalRounds: room.settings.totalRounds,
    currentLetter: room.currentLetter,
    timerEnd: room.timerEnd,
    countdownEnd: room.countdownEnd || null,
    stoppedBy: room.stoppedBy,
    voting: room.voting,
  };
}

function pickLetter(room) {
  const remaining = ALPHABET.filter((l) => !room.usedLetters.includes(l));
  const pool = remaining.length ? remaining : ALPHABET;
  const letter = pool[Math.floor(Math.random() * pool.length)];
  room.usedLetters.push(letter);
  return letter;
}

function clearTimer(room) {
  if (room.timer) { clearTimeout(room.timer); room.timer = null; }
  room.timerEnd = null;
}

function endRound(io, room, stoppedBy = null) {
  if (room.phase !== "playing") return;
  clearTimer(room);
  room.stoppedBy = stoppedBy;
  room.phase = "voting";

  // Build voting items: for each category, gather answers per player
  const items = [];
  for (const cat of room.settings.categories) {
    for (const p of room.players.values()) {
      const raw = (room.answers[p.id]?.[cat] || "").trim();
      const valid = raw.length > 0 && raw[0].toLowerCase() === room.currentLetter.toLowerCase();
      items.push({
        category: cat,
        playerId: p.id,
        playerName: p.name,
        playerAvatar: p.avatar || null,
        answer: raw,
        autoValid: valid,
        aiValid: null,
        aiExplanation: null,
        votes: {}, // voterId -> bool
      });
    }
  }
  room.voting = { items };
  io.to(room.code).emit("room:update", publicRoom(room));
  io.to(room.code).emit("voting:start", room.voting);

  // Kick off AI validation in background (don't await)
  judgeWithAI(io, room).catch((err) => console.error("[ai] judge error:", err.message));
}

async function judgeWithAI(io, room) {
  const roundLetter = room.currentLetter;
  const targetIndexes = [];
  const askPayload = [];
  for (let i = 0; i < room.voting.items.length; i++) {
    const it = room.voting.items[i];
    if (!it.answer || !it.autoValid) continue; // skip empty / wrong-letter, already invalid
    targetIndexes.push(i);
    askPayload.push({ category: it.category, answer: it.answer });
  }
  if (!askPayload.length) return;

  const verdicts = await validateBatch(roundLetter, askPayload);

  // Bail out if the round moved on
  if (room.phase !== "voting" || room.currentLetter !== roundLetter || !room.voting) return;

  const updates = [];
  for (let k = 0; k < targetIndexes.length; k++) {
    const idx = targetIndexes[k];
    const v = verdicts[k];
    const item = room.voting.items[idx];
    if (v) {
      item.aiValid = v.valid;
      item.aiExplanation = v.explanation || null;
    } else {
      // Fallback so the client never stays in pending state
      item.aiValid = item.autoValid;
      item.aiExplanation = null;
    }
    // Auto-cast each connected player's vote to match the AI verdict
    // (the author gets no vote, and any existing vote is respected)
    for (const p of room.players.values()) {
      if (!p.connected || p.id === item.playerId) continue;
      if (!(p.id in item.votes)) item.votes[p.id] = item.aiValid;
    }
    updates.push({
      index: idx,
      aiValid: item.aiValid,
      aiExplanation: item.aiExplanation,
      votes: item.votes,
    });
  }
  if (updates.length) io.to(room.code).emit("ai:verdicts", updates);
}

function computeScores(room) {
  // grouping: by category, answers (lowercased & trimmed) considered "valid" by majority
  const validByCat = {}; // cat -> [{playerId, answer}]
  for (const cat of room.settings.categories) {
    validByCat[cat] = [];
  }
  const playerCount = [...room.players.values()].filter((p) => p.connected).length || 1;
  const half = playerCount / 2;
  for (const item of room.voting.items) {
    // Baseline: prefer AI verdict, else letter-check (autoValid)
    const baseline = (typeof item.aiValid === "boolean") ? item.aiValid : item.autoValid;
    const upvotes = Object.values(item.votes).filter(Boolean).length;
    const downvotes = Object.values(item.votes).filter((v) => v === false).length;
    let accepted = baseline;
    if (!baseline && upvotes > half) accepted = true;     // overturn rejection by majority upvote
    if (baseline && downvotes > half) accepted = false;   // overturn acceptance by majority downvote
    if (accepted) validByCat[item.category].push({ playerId: item.playerId, answer: item.answer.trim().toLowerCase() });
  }
  const gained = {};
  for (const p of room.players.values()) gained[p.id] = 0;
  for (const cat of room.settings.categories) {
    const arr = validByCat[cat];
    // group by lowercase answer
    const groups = {};
    for (const a of arr) {
      groups[a.answer] = groups[a.answer] || [];
      groups[a.answer].push(a.playerId);
    }
    for (const ans in groups) {
      const ids = groups[ans];
      const points = ids.length > 1 ? 5 : 10;
      for (const id of ids) gained[id] += points;
    }
    // bonus mot unique: si seul à avoir trouvé dans la catégorie => +5 déjà via 10 vs 5? Non, gérons: 10 si seul à avoir une réponse valide
  }
  // Apply
  for (const p of room.players.values()) p.score += gained[p.id] || 0;
  return gained;
}

function registerGameHandlers(io) {
  io.on("connection", (socket) => {
    let joinedCode = null;
    let joinedAs = null; // persistent playerId

    socket.on("room:create", ({ playerId, name, avatar }, cb) => {
      const pid = String(playerId || socket.id);
      const room = newRoom(pid, (name || "Joueur").slice(0, 20), sanitizeAvatar(avatar));
      socket.join(room.code);
      joinedCode = room.code;
      joinedAs = pid;
      cb?.({ ok: true, code: room.code, you: pid });
      io.to(room.code).emit("room:update", publicRoom(room));
    });

    socket.on("room:join", ({ playerId, code, name, avatar }, cb) => {
      code = (code || "").toUpperCase().trim();
      const pid = String(playerId || socket.id);
      const room = rooms.get(code);
      if (!room) return cb?.({ ok: false, error: "Partie introuvable" });
      const known = room.players.has(pid);
      if (room.phase !== "lobby" && !known) {
        return cb?.({ ok: false, error: "Partie déjà commencée" });
      }
      if (!known && room.players.size >= (room.settings.maxPlayers || 12)) {
        return cb?.({ ok: false, error: "Partie pleine" });
      }
      if (!known) {
        room.players.set(pid, {
          id: pid,
          name: (name || "Joueur").slice(0, 20),
          avatar: sanitizeAvatar(avatar),
          score: 0, ready: false, connected: true, isHost: false,
        });
      } else {
        const p = room.players.get(pid);
        p.connected = true;
        if (name) p.name = name.slice(0, 20);
        if (avatar) p.avatar = sanitizeAvatar(avatar);
      }
      socket.join(code);
      joinedCode = code;
      joinedAs = pid;
      cb?.({ ok: true, code, you: pid });
      io.to(code).emit("room:update", publicRoom(room));
    });

    socket.on("room:settings", ({ settings }) => {
      const room = rooms.get(joinedCode);
      if (!room || room.hostId !== joinedAs || room.phase !== "lobby") return;
      const s = settings || {};
      if (Array.isArray(s.categories)) room.settings.categories = s.categories.slice(0, 12).map(String);
      if (typeof s.duration === "number") room.settings.duration = Math.max(15, Math.min(180, s.duration));
      if (typeof s.totalRounds === "number") room.settings.totalRounds = Math.max(1, Math.min(15, s.totalRounds));
      if (typeof s.maxPlayers === "number") {
        const cur = room.players.size;
        room.settings.maxPlayers = Math.max(Math.max(2, cur), Math.min(12, s.maxPlayers));
      }
      if (s.stopMode === "first" || s.stopMode === "timer") room.settings.stopMode = s.stopMode;
      io.to(room.code).emit("room:update", publicRoom(room));
    });

    socket.on("game:start", () => {
      const room = rooms.get(joinedCode);
      if (!room || room.hostId !== joinedAs) return;
      if (room.phase !== "lobby" && room.phase !== "finished") return;
      if (room.players.size < 1) return;
      room.round = 0;
      for (const p of room.players.values()) p.score = 0;
      room.usedLetters = [];
      startRound(io, room);
    });


    socket.on("answers:update", ({ answers }) => {
      const room = rooms.get(joinedCode);
      if (!room || room.phase !== "playing") return;
      room.answers[joinedAs] = answers || {};
    });

    socket.on("game:stop", () => {
      const room = rooms.get(joinedCode);
      if (!room || room.phase !== "playing") return;
      if (room.settings.stopMode !== "first") return;
      endRound(io, room, joinedAs);
    });

    socket.on("vote:cast", ({ index, value }) => {
      const room = rooms.get(joinedCode);
      if (!room || room.phase !== "voting") return;
      const item = room.voting.items[index];
      if (!item) return;
      if (item.playerId === joinedAs) return; // pas de vote sur soi
      item.votes[joinedAs] = !!value;
      io.to(room.code).emit("voting:update", { index, votes: item.votes });
    });

    socket.on("vote:finish", () => {
      const room = rooms.get(joinedCode);
      if (!room || room.hostId !== joinedAs || room.phase !== "voting") return;
      const gained = computeScores(room);
      const isLast = room.round >= room.settings.totalRounds;
      const result = {
        letter: room.currentLetter,
        items: room.voting.items,
        gained,
        players: [...room.players.values()].map((p) => ({ id: p.id, name: p.name, avatar: p.avatar || null, score: p.score })),
        round: room.round,
        totalRounds: room.settings.totalRounds,
        finished: isLast,
      };
      io.to(room.code).emit("round:result", result);
      if (isLast) {
        clearTimer(room);
        room.phase = "finished";
        io.to(room.code).emit("room:update", publicRoom(room));
      } else {
        // Auto-chain into the next round's countdown (which now also displays the scoreboard)
        startRound(io, room);
      }
    });

    const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "🔥", "👏", "🎉", "😱", "🤔"];
    let lastReactionAt = 0;
    socket.on("reaction:send", ({ emoji }) => {
      const room = rooms.get(joinedCode);
      if (!room) return;
      if (!ALLOWED_REACTIONS.includes(emoji)) return;
      const now = Date.now();
      if (now - lastReactionAt < 200) return; // simple per-socket rate limit
      lastReactionAt = now;
      socket.to(room.code).emit("reaction:show", { emoji, playerId: joinedAs, at: now });
    });

    socket.on("chat:send", ({ text }) => {
      const room = rooms.get(joinedCode);
      if (!room) return;
      const p = room.players.get(joinedAs);
      if (!p) return;
      const msg = { id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), playerId: p.id, name: p.name, text: String(text || "").slice(0, 200), at: Date.now() };
      room.messages.push(msg);
      io.to(room.code).emit("chat:msg", msg);
    });

    socket.on("room:leave", () => leave());

    socket.on("disconnect", () => leave(true));

    function leave(isDisconnect = false) {
      const room = rooms.get(joinedCode);
      if (!room) return;
      const p = room.players.get(joinedAs);
      if (!p) return;
      if (isDisconnect) {
        p.connected = false;
      } else {
        room.players.delete(joinedAs);
      }
      // host transfer if host leaves
      if (room.hostId === joinedAs) {
        const next = [...room.players.values()].find((pp) => pp.connected && pp.id !== joinedAs);
        if (next) {
          room.hostId = next.id;
          next.isHost = true;
        }
      }
      // delete empty rooms
      const anyConnected = [...room.players.values()].some((pp) => pp.connected);
      if (!anyConnected) {
        clearTimer(room);
        rooms.delete(room.code);
        return;
      }
      io.to(room.code).emit("room:update", publicRoom(room));
    }
  });
}

const COUNTDOWN_MS = 3000;

function startRound(io, room) {
  clearTimer(room);
  room.round += 1;
  room.phase = "countdown";
  room.answers = {};
  room.voting = null;
  room.stoppedBy = null;
  room.currentLetter = pickLetter(room);
  room.timerEnd = null;
  room.countdownEnd = Date.now() + COUNTDOWN_MS;
  io.to(room.code).emit("room:update", publicRoom(room));
  io.to(room.code).emit("round:countdown", {
    round: room.round,
    letter: room.currentLetter,
    countdownEnd: room.countdownEnd,
    categories: room.settings.categories,
  });
  room.timer = setTimeout(() => {
    room.phase = "playing";
    room.countdownEnd = null;
    room.timerEnd = Date.now() + room.settings.duration * 1000;
    room.timer = setTimeout(() => endRound(io, room, null), room.settings.duration * 1000);
    io.to(room.code).emit("room:update", publicRoom(room));
    io.to(room.code).emit("round:start", {
      round: room.round,
      letter: room.currentLetter,
      timerEnd: room.timerEnd,
      duration: room.settings.duration,
      categories: room.settings.categories,
    });
  }, COUNTDOWN_MS);
}

module.exports = { registerGameHandlers };
