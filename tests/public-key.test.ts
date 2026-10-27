import { test } from "node:test";
import assert from "node:assert/strict";
import { isPublicKey } from "../src/lib/supabase/public-key.ts";

test("refuses a server key in browser configuration", () => {
  const jwt = (role: string) => `header.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.signature`;
  assert.equal(isPublicKey("sb_secret_PRIVATE_TEST_ONLY"), false);
  assert.equal(isPublicKey(jwt("service_role")), false);
  assert.equal(isPublicKey(jwt("anon")), true);
  assert.equal(isPublicKey("sb_publishable_PUBLIC_TEST_ONLY"), true);
  assert.equal(isPublicKey("not-a-key"), false);
});
