import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";

/**
 * Guest preferences endpoint for the wedding invitation form.
 *
 * Every field is optional — the form itself is optional for guests. Follows the
 * project API convention: validate with zod, return the `{ data }` envelope, keep
 * secrets server-side. Forwards to `CONTACT_ENDPOINT` when set, otherwise logs so
 * the starter runs as-is.
 */
const preferencesSchema = z.object({
  name: z.string().trim().max(100).optional(),
  drinking: z.boolean().optional(),
  allergies: z.string().trim().max(500).optional(),
  preferences: z.string().trim().max(2000).optional(),
});

export const POST = handle(async (req) => {
  const input = preferencesSchema.parse(await req.json());

  const { CONTACT_ENDPOINT } = getServerEnv();

  if (CONTACT_ENDPOINT) {
    const upstream = await fetch(CONTACT_ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: "wedding_preferences", ...input }),
    });
    if (!upstream.ok) {
      throw new ApiError(502, "upstream_error", "Не удалось отправить анкету.");
    }
  } else {
    console.log("[api/preferences] submission:", input);
  }

  return { received: true };
});
