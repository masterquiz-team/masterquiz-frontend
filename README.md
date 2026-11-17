<div align="center">

# MasterQuiz — frontend

Web client for MasterQuiz: pick a category and difficulty, answer timed
questions, earn achievements and climb the leaderboard.

[![CI](https://github.com/masterquiz-team/masterquiz-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/masterquiz-team/masterquiz-frontend/actions/workflows/ci.yml)
![Next.js](https://img.shields.io/badge/Next.js-16.3.8-000000?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-5FA04E?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-11.28.4-F69220?logo=pnpm&logoColor=white)

</div>

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Scripts](#scripts)
- [End-to-end tests](#end-to-end-tests)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Branches and deployment](#branches-and-deployment)

## Features

- Quiz game by category and difficulty, with a timer and answer feedback
- Sign up / log in, or play as a guest — guest progress is kept on registration
- Results page, profile with avatar and nickname, achievements, leaderboard

## Tech stack

| Area      | Tools                                                     |
| --------- | --------------------------------------------------------- |
| Framework | Next.js 16 App Router, React 19, TypeScript               |
| Styling   | SCSS Modules, shared tokens in [`src/styles`](src/styles) |
| Animation | [Motion](https://motion.dev)                              |
| Quality   | ESLint, Prettier, Vitest, GitHub Actions                  |
| Backend   | Separate Java (Spring Boot) API, reached through a BFF    |

## Getting started

Requirements: **Node.js 24** (`>=24 <25`) and **pnpm 11.28.4**
(`corepack enable` picks the pinned version).

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local   # optional, defaults work locally
pnpm dev
```

Open <http://localhost:3000>. Run the Java backend separately; development
defaults to <http://localhost:8080>.

> [!NOTE]
> If you run the dev server on another port, update or remove `APP_ORIGIN` in
> `.env.local`, otherwise mutation requests fail the Origin check with 403.

## Scripts

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Start the Next.js development server.                |
| `pnpm build`        | Create the production build.                         |
| `pnpm start`        | Serve a production build.                            |
| `pnpm lint`         | Run ESLint.                                          |
| `pnpm typecheck`    | Generate Next.js route types and run `tsc --noEmit`. |
| `pnpm test`         | Run Vitest once using `scripts/vitest.config.mts`.   |
| `pnpm e2e`          | Run the Playwright e2e suite (see below).            |
| `pnpm e2e:ui`       | Open the Playwright UI mode.                         |
| `pnpm format`       | Rewrite formatting with Prettier.                    |
| `pnpm format:check` | Check formatting with Prettier.                      |
| `pnpm format:lint`  | Rewrite formatting, then run ESLint.                 |

CI ([ci.yml](.github/workflows/ci.yml)) runs `format:check`, `lint`,
`typecheck`, `test` and `build` on every push and pull request, and a
separate job runs the e2e suite.

## End-to-end tests

The Playwright tests live in [`e2e/tests`](e2e/tests). Before the run,
[playwright.config.ts](playwright.config.ts) starts a mock backend
([`e2e/mock-backend`](e2e/mock-backend)) and a production build of the app
(`pnpm build && pnpm start`), so no real backend or `pnpm dev` is needed. The
first run takes a few minutes because of the build.

```bash
pnpm exec playwright install chromium   # once, downloads the browser
pnpm e2e                                # the whole suite
pnpm e2e e2e/tests/game-exit-guard.spec.ts   # one file
pnpm e2e -g "Back"                      # tests whose title matches
```

| Flag                | What it does                                                |
| ------------------- | ----------------------------------------------------------- |
| `-g "<text>"`       | Runs only tests whose title matches the text.               |
| `--headed`          | Shows the browser window while the tests run.               |
| `--ui`              | Interactive mode with a step timeline (same as `e2e:ui`).   |
| `--debug`           | Opens the Playwright Inspector to step through a test.      |
| `--repeat-each=3`   | Runs every test three times to catch flaky ones.            |
| `--max-failures=1`  | Stops after the first failure.                              |
| `--project=desktop` | Runs one project: `desktop`, or `mobile` (`@mobile` tests). |

The default ports are 18080 (mock backend) and 13100 (app). If they are busy,
for example while another run is going on, pick others:

```bash
E2E_BACKEND_PORT=18326 E2E_APP_PORT=13326 pnpm e2e
```

After a run, `pnpm exec playwright show-report` opens the HTML report from
`playwright-report/`. Failed tests keep a screenshot and a trace there; the
trace replays every step with the DOM, network and console. In CI the same
report is uploaded as the `playwright-results` artifact.

## Environment variables

All variables are server-side; none uses the `NEXT_PUBLIC_` prefix.

| Variable          | Required                         | Purpose                                                                                                                                                                                     |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BACKEND_API_URL` | In production                    | Java API base URL. Defaults to `http://localhost:8080` outside production. See [transport.ts](src/lib/backend/transport.ts).                                                                |
| `APP_ORIGIN`      | Only behind a proxy              | Public frontend origin for the mutation Origin check. Defaults to the request URL's origin; set it when the proxy passes an internal request URL. See [request.ts](src/lib/api/request.ts). |
| `NODE_ENV`        | Managed by Next.js / test runner | Production requires `BACKEND_API_URL` and sets Secure cookies. Development enables the leaderboard `?demo=1` fixture.                                                                       |

## Project structure

```text
src/
├── app/          # routes: (site), (auth), (game) groups and BFF handlers in api/
├── features/     # achievements, auth, categories, game, home, leaderboard, profile
│   └── */server  #   server-only services that talk to the Java API
├── components/   # shared layout and UI components
├── lib/          # API helpers, backend transport, formatting, validation
└── styles/       # SCSS tokens, breakpoints and patterns
```

## Architecture

```text
Browser ──► Next.js BFF (src/app/api) ──► features/*/server ──► Java transport ──► Java API
Server Components ───────────────────────────┘
```

- **BFF.** The browser only talks to Next.js route handlers. Server Components
  call feature services directly. [`backendRequest`](src/lib/api/server.ts)
  reads the session token and passes it to the server-only
  [transport](src/lib/backend/transport.ts), which adds Bearer auth, disables
  caching and applies a 10-second timeout.
- **Auth.** [Login/register](src/features/auth/server/auth.ts) exchange payloads
  with Java without forwarding an existing token. [Guest play](src/features/auth/server/guest.ts)
  goes through `POST /api/auth/guest` → Java `POST /guest`; existing sessions
  are reused.
- **Sessions.** The JWT lives in the `masterquiz_session` cookie; guests also
  get `masterquiz_guest` and `masterquiz_guest_id`
  ([names](src/lib/backend/token.ts), [flags](src/features/auth/server/session.ts)).
  All are HttpOnly, SameSite=Lax, Path=/, expire with the JWT `exp` and are
  Secure in production; logout clears all three. The browser only receives
  session metadata, never the JWT.
  [Session verification](src/lib/backend/session.ts) asks Java to validate the
  token instead of trusting decoded claims.

## Branches and deployment

| Branch      | Role                                              |
| ----------- | ------------------------------------------------- |
| `main`      | Production, deployed on Vercel                    |
| `develop`   | Integration branch; feature branches merge here   |
| `feature/*` | Work branches, merged into `develop` through a PR |

On Vercel, set `BACKEND_API_URL` for Production. Leave `APP_ORIGIN` unset:
Vercel passes the public host in the request URL, and a fixed value would
reject requests from preview URLs.
