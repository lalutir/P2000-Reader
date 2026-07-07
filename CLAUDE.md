# P2000 Reader

Real-time Dutch emergency services (P2000) alert feed. FastAPI backend scrapes p2000-online.net and broadcasts new alerts over WebSocket; a React + Vite frontend renders them live. Design system is **Seaglass** — soft, tinted glass. Read this whole file before touching the frontend.

## Site map

<!-- Single-page app — no client-side routing. One screen, driven by app
     state rather than separate routes. Keep this current if that changes. -->

| View | Purpose | Status |
|---|---|---|
| `/` | Live alert feed: sticky header (title, connection status, scrape-interval selector, push-notification toggle, region/city filters) over a scrolling list of alert cards | Real |

## What's placeholder

<!-- List anything in the codebase that's a stand-in for real content, so
     nobody mistakes a draft for done. Delete a line once the real thing
     replaces it. -->

- `frontend/web/index.html` references `/icon.png` as the favicon and the README documents `public/icon.png` / `public/badge.png` for push notification icons, but neither file exists in `frontend/web/public/` — only `sw.js` is there. Add both before relying on notification icons or a non-broken favicon.
- No Open Graph / social preview meta tags on `index.html` (this is an internal tool, not something meant to be linked/shared, so this may be intentional — confirm before adding).

## Design system — Seaglass

Tumbled sea glass, not "frosted UI glass." Frosted, tinted, never perfectly clear, edges softened rather than sharp — glass with a history, not a filter effect. Deliberately **not**: cream-plus-serif-plus-terracotta, near-black-plus-one-acid-accent, or plain white/grey iOS-style glass.

Tokens live in `frontend/web/src/tokens.css`, copied verbatim from the Seaglass template — treat it as portable and don't edit it for this project's needs. Project-specific extensions (below) live in `frontend/web/src/App.css` instead.

Non-negotiable rules:
- Reference tokens only (`tokens.css`, plus the extensions below). Never hardcode a new hex/`rgba()`/px spacing in `App.jsx` or `App.css` without adding a named token first.
- Glass is always tinted (`--glass-tint-*`) — never plain white/grey translucent. The header and each alert card carry the `.glass-panel` utility class from `tokens.css` for this; `App.css` only adds layout (padding, position, radius overrides) on top, never a competing `background`/`backdrop-filter`.
- `--cobalt-rare` appears **once per screen, max**, for decorative/accent use. In this app that budget is spent on the notification-permission button (`.notif-btn`) hover state, mirroring the template's own `:focus-visible` outline (also cobalt-rare) — the focus ring itself doesn't count against the budget since only one element can be focused/hovered at a time and it's a consistent interaction-state signal, not a decorative flourish.
- **Functional color exception:** this app needs two small sets of categorical colors that are visible on screen *simultaneously*, so they're a deliberate, separate extension of the palette rather than a spend of the cobalt-rare budget — defined as named tokens in `App.css`:
  - `--service-brandweer` / `--service-ambulance` / `--service-politie` / `--service-default` — the `border-left` on each alert card, keyed off `SERVICE_COLORS` in `App.jsx`. Brandweer reuses `--amber-glass` as-is; Politie is a muted, desaturated blue kept visually distinct from `--cobalt-rare` so it doesn't compete with the one rare accent; Ambulance needed a hue Seaglass doesn't have (`#C77C6E`, a muted coral/rose) since no existing token fit.
  - `--status-connected` (`--kelp`) / `--status-disconnected` (`#B54B3F`, a muted brick red) — the WebSocket connection dot/label, which needs to read instantly regardless of the glass tint behind it.
- This is a dense data app, not a marketing page — Seaglass only defines two spacing tokens (`--space-unit`, `--space-section`), both sized for page-level rhythm. Small chrome values (4px/6px/8px paddings, gaps) in `App.css` are kept as plain px rather than forced into `--space-unit` multiples that don't fit; this is a deliberate, documented exception to the "never hardcode px spacing" rule, same spirit as the functional-color one above.
- Respect `prefers-reduced-motion` *and* `prefers-reduced-transparency` — both are already handled in `tokens.css` for any element carrying `.glass-panel`.
- Display type (Fraunces) is forced to its low-`opsz` cut (`font-variation-settings: 'opsz' 12`) even at large sizes. Used on the `<h1>` in the header; keep it that way on any new heading.
- Fonts (Fraunces, Hanken Grotesk) are loaded via Google Fonts `<link>` tags in `frontend/web/index.html` — this project has no local font files.

Anti-patterns: numbered 01/02/03 markers unless content is a genuine sequence; more than one hero-style gradient per screen; cards covering every inch of the `--sand` background.

## Infrastructure

- **Backend:** FastAPI (`backend/main.py`), runs under systemd as `p2000.service` on port 8000 (internal only). Scrapes `p2000-online.net` every `SCRAPE_INTERVAL_SECONDS` (default 30s, configurable live via the header dropdown or permanently via the systemd unit's `Environment=`). Keeps the last 50 alerts in memory — no database.
- **Frontend:** React + Vite, built to `frontend/web/dist/` and served as static files. No SSR, no server-rendered routes.
- **Reverse proxy:** Caddy (`caddy/p2000.caddy`) serves `p2000.lalutir.com`. `/api/*` is reverse-proxied to `localhost:8000`; everything else is `file_server` against the built frontend with SPA fallback (`try_files {path} /index.html`). The two are wrapped in separate `handle` blocks — a bare `file_server` outside a `handle` block would intercept `/api/*` too. See `[[project_deployment]]` memory for the Cloudflare Origin Cert / DNS pitfalls hit on the sibling `lalutir.com` deployment; this subdomain's Caddyfile is simpler (no explicit `tls` block shown) but the `handle`-block pattern is the same lesson.
- **Deploy:** `scripts/deploy.sh` (run from your laptop) pushes to GitHub, then SSHes into the Droplet and runs `scripts/remote-deploy.sh`, which pulls, reinstalls Python deps, rebuilds the frontend (`npm install && npm run build`), reloads Caddy, and restarts the systemd service. A CSS-only change still needs the full script — it rebuilds the Vite bundle. Target defaults to `lalutir@142.93.232.87`, overridable via `DROPLET_USER`/`DROPLET_HOST`/`REMOTE_PATH`/`SSH_KEY` env vars.
- **Push notifications:** Web Push via VAPID. Keys are generated at runtime and gitignored (`backend/vapid_private.pem`, `backend/vapid_public.pem`) — never commit them.
- **Local dev:** two terminals — `uvicorn main:app --reload --port 8000` in `backend/` (after `pip install -r requirements.txt` in a venv), and `npm run dev` in `frontend/web/`. Vite's dev server proxies `/api/*` (including the WebSocket) to `localhost:8000`, so both halves talk to each other without extra config. See `frontend/web/vite.config.js` for the proxy rule.

## Before deploying a frontend change

1. `npm run dev` locally and actually look at it — this is a live WebSocket app. Check both the connected and disconnected states, and a few different alert types (Brandweer/Ambulance/Politie), not just one static screenshot.
2. Run the full `scripts/deploy.sh`, even for CSS-only changes — it rebuilds the Vite bundle as part of the remote deploy.
