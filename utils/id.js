import { nanoid } from "nanoid/non-secure";

export function uid(len = 10) {
  return nanoid(len);
}
