# Simuvest Backend

Backend API for authentication, tutorial progress, scoring, and investment simulation.

## Requirements

- Node.js 18+
- npm
- MySQL

## Environment Setup

1. Copy the example file:
   - `cp .env.example .env`
   - On Windows PowerShell: `Copy-Item .env.example .env`
2. Set all required values in `.env`.

Environment variables:

- `PORT`: API server port. Default `8000`.
- `FRONTEND_ORIGIN`: Allowed frontend origin for CORS. Default `http://localhost:5173`.
- `JWT_SECRET`: Required. Use a long random value.
- `DB_HOST`: MySQL host. Default `localhost`.
- `DB_USER`: MySQL user. Default `root`.
- `DB_PASSWORD`: MySQL password.
- `DB_NAME`: MySQL database name. Default `InvestGame`.

Important security note:

- Never commit `.env` files.
- This project already ignores `.env`, `.env.local`, and `.env.*.local` in `.gitignore`.
- Only commit `.env.example`.

## Install And Run

1. Install dependencies:
   - `npm install`
2. Start in development mode:
   - `npm run dev`
3. Start normally:
   - `npm start`

## Startup Behavior

- The server loads environment variables from `.env` through `config/env.js`.
- The server will throw at startup if `JWT_SECRET` is missing.
