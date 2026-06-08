---
tags: [architecture, config, stable]
updated: 2026-06-08
---

# Environment Variables

Rules for handling configuration and secrets.

## Rules

- Store all secrets in **`.env.local`** — never commit it (it is git-ignored).
- Document every required variable in **`.env.example`** (committed, no real values).
- Reference variables in code via `process.env.VARIABLE_NAME`.
- Prefix with **`NEXT_PUBLIC_`** only if the value is safe to expose to the browser.
  Unprefixed variables are server-only.

## Current variables

| Name | Scope | Purpose |
|------|-------|---------|
| `NEXT_PUBLIC_SITE_URL` | public | Site origin (no trailing slash). Drives canonical URLs, OG/Twitter tags, `robots.txt`, `sitemap.xml`, JSON-LD. Falls back to `http://localhost:3000` when unset — **set it in production**. See [[seo-metadata]]. |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | public | Google Maps JS API key for `<VenueMap>` (location section). **Public by design** — restrict by HTTP referrer in Google Cloud, never reuse for secrets. Unset → styled placeholder + "open in Maps" link. See [[api-architecture]], [[decisions-log]] ADR-0017. |
| `CONTACT_ENDPOINT` | server-only | Optional upstream the `/api/contact` route forwards leads to (CRM / webhook). When unset, submissions are logged server-side. See [[api-architecture]]. |
| `TELEGRAM_BOT_TOKEN` | server-only | Telegram Bot API token for guest-form delivery via `/api/preferences`. **Must be set together with** `TELEGRAM_CHAT_ID`; when both omitted, submissions log server-side. Create via @BotFather. |
| `TELEGRAM_CHAT_ID` | server-only | Chat ID that receives preference submissions (your user ID or a group ID). Fetch via `getUpdates` after messaging the bot. Pair with `TELEGRAM_BOT_TOKEN`. |

Documented in `.env.example` (committed). Validated by `src/env.ts` (zod):
`publicEnv` for `NEXT_PUBLIC_*` (safe anywhere), `getServerEnv()` for
server-only secrets (route handlers only) — see [[api-architecture]]. Read env
through `src/env.ts`, never `process.env` directly.

> [!important] Secret handling
> Secret keys are **unprefixed** — `NEXT_PUBLIC_` is only for values safe in the
> browser. Secrets are read in server code (`app/api/**`); the browser never
> holds one. See [[api-architecture]].

When the next variable is introduced:
1. Add it to `.env.example` with a comment describing it.
2. Add a row to the table above (name, scope, purpose).
3. Add a [[changelog]] entry.

## Related

[[tech-stack]] · [[seo-metadata]] · [[backend/README]]
