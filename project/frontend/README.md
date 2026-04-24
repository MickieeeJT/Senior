# Simuvest Frontend

Frontend for the Simuvest investment game, built with React and Vite.

## Requirements

- Node.js 18+
- npm

## Environment Setup

1. Copy the example file:
	- `cp .env.example .env`
	- On Windows PowerShell: `Copy-Item .env.example .env`
2. Set values in `.env`.

Current variables:

- `VITE_API_BASE_URL`: Backend API origin. Default local value is `http://localhost:8000`.

Important security note:

- Never commit `.env` files.
- This project already ignores `.env`, `.env.local`, and `.env.*.local` in `.gitignore`.
- Only commit `.env.example`.

## Install And Run

1. Install dependencies:
	- `npm install`
2. Start dev server:
	- `npm run dev`
3. Build for production:
	- `npm run build`
4. Preview production build:
	- `npm run preview`

## Lint

- Run: `npm run lint`
- Current status: no lint errors, only React hook dependency warnings in a few files.

## API Configuration

All frontend endpoints are centralized in `src/config/api.js`.

- Change backend base URL only through `VITE_API_BASE_URL` in `.env`.
- Avoid hardcoding URLs in page components.
