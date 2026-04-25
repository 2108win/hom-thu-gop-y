import "server-only";

import { randomInt, randomUUID } from "node:crypto";

const lookupLetters = "ABCDEFGHJKLMNPQRSTUVWXYZ";

export function createLookupCode(prefix: string) {
  const chunk = Array.from(
    { length: 3 },
    () => lookupLetters[randomInt(lookupLetters.length)],
  ).join("");
  const number = randomInt(10000, 100000);

  return `${prefix}-${chunk}${number}`;
}

export function createEntityId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
}
