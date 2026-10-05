# ServiGo

ServiGo is a beginner-friendly full-stack local services marketplace for finding providers, requesting services, managing bookings, and leaving reviews.

## Current Stack

- React 19 + Vite
- Bootstrap 5 + Bootstrap Icons
- React Router
- Node.js + Express
- Prisma ORM with SQLite for local development
- JWT authentication and bcryptjs password hashing
- Leaflet/OpenStreetMap nearby-provider map

> The existing implementation uses Prisma and SQLite (`server/prisma/schema.prisma` and `server/.env`). MongoDB/Mongoose migration is a separate storage-layer task; this README describes the code that is currently runnable.

## Features

- Search providers by service, provider name, category, or city
- Browse service categories and provider detail pages
- Customer and provider registration/login
- JWT-protected bookings and booking status updates
- Provider verification toggle for administrators
- Reviews and ratings
- Seeded demo data for a college presentation
- Responsive Bootstrap UI with loading/error states in the main flows

## Project Structure

```text
client/                 React + Vite frontend
  src/components/       Booking and review modals
  src/context/          Authentication context
  src/pages/             Home, login, registration, bookings, providers, admin
server/                 Express API
  prisma/schema.prisma  Database schema
  prisma/seed.js        Demo data
  src/controllers/      API handlers
  src/routes/           API routes
package.json            Root development commands
```

## Installation

From `C:\Local_Service_Finder`:

```bash
npm install
npm --prefix client install
npm --prefix server install
```

The server already has a local `.env`. For a fresh setup, create `server/.env` using:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-long-random-secret"
```

## Database Setup

The current local database is SQLite, so MongoDB Compass is not required to run this version.

```bash
npm --prefix server exec prisma generate
npm --prefix server exec prisma migrate dev --name init
npm run seed
```

## Running the Application

Run both applications from the root:

```bash
npm run dev
```

Or use two terminals:

```bash
npm run dev:server
npm run dev:client
```

Frontend: `http://localhost:5173`

Backend health check: `http://localhost:5000/api/health`

## Demo Accounts

Run `npm run seed` first. All demo accounts use the credentials below.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `rahul.sharma@example.com` | `password123` |
| Provider | `amit.plumber@example.com` | `password123` |
| Admin | `admin@localservice.com` | `admin123` |

## Main API Routes

All API routes use the `/api` prefix.

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /categories`
- `GET /providers?search=plumb&category=Plumbing&city=Mumbai`
- `GET /providers/:id`
- `PATCH /providers/:id/verify` (admin)
- `POST /bookings` (authenticated)
- `GET /bookings/my` (authenticated)
- `PATCH /bookings/:id/status` (authenticated)
- `POST /reviews` (authenticated)

For protected requests, send:

```text
Authorization: Bearer <jwt-token>
```

## Postman Smoke Test

1. `POST /api/auth/login` with a demo account and copy `token`.
2. Add the bearer token to an authenticated request.
3. `GET /api/providers` to select a provider and service.
4. `POST /api/bookings` with the selected service, date, address, and notes.
5. Log in as the provider and update the booking status.
6. After completion, `POST /api/reviews` with a rating from 1 to 5.

## Useful Commands

```bash
npm run dev              # Run frontend & backend concurrently
npm run build            # Build the frontend
npm run start            # Start only the API
npm run seed             # Reset and load demo data
npm run share            # Launch interactive project sharing helper
npm run share:cloudflare # Share via Cloudflare Quick Tunnel
```

## 🌐 Sharing Your Project Remotely (Cloudflare Quick Tunnels)

Want to share your locally running ServiGo app with a friend, professor, or client anywhere in the world without deploying to AWS or Vercel? You can use **Cloudflare Quick Tunnels (`cloudflared`)**:

### Steps:
1. **Install `cloudflared`** on your computer:
   - **Windows**: `winget install --id Cloudflare.cloudflared` (or download from Cloudflare)
   - **macOS**: `brew install cloudflared`
   - **Linux**: `sudo apt install cloudflared`
2. **Start ServiGo normally**:
   ```bash
   npm run dev
   ```
   Check that it is running on `http://localhost:5173`.
3. **Open a second terminal** and run:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   # Or using the npm script:
   npm run share:cloudflare
   ```
4. **Wait for the public link**: Cloudflare will print an HTTPS link ending in `.trycloudflare.com` (e.g., `https://random-words.trycloudflare.com`).
5. **Copy and share that link** instead of `localhost`. Anyone in the world can test the live application directly from your laptop!
6. **Keep both terminals open**: While people need access, leave both `npm run dev` and `cloudflared` running. Closing the terminal kills the tunnel.

> [!NOTE]
> - **Free & No Account Needed**: Quick Tunnels require no registration, no port-forwarding, and no credit card.
> - **Public Access**: Anyone with the link can view the project; do not expose private credentials.
> - **Temporary Link**: The URL changes each time you restart the tunnel — it's designed for demos and rapid review.