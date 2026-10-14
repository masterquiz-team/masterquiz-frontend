# masterquiz-frontend

Frontend application for MasterQuiz — a team quiz platform

## Local development

Use Node.js 24 and pnpm. Install dependencies with `pnpm install`, then start
the frontend with `pnpm dev`. Open `http://localhost:3000`.

## Scripts

- `pnpm format:check` checks formatting; `pnpm format` rewrites it.
- `pnpm lint` checks ESLint rules.
- `pnpm typecheck` generates Next.js route types, then checks TypeScript.
- `pnpm test` runs Vitest unit tests once with mocked backend requests.
- `pnpm build` creates the production build; `pnpm start` serves it.

Set `BACKEND_API_URL` explicitly for production. CI uses a placeholder URL and
does not need a running Java backend. The tests cover request boundaries,
session expiry, redirects, contract allowlists, and upstream error handling.

The home page targets the 1440 px desktop sketch and uses a static category preview.
The `/categories` page reads protected backend categories after login and preserves
selection in the URL. Quiz setup and the leaderboard await their backend contracts.

## Styles

Components use SCSS Modules compiled with Sass. Keep styles next to the component in a
`ComponentName.module.scss` file, import them as `styles`, and use
`className={styles.className}` in JSX. Shared colors and the browser reset live
in `src/app/globals.scss`. Tailwind utilities and `@apply` are not used.

## Checking the authentication API

Start the backend separately using its Docker setup, then open `/register` or
`/login` in the frontend. The forms send requests to `/api/auth/register` and
`/api/auth/login`. These Next.js routes forward requests to the backend's
`POST /register` and `POST /login`, so browser CORS configuration is not needed
for these forms.

The backend URL defaults to `http://localhost:8080`. To change it, copy
`.env.example` to `.env.local`, set `BACKEND_API_URL`, and restart the dev server.
This URL is used on the Next.js server and is not a `NEXT_PUBLIC_` variable.

Registration submits `email`, `nickname`, `password`, and `repeatPassword`.
Login submits `email` and `password`. The forms validate fields and show pending,
success, and error states. Registration redirects to login. Login stores the JWT
in an HttpOnly cookie; browser JavaScript receives only the session email and
expiry. The session is verified through the backend after navigation or reload,
and logout clears the cookie. The categories page uses the same server-side auth support.

The decorative shape uses the supplied Figma export in `public/Vector.svg`.
Category and benefit illustrations currently have empty reserved spaces.

## Categories workflow

The categories implementation and its Next.js data flows, verified backend
limitations, and missing SVG exports are documented in
[docs/categories-flow.md](docs/categories-flow.md). Shared authentication is
documented in [docs/auth-flow.md](docs/auth-flow.md).
