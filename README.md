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
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins.
- `OAUTH_CALLBACK_BASE_URL`: Base URL for OAuth callbacks (e.g., https://wantok.dspng.tech).
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth credentials.
- `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET`: Microsoft OAuth credentials.
- `OIDC_ISSUER` / `OIDC_CLIENT_ID` / `OIDC_CLIENT_SECRET`: Generic OIDC credentials.

### Administrative Settings (Database-driven)
The platform uses the `system_settings` database table to manage dynamic administrative configurations:
- `global_fee_percent`: Dynamic percentage-based platform fee (default: `10` for 10%). Deducted cleanly in two-decimal precision during worker payment releases/payouts.

### Coolify / Vultr Deployment Details
- **Internal Network**: Coolify's container network handles internal traffic. SSL is terminated at the Traefik proxy level.
- **Environment Configuration**: All production keys must be set in the Coolify environment dashboard. See `.env.example` for the complete list of required keys.
- **OAuth Callbacks**: External provider portals must be configured with redirect URIs matching: `${OAUTH_CALLBACK_BASE_URL}/api/auth/<provider>/callback`.
- **Custom Schemes**: Native mobile OAuth requires the `wantok://` scheme. This requires EAS builds or custom development clients, as Expo Go has limited support for custom redirect schemes.
- **PWA Support**: Manifest and service worker assets are served from the root. PWA installation is supported in standalone mode.

## Local Development
1. Install dependencies: `npm install`
2. Build frontend: `npm run build`
3. Start server: `npm start`
