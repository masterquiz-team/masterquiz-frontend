# masterquiz-frontend

Frontend application for MasterQuiz — a team quiz platform

## Local development

Use Node.js 24 and pnpm. Install dependencies with `pnpm install`, then start
the frontend with `pnpm dev`. Open `http://localhost:3000`.

The home page targets the 1440 px desktop sketch and uses temporary local category data. Category
selection and the leaderboard are not connected to a quiz API yet.

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
Login submits `email` and `password`. The forms show the HTTP status and a
success or error message. Login currently verifies that the API returns a
token; it does not save a session or enable authenticated pages.

The decorative shape uses the supplied Figma export in `public/Vector.svg`.
Category and benefit illustrations currently have empty reserved spaces.
