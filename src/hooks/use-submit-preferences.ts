"use client";

import { useCallback, useState } from "react";

import { ApiClientError, apiFetch } from "@/lib/api-client";

export interface PreferencesInput {
  name?: string;
  drinking?: boolean;
  allergies?: string;
  preferences?: string;
}

export type SubmitStatus = "idle" | "submitting" | "success" | "error";

/**
 * Submits the wedding preferences form to `/api/preferences` and tracks status.
 * Keeps the network logic out of the presentational section (component-conventions).
 */
export function useSubmitPreferences() {
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: PreferencesInput) => {
    setStatus("submitting");
    setError(null);
    try {
      await apiFetch<{ received: boolean }>("/api/preferences", {
        method: "POST",
        body: JSON.stringify(input),
      });
      setStatus("success");
    } catch (err) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Не удалось отправить. Попробуйте ещё раз.",
      );
      setStatus("error");
    }
  }, []);

  return { status, error, submit };
}
