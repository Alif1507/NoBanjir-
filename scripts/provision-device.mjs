import { createHash, randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { z } from "zod";
import { deviceCodeSchema } from "../src/lib/iot/schema.ts";
import { provisionConfigSchema } from "../src/lib/iot/provision-config.ts";
import { withSavedToken } from "./device-token.mjs";

const usage = `Usage:
  npm run device -- provision --config device-config.json [--out PRIVATE-FILE.json]
  npm run device -- rotate --code ESP32-NB-001 [--out NEW-PRIVATE-FILE.json]
  npm run device -- revoke --code ESP32-NB-001
Tokens are saved to a git-ignored local file, never stdout. Protect that folder
with your OS account permissions and do not commit or share it.`;

async function rpc(name, body) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url?.startsWith("https://") || !key) throw new Error("Set Supabase URL and server secret key in .env.local first.");
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/${name}`, {
    method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new Error(`Supabase rejected ${name} (HTTP ${response.status}). No raw database error was logged.`);
  return response.json();
}

async function main() {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    config: { type: "string" }, code: { type: "string" }, out: { type: "string" }, help: { type: "boolean" },
  } });
  if (values.help) { console.log(usage); return; }
  const action = positionals[0];
  if (!["provision", "rotate", "revoke"].includes(action)) throw new Error(usage);
  const config = action === "provision"
    ? provisionConfigSchema.parse(JSON.parse(await readFile(values.config ?? "device-config.json", "utf8"))) : null;
  const deviceCode = config?.device_code ?? deviceCodeSchema.parse(values.code);
  if (action === "revoke") {
    if (await rpc("revoke_device_token", { p_device_code: deviceCode }) !== true) throw new Error("Device not found.");
    console.log(`Credential revoked for ${deviceCode}.`);
    return;
  }
  const token = randomBytes(32).toString("base64url");
  const hash = createHash("sha256").update(token).digest("hex");
  const output = path.resolve(values.out ?? `provisioned-devices/${deviceCode}-${Date.now()}.json`);
  const record = { device_code: deviceCode, device_token: token };
  try {
    await withSavedToken(output, record, async () => {
      if (action === "provision") {
        z.uuid().parse(await rpc("provision_device", { p_config: config, p_token_hash: hash }));
      } else if (await rpc("rotate_device_token", { p_device_code: deviceCode, p_token_hash: hash }) !== true) {
        throw new Error("Device not found.");
      }
    });
    console.log(`${action} succeeded for ${deviceCode}. Token file: ${output}`);
  } catch (error) {
    console.error(`Activation not confirmed. If the token file exists at ${output}, keep it for reconciliation.`);
    throw error;
  }
}

main().catch(error => {
  console.error(error instanceof z.ZodError ? "Invalid device configuration; check required fields, range and thresholds." : error.message);
  process.exitCode = 1;
});
