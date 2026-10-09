# CodePulse

Full-stack competitive programming analytics and community platform. Connect your Codeforces, LeetCode, and CodeChef handles and get one unified dashboard, a global + college-wise leaderboard, a contest tracker with Google Calendar reminders, and a small community space for interview experiences.

> Based on the original project by [vedantbirla01/codepulse](https://github.com/vedantbirla01/codepulse) (MIT). This copy adds a one-click local setup (no cloud accounts needed) and a navbar click fix.

## Quick start (macOS, fully local)

Everything runs on your own machine: local MongoDB and Redis instead of Atlas/Upstash.

1. Install the prerequisites once:
   ```bash
   brew install node mongodb/brew/mongodb-community redis
   ```
2. Double-click **`START-CodePulse.command`** (or run `zsh START-CodePulse.command`). On first run it creates the `.env` files, installs packages, starts MongoDB → Redis → backend (`:5050`) → frontend (`:5173`), seeds demo data and opens the browser.
3. Log in with `demo@codepulse.test` / `Demo@1234`.
4. Double-click **`STOP-CodePulse.command`** to shut everything down.

Database files are stored in `~/codepulse-data`. Logs are in `~/codepulse-data/logs`. The backend uses port **5050** because macOS AirPlay Receiver occupies port 5000. Google Calendar reminders need your own Google OAuth keys in `server/.env`; everything else works without them.

## Deploying to Vercel

The app is deployed as two Vercel projects:

| Project | Folder | URL |
|---|---|---|
| `codepulse-shivansh` (frontend) | `client/` | https://codepulse-shivansh.vercel.app |
| `codepulse-shivansh-api` (backend) | `server/` | https://codepulse-shivansh-api.vercel.app/api/health |

Backend env vars: `MONGO_URI` (or `MONGODB_URI` from the Vercel MongoDB Atlas integration), `JWT_SECRET`, `JWT_EXPIRES_IN`, `CLIENT_URL`, `APP_URL`, and optionally `REDIS_URL`/`KV_URL` (Upstash; without it caching is skipped). Frontend env var: `VITE_API_URL` = backend URL + `/api`. On Vercel the backend exports the Express app (see `server/server.js`), so the per-minute cache-warming cron only runs locally.

Redeploy after changes:
```bash
cd server && npx vercel deploy --prod
cd client && npx vercel deploy --prod
```

---

**Original live demo:** https://codepulse-theta-two.vercel.app (hosted by the original author)

---

## Features

- **Auth** — JWT-based registration/login with role-based authorization (`user` / `admin`)
- **Multi-platform sync** — normalizes stats from Codeforces (official API), LeetCode (GraphQL), and CodeChef (scraped) into one schema. Each platform fails independently — one source being down never breaks the others.
- **Analytics dashboard** — rating history (multi-platform), difficulty breakdown, topic breakdown, submission heatmap, all built with Recharts
- **Leaderboard** — global and college-wise rankings from a MongoDB aggregation pipeline, using a composite score (solved-problem points + rating bonus) so it stays fair even for platforms without a contest rating. Auto-refreshes every 30 seconds via polling (TanStack Query) — no WebSockets
- **Redis caching** — cache-aside pattern for per-user stats and leaderboard results, with a cron job that proactively warms the global leaderboard cache
- **Contest tracker** — live upcoming contests from Codeforces + LeetCode, with one-click Google Calendar reminders via OAuth 2.0
- **Community** — post and search interview experiences, like/unlike, author or admin can delete
- **Deployed** — frontend on Vercel, backend on Render, database on MongoDB Atlas, cache on Upstash Redis

## Tech stack

**Frontend:** React (Vite), Tailwind CSS, React Router, Zustand, TanStack Query, Axios, Recharts, lucide-react
**Backend:** Node.js, Express, MongoDB + Mongoose, Redis (ioredis), JWT, node-cron, Google APIs (OAuth), Cheerio
**Infra:** Vercel, Render, MongoDB Atlas, Upstash Redis, Google Cloud Console (OAuth)

## Architecture

```
Client (React)  →  API (Express, JWT auth, service layer)
                          │
          ┌───────────────┼───────────────────┐
          │                                    │
   MongoDB Atlas                        Redis (Upstash)
   (users, stats,                    (cache-aside: profile
    posts, contests)                  stats, leaderboard)
          │
   ┌──────┴──────┬─────────────┐
Codeforces API  LeetCode        CodeChef
(official)      GraphQL         (scraped)
                                    +
                          Google Calendar (OAuth 2.0)
```

## Known limitations

Documented on purpose, not hidden — these are real, understood trade-offs, not bugs:

- **CodeChef has no public API.** Stats and rating history are scraped from the public profile page. If CodeChef changes their page structure, sync for that platform degrades gracefully (returns a clear failure status) rather than breaking the app.
- **LeetCode has no official public API either.** The app uses their internal GraphQL endpoint (the same one their own site uses), which is more stable than scraping but still unofficial and could change without notice.
- **No WebSockets, by design.** Real-time-feeling updates (leaderboard, dashboard) use polling + server-side caching instead. This is a deliberate architectural choice, not a missing feature — see the code comments in `leaderboardService.js` for the reasoning.
- **Google Calendar integration is in "Testing" mode** in Google Cloud Console (not verified/published), which means: only explicitly-added test-user Google accounts can connect their calendar, and refresh tokens expire after 7 days per Google's policy for unverified apps.
- **Render's free tier cold-starts**, as noted above.

## Local setup

### Prerequisites
Node.js 18+, a MongoDB Atlas cluster, an Upstash Redis database, a Google Cloud project with Calendar API enabled (see `server/.env.example` for what's needed).

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in your own values
npm run dev
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # fill in your own values
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:5000`.

## API overview

All routes are prefixed `/api`. Protected routes require `Authorization: Bearer <token>`.

| Route | Method | Description |
|---|---|---|
| `/auth/register`, `/auth/login` | POST | Auth |
| `/auth/me` | GET, PATCH | Current user profile |
| `/platforms/connect` | POST | Connect/sync platform handles |
| `/platforms/me` | GET | Current user's synced stats |
| `/platforms/resync` | POST | Re-sync all connected platforms |
| `/leaderboard` | GET | Global or college-wise rankings (`?scope=`) |
| `/contests` | GET | Upcoming Codeforces + LeetCode contests |
| `/contests/google/start`, `/google/callback` | GET | Google Calendar OAuth flow |
| `/contests/add-to-calendar` | POST | Add a contest reminder to Google Calendar |
| `/community` | GET, POST | List/search posts, create a post |
| `/community/:id/like` | POST | Toggle like |
| `/community/:id` | DELETE | Delete (author or admin only) |

## License

MIT
