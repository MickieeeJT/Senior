# Simuvest Backend

Backend API for authentication, tutorial progress, scoring, and investment simulation.

## What You Need

- Node.js 18 or newer
- npm
- XAMPP with MySQL running locally

## First-Time Setup

1. Open a terminal in [backend](backend).
2. Install dependencies:

```powershell
npm install
```

3. Copy the example env file to `.env`.

```powershell
Copy-Item .env.example .env
```

4. Set your values in `.env`.

The important values are:

- `PORT`: backend port, usually `8000`
- `FRONTEND_ORIGIN`: frontend URL, usually `http://localhost:5173`
- `JWT_SECRET`: any long random secret string
- `DB_HOST`: usually `localhost`
- `DB_PORT`: usually `3306`
- `DB_USER`: usually `root`
- `DB_PASSWORD`: your local MySQL password
- `DB_NAME`: your database name, usually `InvestGame`

## Database Setup

This project uses MySQL, so XAMPP is the right local database server.

1. Start Apache and MySQL in XAMPP.
2. Open phpMyAdmin.
3. Create the database named in `DB_NAME` (default: `InvestGame`).
4. Import the SQL file from this project:
   - Click the **Import** tab in phpMyAdmin.
   - Select [sql/investgame.sql](sql/investgame.sql) from the backend folder.
   - Click **Import**.

The database will be populated with all required tables and initial data.

## Run The Backend

In a terminal inside [backend](backend):

```powershell
npm run dev
```

This starts the API in development mode with nodemon.

If you want the normal Node start command instead:

```powershell
npm start
```

## Useful Endpoints

- `GET /` checks whether the server is running
- `POST /auth/signup` creates a user
- `POST /auth/login` logs a user in
- `GET /api/score-history` fetches saved scores
- `GET /api/user-achievements` fetches unlocked achievements
- `GET /api/tutorial` and related tutorial routes manage progress

## Troubleshooting

- If the backend cannot connect to MySQL, confirm XAMPP MySQL is running and the credentials in `.env` are correct.
- If login fails, make sure `JWT_SECRET` is set.
- If the frontend cannot reach the backend, check `FRONTEND_ORIGIN` and the frontend API base URL.
