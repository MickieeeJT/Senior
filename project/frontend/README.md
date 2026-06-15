# Simuvest Frontend

Frontend for the Simuvest investment game, built with React and Vite.

## What You Need

- Node.js 18 or newer
- npm
- The backend running locally on `http://localhost:8000`

## First-Time Setup

1. Open a terminal in [frontend](frontend).
2. Install dependencies:

```powershell
npm install
```

3. Copy the example env file to `.env`.

```powershell
Copy-Item .env.example .env
```

4. Confirm `VITE_API_BASE_URL` points to your backend.

For local development it should be:

```env
VITE_API_BASE_URL=http://localhost:8000
```

## Run The Frontend

In a terminal inside [frontend](frontend):

```powershell
npm run dev
```

Then open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Other Commands

- Build production assets:

```powershell
npm run build
```

- Preview the production build:

```powershell
npm run preview
```

- Run lint checks:

```powershell
npm run lint
```

## API Configuration

All API URLs are centralized in [frontend/src/config/api.js](frontend/src/config/api.js).

- Change the backend base URL only through `VITE_API_BASE_URL`.
- Do not hardcode backend URLs directly in components.

## Common Problems

- If the page loads but login or data requests fail, make sure the backend is running.
- If requests go to the wrong server, check `VITE_API_BASE_URL` in `.env`.
- If styles or assets look broken, restart the Vite dev server after changing env files.
