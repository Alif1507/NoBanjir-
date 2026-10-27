import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const candidates = [resolve("node_modules/typescript/lib/typescript.js")];
if (process.env.APPDATA) candidates.push(resolve(process.env.APPDATA,
  "npm/node_modules/vercel/node_modules/typescript/lib/typescript.js"));
const typescriptPath = candidates.find(existsSync);
if (!typescriptPath) {
  console.error("Local TypeScript parser unavailable. Install dependencies and run npm run typecheck.");
  process.exit(2);
}
const ts = createRequire(import.meta.url)(typescriptPath);
const files = [];
function collect(folder) {
  for (const item of readdirSync(folder, { withFileTypes: true })) {
    const path = join(folder, item.name);
    if (item.isDirectory()) collect(path);
    else if (/\.tsx?$/.test(item.name)) files.push(path);
  }
}
collect("src");
collect("tests");
let errors = 0;
for (const file of files) {
  const source = ts.createSourceFile(file, readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true,
    extname(file) === ".tsx" ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  for (const diagnostic of source.parseDiagnostics) {
    console.error(`${file}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")}`);
    errors++;
  }
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith(".")) continue;
    const target = resolve(dirname(file), specifier);
    if (!existsSync(target) && !existsSync(`${target}.ts`) && !existsSync(`${target}.tsx`)) {
      console.error(`${file}: unresolved import ${specifier}`);
      errors++;
    }
  }
}
console.log(`Parsed ${files.length} TypeScript files; ${errors} syntax or relative import errors.`);
process.exitCode = errors ? 1 : 0;
