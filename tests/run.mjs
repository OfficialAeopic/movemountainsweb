#!/usr/bin/env node
// Test runner that wraps the Node experimental flags needed by the suite.
// Forwards extra CLI args to `node --test`. Default glob is tests/**/*.test.ts.

import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

const cliArgs = process.argv.slice(2);
const pattern = cliArgs.length > 0 ? cliArgs : ["tests/**/*.test.ts"];

const loaderPath = path.join(here, "loader.mjs");

const flags = [
  "--experimental-strip-types",
  "--experimental-transform-types",
  "--experimental-test-module-mocks",
  "--no-warnings",
  "--import",
  `data:text/javascript,import { register } from "node:module"; import { pathToFileURL } from "node:url"; register(${JSON.stringify(pathToFileURL(loaderPath).href)});`,
  "--test",
  ...pattern,
];

const child = spawn(process.execPath, flags, {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
