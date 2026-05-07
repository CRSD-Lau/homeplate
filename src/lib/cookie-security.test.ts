import { describe, expect, it } from "vitest";

import { shouldUseSecureCookie } from "./cookie-security";

describe("shouldUseSecureCookie", () => {
  it("uses secure cookies for https forwarded requests", () => {
    expect(shouldUseSecureCookie({ forwardedProto: "https" })).toBe(true);
  });

  it("does not use secure cookies for http forwarded requests", () => {
    expect(shouldUseSecureCookie({ forwardedProto: "http" })).toBe(false);
  });

  it("uses secure cookies for https origins", () => {
    expect(shouldUseSecureCookie({ origin: "https://homeplate.test" })).toBe(
      true,
    );
  });

  it("does not use secure cookies for LAN http origins in production mode", () => {
    expect(shouldUseSecureCookie({ origin: "http://192.168.2.26:3100" })).toBe(
      false,
    );
  });

  it("falls back to secure cookies when no request protocol is available in production", () => {
    expect(shouldUseSecureCookie({ nodeEnv: "production" })).toBe(true);
  });
});
