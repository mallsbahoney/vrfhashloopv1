# Poof V3 Template

React 19 + Vite 6 + TypeScript frontend (src/), Hono backend on Cloudflare Workers (partyserver/).
API status codes: 200, 400, 401, 404, 500 only.

## Quick Reference

- **Theme**: Edit `src/theme.ts` (colors, font, radius).
- **Routes**: Register in `partyserver/src/routes/index.ts` + add to `routeSpec[]`.
- **Packages**: Use MCP tools (`add_package`, `remove_package`), not package.json or bash.
- **Build**: `bun run build:full`
- **Toasts**: Sonner — `toast.success()`, `toast.error()`
- **Icons**: Lucide React
- **Validation**: Zod — use `safeParse()` and access `result.error.issues` (NOT `.errors`)
- **Imports**: Always use `@/` paths
- **Page shell**: Wrap pages in `PageLayout` from `@/components/poof-ui` (handles nav, wallet, footer, container)

## File Structure

```
src/
├── components/
│   ├── HomePage.tsx            # Main landing page
│   ├── effects/                # Visual effects (AuroraBackground, Particles, etc.)
│   ├── poof-ui/                # Layout components (PageLayout, HeroSection, etc.)
│   └── ui/                     # shadcn/ui primitives
├── hooks/                      # Custom hooks (useRealtimeData, useDflowMarkets, etc.)
├── lib/
│   ├── config.ts               # PARTYSERVER_URL, env helpers
│   ├── constants.ts            # App constants
│   └── themes.ts               # Theme utilities
├── theme.ts                    # Theme config (colors, font, radius)
├── App.tsx                     # Router + route definitions
├── main.tsx                    # Entry point
├── styles/base.css             # Base styles
└── poof-styling.css            # Platform styles (never edit)
partyserver/
├── scripts/
│   └── generate-api-spec.ts    # Generates generated/api-spec.json from routeSpec
├── generated/                  # Build output (api-spec.json) — git-ignored
└── src/
    ├── index.ts                # Hono app setup, middleware stack
    ├── constants.ts            # App constants (e.g. PROJECT_VAULT_ADDRESS)
    ├── routes/
    │   ├── index.ts            # Route registration + routeSpec[] (add routes here)
    │   ├── oauth-callback.ts   # OAuth callback handler (disabled by default)
    │   └── social-links.ts     # Social link CRUD (disabled by default)
    └── lib/
        ├── poof-auth.ts        # validatePoofAuth(c) / validatePoofAuth(c, true)
        ├── cors-helpers.ts     # CORS (auto-configured, no per-route setup)
        ├── api-response.ts     # sendSuccess, ApiErrors, requestIdMiddleware
        ├── config.ts           # Tarobase/Cognito config
        ├── request-logger.ts   # Request logging
        ├── poof-oauth.ts       # OAuth JWT verification
        └── x402-middleware.ts   # Payment enforcement (faremeter)
```

## Frontend

### Styling & Theming

Edit `src/theme.ts` to change the look:

```typescript
export const themeConfig = {
  colors: {
    primary: '#6366f1',     // Main accent
    background: '#0a0a0a',  // Page background
    card: '#141414',        // Card/surface background
    text: '#ffffff',        // Primary text
    muted: '#a1a1aa',       // Secondary text
    border: '#27272a',      // Borders
    accent: '#818cf8',      // Secondary accent
  },
  font: {
    family: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },
  radius: '0.75rem',
};
```

### Component Catalog

Use shadcn/ui primitives from `@/components/ui/*` — they auto-apply the theme. Available: Button, Card, Input, Dialog, Select, Tabs, Table, Badge, Avatar, Tooltip, Sheet, Separator, ScrollArea, etc.

**Effects** from `@/components/effects/*`: AuroraBackground, Particles, MagicCard, ShootingStars, TypewriterEffect, SparklesText, GradientText, AnimatedGridPattern, Meteors, etc.

**Poof UI** from `@/components/poof-ui/*`: PageLayout, HeroSection, FeatureCard, MetricGrid.

When a component doesn't exist in the catalog, create it in its own file under `src/components/`.

### Routing

```typescript
// src/App.tsx
<Route path="/" element={<HomePage />} />
<Route path="/dashboard" element={<Dashboard />} />
```

Navigate: `import { useNavigate } from 'react-router-dom'`

---

## Backend

Hono-based API server running on Cloudflare Workers.

### How It Works

The backend is a Hono app exported as a Cloudflare Worker. `index.ts` sets up middleware (CORS, auth, logging, x402) and delegates to `routes/index.ts`.

### Adding Routes

All routes are registered in `partyserver/src/routes/index.ts`. Two steps:

1. Register the Hono handler
2. Add an entry to the `routeSpec[]` array (for API spec generation — the platform displays available routes from this)

```typescript
// In routeSpec array:
{ method: 'GET', path: '/api/items', description: 'List items', auth: false },
{ method: 'POST', path: '/api/items', description: 'Create item', auth: true },

// Route handlers:
app.get('/api/items', (c) => sendSuccess(c, { items: [] }));

app.post('/api/items', async (c) => {
  const { walletAddress } = await validatePoofAuth(c);
  const body = await c.req.json();
  return sendSuccess(c, { created: true });
});

// Admin-only:
app.delete('/api/admin/reset', async (c) => {
  const { walletAddress } = await validatePoofAuth(c, true);
  return sendSuccess(c, { reset: true });
});
```

The build step runs `bun run generate-spec` which reads `routeSpec` and writes `generated/api-spec.json`. The platform reads this after deploy to show available routes.

### Authentication

Import `validatePoofAuth` from `./lib/poof-auth.js` at the start of any protected route:

```typescript
// Normal user authentication
const { walletAddress } = await validatePoofAuth(c);

// Admin-only authentication
const { walletAddress } = await validatePoofAuth(c, true);
```

- Reads `Authorization: Bearer <token>` and `X-Wallet-Address` headers
- Verifies Cognito JWT (JWKS cached 1hr in Cloudflare Cache)
- Admin routes call Session API verify-admin endpoint
- Throws `AuthenticationError` (401) on failure

### Response Format

All responses: `{ success, data/error, timestamp, requestId }`

```typescript
import { sendSuccess, ApiErrors } from '../lib/api-response.js';

sendSuccess(c, { items: [] });                    // 200
ApiErrors.badRequest(c, 'Invalid input');          // 400
ApiErrors.unauthorized(c, 'Not logged in');        // 401
ApiErrors.notFound(c, 'Item not found');           // 404
ApiErrors.internal(c, 'Something broke');          // 500
```

### CORS

Auto-configured globally. No per-route setup needed.
- Dev: allows `*.poof.new` subdomains + localhost:3000/3001
- Prod: only domains from CORS env vars
- OPTIONS preflight handled automatically
- Custom domains supported via `CORS_PROD_DOMAINS` env var

### Database (@pooflabs/server)

```typescript
import { get, set, getItem, setItem, deleteItem } from '@pooflabs/server';

const user = await get('users/abc123');
await set('users/abc123', { name: 'Alice', score: 100 });
```

Tarobase is initialized per-request in index.ts middleware.

### x402 Payments

To require payment for a route, add to `X402_PROTECTED_PATHS` in `partyserver/src/lib/x402-middleware.ts`:

```typescript
export const X402_PROTECTED_PATHS: ProtectedPath[] = [
  { path: '/api/create', method: 'POST', price: '150000' }, // $0.15 USDC
];
```

### OAuth (Social Login)

**IMPORTANT: When a user asks for OAuth, social login, or connecting social accounts (Twitter, Google, Discord, GitHub), you MUST read and follow `.claude/skills/oauth/SKILL.md` before making any changes.** The template includes a complete pre-built OAuth implementation that just needs to be enabled — do NOT build OAuth from scratch.

---

### Calling Backend from Frontend

```typescript
// Public requests
import { api } from '@/lib/api-client';
const items = await api.get('/api/items');

// Authenticated requests
import { createAuthenticatedApiClient } from '@/lib/api-client';
const authApi = createAuthenticatedApiClient(token, walletAddress);
await authApi.post('/api/items', { name: 'New item' });
```

Available routes are listed in `partyserver/src/routes/index.ts` in the `routeSpec[]` array.

---

## Prediction Markets (Kalshi / DFlow)

When users ask about **Kalshi, tokenized prediction markets, or prediction market trading**: use **DFlow** (`@DflowPlugin`). DFlow provides tokenized Kalshi market trading — market creation, liquidity, and settlement are external. To fetch markets, use the pre-built hooks `useDflowMarkets()` / `useDflowMarket(mint)` from `src/hooks/use-dflow-markets.tsx` — do NOT create custom API routes or backend endpoints for fetching DFlow markets.

For **custom/self-hosted prediction markets** (your own questions, AMM/LMSR pricing): use `@PredictionMarketPlugin`. See `.claude/skills/generating-policies/reference/examples/prediction-market.md`.

---

## Rules

- Only 5 HTTP status codes: 200, 400, 401, 404, 500
- Register all routes in `partyserver/src/routes/index.ts`
- Always add entries to `routeSpec[]` when adding routes (needed for API spec display)
- `partyserver/src/lib/` files are template infrastructure — edit with care
- Don't remove the Tarobase initialization middleware in index.ts
- Use `constants.ts` for app-level constants (e.g. `PROJECT_VAULT_ADDRESS`)
