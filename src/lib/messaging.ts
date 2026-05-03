// AES-like obfuscation + scam detection helpers
export function obfuscate(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}
export function deobfuscate(s: string): string {
  try { return decodeURIComponent(escape(atob(s))); } catch { return s; }
}

const SCAM_PATTERNS: Array<{ re: RegExp; name: string }> = [
  { re: /(\+\d[\d\s().-]{6,})/, name: "phone_number" },
  { re: /whatsapp/i, name: "whatsapp" },
  { re: /telegram/i, name: "telegram" },
  { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, name: "email" },
  { re: /\bIBAN\b/i, name: "iban" },
  { re: /virement/i, name: "wire_fr" },
  { re: /wire transfer/i, name: "wire_en" },
  { re: /western union/i, name: "western_union" },
  { re: /moneygram/i, name: "moneygram" },
];

export function detectScam(text: string): string | null {
  for (const p of SCAM_PATTERNS) if (p.re.test(text)) return p.name;
  return null;
}
