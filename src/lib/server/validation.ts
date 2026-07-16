const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRIPE_ACCOUNT_PATTERN = /^acct_[A-Za-z0-9]+$/;

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function requiredString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== "string") throw new Error(`${field} is required.`);
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Error(`${field} must contain 1-${maxLength} characters.`);
  }
  return normalized;
}

export function validEmail(value: unknown): string {
  const email = requiredString(value, "email", 254).toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new Error("email is invalid.");
  return email;
}

export function validStripeAccount(value: unknown): string {
  const accountId = requiredString(value, "accountId", 64);
  if (!STRIPE_ACCOUNT_PATTERN.test(accountId)) {
    throw new Error("accountId is invalid.");
  }
  return accountId;
}

export function validAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error("amount must be a number.");
  }
  const cents = Math.round(value * 100);
  if (cents < 100 || cents > 100_000) {
    throw new Error("amount must be between €1 and €1,000.");
  }
  return cents;
}

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[character]!,
  );
}
