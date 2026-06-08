import { ApiError } from "@/lib/api";

const TELEGRAM_API = "https://api.telegram.org";

export interface PreferencesPayload {
  name?: string;
  drinking?: boolean;
  allergies?: string;
  preferences?: string;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Formats a guest-preferences submission for Telegram (HTML parse mode). */
export function formatPreferencesMessage(input: PreferencesPayload): string {
  const lines: string[] = ["<b>Новая анкета гостя</b>", ""];

  if (input.name) {
    lines.push(`<b>Имя:</b> ${escapeHtml(input.name)}`);
  }

  if (input.drinking !== undefined) {
    lines.push(`<b>Алкоголь:</b> ${input.drinking ? "да" : "нет"}`);
  }

  if (input.allergies) {
    lines.push(`<b>Аллергии:</b> ${escapeHtml(input.allergies)}`);
  }

  if (input.preferences) {
    lines.push(`<b>Пожелания:</b> ${escapeHtml(input.preferences)}`);
  }

  const hasField =
    input.name ||
    input.drinking !== undefined ||
    input.allergies ||
    input.preferences;

  if (!hasField) {
    lines.push("<i>Гость отправил пустую анкету.</i>");
  }

  return lines.join("\n");
}

/** Sends a plain-text or HTML message via the Telegram Bot API. */
export async function sendTelegramMessage(params: {
  token: string;
  chatId: string;
  text: string;
}): Promise<void> {
  const res = await fetch(`${TELEGRAM_API}/bot${params.token}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: params.chatId,
      text: params.text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("[telegram] sendMessage failed:", res.status, body);
    throw new ApiError(502, "telegram_error", "Не удалось отправить анкету.");
  }
}
