// Run from any directory with Node.js. Updates only kRootCa in private secrets.h.
import { readFile, writeFile } from "node:fs/promises";
import { rootCertificates } from "node:tls";
import { X509Certificate } from "node:crypto";

// WR1 chains to GTS Root R1:
// https://pki.goog/updates/march2025-alternate-chains.html
// SHA-256 fingerprint published at https://pki.goog/repository/
const expected = "D947432ABDE7B7FA90FC2E6B59101B1280E0E1C7E4E40FA3C6887FFF57A7F4CF";
const root = rootCertificates.find(pem =>
  new X509Certificate(pem).fingerprint256.replaceAll(":", "") === expected);
if (!root) throw new Error("GTS Root R1 not present in Node trusted roots; update Node.js.");
const certificate = new X509Certificate(root);
if (!certificate.ca || !certificate.verify(certificate.publicKey) ||
    Date.parse(certificate.validTo) <= Date.now()) {
  throw new Error("Trusted root validation failed.");
}
const path = new URL("../NoBanjir/secrets.h", import.meta.url);
const source = await readFile(path, "utf8");
let count = 0;
const updated = source.replace(
  /(\bkRootCa\s*=\s*)(?:R"([A-Za-z0-9_]*)\([\s\S]*?\)\2"|"(?:\\.|[^"\\])*")(?=\s*;)/g,
  (_, prefix) => {
    count++;
    return `${prefix}R"PEM(\n${root.trim()}\n)PEM"`;
  });
if (count !== 1) throw new Error("Expected exactly one kRootCa declaration.");
await writeFile(path, updated, "utf8");
// Only public certificate metadata; never print private configuration.
console.log(`Updated kRootCa: ${certificate.subject}; SHA256=${certificate.fingerprint256}`);
