type SecureCookieInput = {
  forwardedProto?: string | null;
  origin?: string | null;
  referer?: string | null;
  nodeEnv?: string;
};

export function shouldUseSecureCookie({
  forwardedProto,
  origin,
  referer,
  nodeEnv = process.env.NODE_ENV,
}: SecureCookieInput) {
  const proto = firstHeaderValue(forwardedProto);

  if (proto) {
    return proto.toLowerCase() === "https";
  }

  const url = parseUrl(origin) ?? parseUrl(referer);

  if (url) {
    return url.protocol === "https:";
  }

  return nodeEnv === "production";
}

function firstHeaderValue(value: string | null | undefined) {
  return value?.split(",")[0]?.trim() || null;
}

function parseUrl(value: string | null | undefined) {
  if (!value) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}
