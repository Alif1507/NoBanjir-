import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, unlink, rmdir } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { withSavedToken } from "../scripts/device-token.mjs";

test("persists the token before remote activation and never truncates it afterward", async () => {
  await mkdir(".cache/token-tests", { recursive: true });
  const directory = await mkdtemp(path.resolve(".cache/token-tests/case-"));
  const output = path.join(directory, "credential.json");
  const record = { device_code: "TEST", device_token: "PUBLIC-TEST-ONLY" };
  try {
    await withSavedToken(output, record, async () => {
      assert.equal(JSON.parse(await readFile(output, "utf8")).device_token, record.device_token);
      return "active";
    });
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")), record);
    if (process.platform === "win32") {
      const { stdout } = await promisify(execFile)("icacls.exe", [output], { windowsHide: true });
      assert.equal(stdout.includes("BUILTIN\\Users"), false);
      assert.equal(stdout.includes("Authenticated Users"), false);
    }
    await assert.rejects(withSavedToken(output, record, async () => assert.fail("cannot replace existing token")));
  } finally { await unlink(output).catch(() => {}); await rmdir(directory); }
});

test("an uncertain activation preserves the only token copy for reconciliation", async () => {
  await mkdir(".cache/token-tests", { recursive: true });
  const directory = await mkdtemp(path.resolve(".cache/token-tests/case-"));
  const output = path.join(directory, "credential.json");
  const record = { device_code: "TEST", device_token: "PUBLIC-TEST-ONLY" };
  try {
    await assert.rejects(withSavedToken(output, record, async () => { throw new Error("response lost"); }));
    assert.deepEqual(JSON.parse(await readFile(output, "utf8")), record);
  } finally { await unlink(output).catch(() => {}); await rmdir(directory); }
});
