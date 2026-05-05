import i18n from "@/lib/i18n";

export interface RateErrorPayload {
  code?: string;
  message?: string;
}

/**
 * Map a server-function error (thrown by rates.functions.ts) to a localized
 * user-facing message. Handles: 401, 403, 400 (Zod / DB), network, unknown.
 */
export function formatRateError(err: unknown): string {
  const t = i18n.t.bind(i18n);

  // Server functions surface thrown Response as Error with status info on it.
  // Try common shapes.
  const anyErr = err as {
    status?: number;
    response?: { status?: number };
    body?: unknown;
    message?: string;
    name?: string;
  };

  const status: number | undefined =
    anyErr?.status ?? anyErr?.response?.status ?? parseStatusFromMessage(anyErr?.message);

  // Try to parse JSON payload { code, message }
  let payload: RateErrorPayload | undefined;
  if (anyErr?.body && typeof anyErr.body === "string") {
    payload = safeJson(anyErr.body);
  } else if (anyErr?.message) {
    payload = safeJson(anyErr.message) ?? { message: anyErr.message };
  }

  if (status === 401) return t("rateErrors.unauthorized");
  if (status === 403 || payload?.code === "RATES_FORBIDDEN") return t("rateErrors.forbidden");
  if (status === 400) {
    if (payload?.code === "RATES_DB_ERROR") {
      return t("rateErrors.dbError", { message: payload.message ?? "" });
    }
    return t("rateErrors.validation");
  }

  if (anyErr?.name === "TypeError" || /fetch|network/i.test(anyErr?.message ?? "")) {
    return t("rateErrors.network");
  }

  return payload?.message || anyErr?.message || t("rateErrors.unknown");
}

function safeJson(s: string): RateErrorPayload | undefined {
  try {
    const v = JSON.parse(s);
    if (v && typeof v === "object") return v as RateErrorPayload;
  } catch {
    /* noop */
  }
  return undefined;
}

function parseStatusFromMessage(msg?: string): number | undefined {
  if (!msg) return undefined;
  const m = msg.match(/\b(400|401|403|404|409|422|500|502|503)\b/);
  return m ? Number(m[1]) : undefined;
}
