import { describe, expect, it } from "vitest";

import {
  escapeHtml,
  requiredString,
  validAmount,
  validEmail,
  validStripeAccount,
} from "./validation";

describe("request validation", () => {
  it("normalizes bounded strings", () => {
    expect(requiredString("  Strasbourg  ", "city", 20)).toBe("Strasbourg");
    expect(() => requiredString("", "city", 20)).toThrow();
  });

  it("accepts valid donation amounts in cents", () => {
    expect(validAmount(12.34)).toBe(1234);
    expect(() => validAmount(0)).toThrow();
    expect(() => validAmount(1000.01)).toThrow();
    expect(() => validAmount(Number.NaN)).toThrow();
  });

  it("validates identifiers and email addresses", () => {
    expect(validEmail("Donor@Example.com")).toBe("donor@example.com");
    expect(validStripeAccount("acct_123ABC")).toBe("acct_123ABC");
    expect(() => validEmail("not-an-email")).toThrow();
    expect(() => validStripeAccount("cus_123")).toThrow();
  });

  it("escapes untrusted HTML values", () => {
    expect(escapeHtml('<script>"x" & y</script>')).toBe(
      "&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;",
    );
  });
});
