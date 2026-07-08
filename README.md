# Wantok Workforce Platform

## Infrastructure & Deployment
- **Host:** Vultr VPS Instance (Ubuntu)
- **Orchestrator:** Coolify
- **Engine:** Docker / Nixpacks containerization
- **Primary Domain:** [wantok.dspng.tech](https://wantok.dspng.tech)

## Project Structure
- `/`: Root directory containing React Native / Expo frontend.
- `/backend`: Node.js Express server.
- `/dist`: Built frontend assets (served by the backend in production).

## Environment Setup
Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string.
- `JWT_SECRET`: Secret for authentication.
- `NODE_ENV`: Set to `production` for live deployments.
- `PORT`: Internal port (default 3000).

## Local Development
1. Install dependencies: `npm install`
2. Build frontend: `npm run build`
3. Start server: `npm start`
