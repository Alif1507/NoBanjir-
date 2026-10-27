import { mkdir, open } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const exec = promisify(execFile);
async function restrictWindowsAcl(output) {
  if (process.platform !== "win32") return;
  const { stdout } = await exec("whoami.exe", ["/user", "/fo", "csv", "/nh"], { windowsHide: true });
  const sid = stdout.match(/S-1-(?:\d+-)+\d+/)?.[0];
  if (!sid) throw new Error("Cannot identify current Windows user; token was not written.");
  // Set an explicit user grant before removing inherited group access.
  await exec("icacls.exe", [output, "/grant:r", `*${sid}:(F)`], { windowsHide: true });
  await exec("icacls.exe", [output, "/inheritance:r"], { windowsHide: true });
}

// Save the sole plaintext token before the RPC, then keep that file immutable.
// A lost response can leave activation uncertain, but the token survives.
export async function withSavedToken(output, record, activate) {
  await mkdir(path.dirname(output), { recursive: true });
  const file = await open(output, "wx", 0o600);
  try {
    await restrictWindowsAcl(output);
    await file.writeFile(JSON.stringify(record, null, 2) + "\n");
  }
  finally { await file.close(); }
  return activate();
}
