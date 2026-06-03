/**
 * Validated environment variables.
 *
 * `publicEnv` holds `NEXT_PUBLIC_*` values — inlined into the client bundle,
 * safe in the browser. `getServerEnv()` holds server-only values (secrets) —
 * never read it from client code; on the client those values are `undefined`.
 *
 * A missing/invalid variable fails fast with a clear zod error rather than
 * surfacing as a confusing runtime bug later.
 */

import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
  /**
   * Google Maps JavaScript API key. Public by design — it ships in the browser and
   * is secured by an HTTP-referrer restriction (Google Cloud Console), not by
   * secrecy. This is the one sanctioned `NEXT_PUBLIC_` "key": the Maps JS SDK loads
   * its script client-side, so it cannot be proxied through `/api/*` like a real
   * secret. Unset → the venue map falls back to a styled placeholder. See ADR-0017.
   */
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: z.string().optional(),
});

const serverSchema = z.object({
  /** Optional upstream the contact endpoint forwards leads to (CRM / webhook). */
  CONTACT_ENDPOINT: z.url().optional(),
});

/** Public env — safe to read anywhere (server or client). */
export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  // Referenced literally so Next can inline it into the client bundle.
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
});

let cachedServerEnv: z.infer<typeof serverSchema> | undefined;

/**
 * Server-only env. Call from route handlers / server code only — parsed
 * lazily so the client bundle never evaluates it.
 */
export function getServerEnv() {
  cachedServerEnv ??= serverSchema.parse({
    CONTACT_ENDPOINT: process.env.CONTACT_ENDPOINT,
  });
  return cachedServerEnv;
}
