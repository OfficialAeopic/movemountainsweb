// Minimal ESM resolver hook: when a relative or @/ specifier resolves to a
// path that has no extension, try appending .ts (or /index.ts for directories)
// before falling back to Node's default. This lets the production source files
// keep their extensionless imports (the Next.js TS convention) while the test
// runner uses the native Node loader.

import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const TS_EXTS = [".ts", ".tsx"];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function tryFile(target) {
  if (existsSync(target) && statSync(target).isFile()) return target;
  for (const ext of TS_EXTS) {
    if (existsSync(target + ext) && statSync(target + ext).isFile()) {
      return target + ext;
    }
  }
  if (existsSync(target) && statSync(target).isDirectory()) {
    for (const ext of TS_EXTS) {
      const idx = path.join(target, "index" + ext);
      if (existsSync(idx) && statSync(idx).isFile()) return idx;
    }
  }
  return null;
}

// Stubbed Next.js submodules. The CRM source imports next/navigation,
// next/cache, and next/server in places that the test runner cannot install
// the real next package for. Tests use mock.module to override per-test
// behavior; this loader provides a default stub so the import resolves at all.
const NEXT_STUBS = {
  "next/navigation": "tests/_shim/next-navigation.ts",
  "next/cache": "tests/_shim/next-cache.ts",
  "next/server": "tests/_shim/next-server.ts",
  "zod": "tests/_shim/zod.ts",
};

export async function resolve(specifier, context, nextResolve) {
  if (Object.prototype.hasOwnProperty.call(NEXT_STUBS, specifier)) {
    const abs = path.join(ROOT, NEXT_STUBS[specifier]);
    return nextResolve(pathToFileURL(abs).href, context);
  }

  // @/ alias maps to project root.
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    const abs = path.join(ROOT, rel);
    const found = tryFile(abs);
    if (found) {
      return nextResolve(pathToFileURL(found).href, context);
    }
  }

  // Relative imports without an extension.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const parentDir = path.dirname(fileURLToPath(context.parentURL));
    const abs = path.resolve(parentDir, specifier);
    const ext = path.extname(specifier);
    if (!ext || (!TS_EXTS.includes(ext) && ext !== ".js" && ext !== ".mjs" && ext !== ".cjs" && ext !== ".json")) {
      const found = tryFile(abs);
      if (found) {
        return nextResolve(pathToFileURL(found).href, context);
      }
    }
  }

  return nextResolve(specifier, context);
}
