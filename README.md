# MasterQuiz frontend

Quiz frontend built with Next.js 16.3.8 App Router, React 19.2.8, TypeScript,
and SCSS Modules. [package.json](package.json) requires Node.js `>=24 <25`
and pins pnpm 11.28.4. Tests use Vitest (`^5.0.5`).

## Local development

Run `pnpm install --frozen-lockfile`, copy [.env.example](.env.example) to
`.env.local` if needed, then run `pnpm dev` and open <http://localhost:3000>.
Run the Java backend separately; development defaults to <http://localhost:8080>.
If you run the dev server on another port, update or remove `APP_ORIGIN` in
`.env.local`, otherwise mutation requests fail the Origin check with 403.

## Commands

All commands below are scripts in [package.json](package.json).

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `pnpm dev`          | Start the Next.js development server.                |
| `pnpm build`        | Create the production build.                         |
| `pnpm start`        | Serve a production build.                            |
| `pnpm lint`         | Run ESLint.                                          |
| `pnpm typecheck`    | Generate Next.js route types and run `tsc --noEmit`. |
| `pnpm test`         | Run Vitest once using `scripts/vitest.config.mts`.   |
| `pnpm format`       | Rewrite formatting with Prettier.                    |
| `pnpm format:check` | Check formatting with Prettier.                      |
| `pnpm format:lint`  | Rewrite formatting, then run ESLint.                 |

## Environment

These are all environment variables read by application code; none uses a
`NEXT_PUBLIC_` prefix. Keep local configuration in the project root.
CI ([ci.yml](.github/workflows/ci.yml)) sets `BACKEND_API_URL` so the production
build can run.

| Variable          | Required?                                    | Purpose                                                                                                                                                                                                                                    |
| ----------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BACKEND_API_URL` | In production; optional otherwise            | Server-side Java API base URL. Defaults to `http://localhost:8080` outside production. See [transport.ts](src/lib/backend/transport.ts).                                                                                                   |
| `APP_ORIGIN`      | Optional in code; set behind a reverse proxy | Public frontend origin for mutation Origin checks. Defaults to the request URL's origin; set to the public site URL when the proxy supplies an internal request URL. See [request.ts](src/lib/api/request.ts).                             |
| `NODE_ENV`        | Managed by Next.js / the test runner         | Production requires the backend URL and sets Secure cookies. Development enables the leaderboard's `?demo=1` fixture. See [session.ts](src/features/auth/server/session.ts) and [leaderboard page](<src/app/(site)/leaderboard/page.tsx>). |

## Backend and sessions

Browser requests go to [Next.js BFF route handlers](src/app/api), then to
feature-owned services in `src/features/*/server`, then through the server-only
[Java transport](src/lib/backend/transport.ts). Server Components also call
server services directly. [backendRequest](src/lib/api/server.ts) reads the
session token and passes it explicitly to the transport, which adds Bearer
authorization, disables caching, and defaults to a 10-second timeout.

[Authentication](src/features/auth/server/auth.ts) exchanges login/register
payloads with Java without forwarding an existing bearer token.
[Guest play](src/features/auth/server/guest.ts) creates a Java guest: the browser
calls the BFF `POST /api/auth/guest`, which calls Java `POST /guest`; existing
user/guest sessions are reused.
JWTs stay in the `masterquiz_session` cookie, with HttpOnly, SameSite=Lax,
Path=/, expiry from JWT `exp`, and Secure in production. Guest sessions also
use `masterquiz_guest` and `masterquiz_guest_id` cookies with the same flags;
logout clears all three. See [cookie handling](src/features/auth/server/session.ts).
The browser receives session metadata rather than the JWT.
[Session verification](src/lib/backend/session.ts) asks Java to validate the
token; decoding JWT claims alone does not verify its signature.
