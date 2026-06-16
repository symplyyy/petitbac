# Petit Bac

Petit Bac multijoueur en ligne — Next.js 14 + Socket.io + Gemini.

## Architecture rapide

- **Front + back dans le même process** : un serveur Node custom ([server.js](server.js)) qui monte Next.js (App Router) *et* un serveur Socket.io sur le même port.
- **État de jeu en mémoire** ([server/game.js](server/game.js)) — `Map<code, room>`, pas de base de données.
- **IA d'arbitrage** ([server/ai.js](server/ai.js)) — appel batché à Gemini 2.5 Flash via REST, cache mémoire `(lettre, catégorie, réponse)`.
- **Persistance côté joueur** uniquement (localStorage) : pseudo, avatar, thème.

```
Browser ──────── HTTP (Next.js pages) ────────► server.js
        ──── WebSocket (Socket.io) ────────────► server.js ──► Gemini API
```

## Lancer en local

```bash
npm install
cp .env.local.example .env.local   # ou crée le fichier manuellement
# édite .env.local et colle ta clé
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000). Pour tester le multijoueur, ouvre plusieurs onglets / fenêtres privées.

### Variables d'environnement

Une seule, dans `.env.local` (déjà gitignored via `.env*`) :

```env
GEMINI_API_KEY=ta_clé_ici
```

Obtenue sur [aistudio.google.com](https://aistudio.google.com/) → *Get API Key*. Sans clé, le jeu tourne mais l'IA renvoie `null` pour tous les verdicts → fallback automatique sur la simple vérif de lettre (`autoValid`).

## Mise en production

### Pré-requis du host

L'app **ne tourne PAS en serverless** (Vercel functions, Lambda, etc.) parce que :
- Socket.io a besoin de connexions WebSocket **persistantes** côté serveur
- L'état des parties est en mémoire — il faut un process long-lived

Il faut un host qui supporte :
- **Node.js long-running** (process qui ne s'éteint pas)
- **WebSocket** sur le port HTTP exposé
- Idéalement une **seule instance** (pas de scale horizontal — voir [Limites](#limites))

Au choix : Railway, Fly.io, Render, DigitalOcean App Platform, un VPS Hetzner/OVH, etc.

### Scripts

```json
"scripts": {
  "dev":   "node server.js",          // dev avec hot reload Next.js
  "build": "next build",              // build prod
  "start": "NODE_ENV=production node server.js"
}
```

Le serveur lit `process.env.PORT` (défaut 3000). En prod, la plupart des hosts l'injectent automatiquement.

### Déploiement Railway (le plus simple)

1. **Push ton repo sur GitHub** (vérifie que `.env.local` n'est PAS commité — `git status` doit le confirmer)
2. Sur [railway.app](https://railway.app) → *New Project* → *Deploy from GitHub repo* → choisis le repo
3. Dans l'onglet **Variables** :
   ```
   GEMINI_API_KEY=...
   NODE_ENV=production
   ```
4. Dans **Settings** :
   - **Build Command** : `npm install && npm run build`
   - **Start Command** : `npm start`
   - **Healthcheck Path** : `/` (optionnel)
5. Génère un domaine public dans *Settings → Networking → Generate Domain*
6. C'est tout — WebSockets fonctionnent out-of-the-box sur Railway.

### Déploiement Fly.io

```bash
fly launch                    # détecte le Dockerfile / Node, propose une config
fly secrets set GEMINI_API_KEY=...
fly deploy
```

Pense à exposer un seul service avec `internal_port = 3000`. WebSocket marche nativement (pas besoin de config TLS spéciale).

### Déploiement Render

1. *New Web Service* → ton repo
2. **Environment** : Node
3. **Build** : `npm install && npm run build`
4. **Start** : `npm start`
5. **Environment Variables** : `GEMINI_API_KEY=...`
6. Render gère les WebSockets sur les plans Starter+.

### Déploiement sur VPS (Docker)

Un `Dockerfile` minimal fait l'affaire :

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server.js"]
```

```bash
docker build -t petitbac .
docker run -d -p 3000:3000 -e GEMINI_API_KEY=... --restart=always petitbac
```

Devant, mets un reverse-proxy (Caddy, Nginx, Traefik) qui termine TLS. Pense au **WebSocket upgrade** dans la config Nginx :

```nginx
location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_read_timeout 86400;
}
```

## Limites à connaître

- **Une seule instance** : l'état des parties (`rooms` Map) est en mémoire. Tu **ne peux PAS** scaler horizontalement tel quel — chaque joueur d'une même partie doit hit la même instance. Si tu dois scaler : passer à Redis pour l'état + utiliser l'adapter Socket.io Redis.
- **Redémarrage = parties perdues** : un deploy / crash supprime toutes les rooms actives. Pour éviter de couper les joueurs, utilise des stratégies de zero-downtime deploy (Fly.io blue/green, Render rolling deploys, etc.).
- **Quotas Gemini** : tier gratuit 2.5 Flash ≈ 10 RPM / 250 RPD. Avec ton offre étudiante (Google AI Pro) c'est largement plus. Le batch + cache local divisent déjà la consommation par 5-10× en pratique.
- **Pas d'auth** : les codes de partie à 6 caractères sont la seule barrière. Aucun risque de modération côté contenu pour l'instant.

## Sécurité

- **Régénère ta clé Gemini** si elle a fuité (Google AI Studio → API Keys → Delete + Recreate). La clé ne doit JAMAIS être commitée — `.env*` est déjà dans `.gitignore`.
- Le serveur ne traite que les events socket attendus, valide tout en entrée (`sanitizeAvatar`, slice des chaînes, clamp des numériques).
- Le prompt Gemini est construit côté serveur uniquement — un joueur ne peut pas injecter de prompt arbitraire.

## Commandes utiles

```bash
npm run dev      # dev local
npm run build    # vérifier que la prod build passe
npm start        # lancer la build prod en local pour tester
```

## Structure

```
app/                  # Next.js App Router
  page.tsx            # landing (pseudo + avatar + create/join)
  room/[code]/        # vue room (lobby / countdown / playing / voting / finished)
  globals.css         # tokens CSS, dark mode, composants Tailwind
  layout.tsx          # script no-FOUC dark mode
components/           # UI (Avatar, AvatarPicker, ThemeToggle, Voting, etc.)
lib/
  socket.ts           # singleton Socket.io client
  types.ts            # types partagés client/serveur
  avatar.ts           # config + presets avatar
server/
  game.js             # logique de jeu, rooms, rounds, scoring
  ai.js               # client Gemini batché + cache
server.js             # Next.js + Socket.io bootstrap
```
