import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

const cookieName = "hom_thu_admin";
const sessionVersion = 3;
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

export type AdminSession = {
  user: string;
  displayName: string;
};

function getSessionSecret() {
  return (
    process.env.SUPABASE_SECRET_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE?.trim() ||
    "hom-thu-dev-secret"
  );
}

function sign(payload: string) {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createAdminSessionValue(user: string, displayName: string) {
  const expires = Date.now() + sessionMaxAgeSeconds * 1000;
  const payload = JSON.stringify({
    user,
    displayName: displayName.trim() || user,
    expires,
    version: sessionVersion,
  });
  const encodedPayload = Buffer.from(payload).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function getAdminSession(value?: string): AdminSession | null {
  if (!value) {
    return null;
  }

  const [encodedPayload, signature] = value.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expected = sign(encodedPayload);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as {
      user?: string;
      displayName?: string;
      expires?: number;
      version?: number;
    };

    if (
      typeof payload.user === "string" &&
      payload.user.length > 0 &&
      payload.version === sessionVersion &&
      Number(payload.expires) > Date.now()
    ) {
      return {
        user: payload.user,
        displayName:
          typeof payload.displayName === "string" && payload.displayName.trim()
            ? payload.displayName.trim()
            : payload.user,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function isValidAdminSession(value?: string) {
  return getAdminSession(value) !== null;
}

export { cookieName as adminCookieName };
export { sessionMaxAgeSeconds as adminSessionMaxAgeSeconds };
