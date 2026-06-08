import { z } from "zod";

import { getServerEnv } from "@/env";
import { ApiError, handle } from "@/lib/api";
import {
  formatPreferencesMessage,
  sendTelegramMessage,
} from "@/lib/telegram";

/**
 * Guest preferences endpoint for the wedding invitation form.
 *
 * Every field is optional — the form itself is optional for guests. Follows the
 * project API convention: validate with zod, return the `{ data }` envelope, keep
 * secrets server-side. Delivers to Telegram when `TELEGRAM_BOT_TOKEN` and
 * `TELEGRAM_CHAT_ID` are set; otherwise logs so the starter runs as-is.
 */
const preferencesSchema = z.object({
  name: z.string().trim().max(100).optional(),
  drinking: z.boolean().optional(),
  allergies: z.string().trim().max(500).optional(),
  preferences: z.string().trim().max(2000).optional(),
});

export const POST = handle(async (req) => {
  const input = preferencesSchema.parse(await req.json());

  const { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } = getServerEnv();

  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    await sendTelegramMessage({
      token: TELEGRAM_BOT_TOKEN,
      chatId: TELEGRAM_CHAT_ID,
      text: formatPreferencesMessage(input),
    });
  } else {
    console.log("[api/preferences] submission (Telegram not configured):", input);
  }

  return { received: true };
});
