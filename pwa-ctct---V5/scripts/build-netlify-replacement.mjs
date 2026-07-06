#!/usr/bin/env node

import { build } from "esbuild";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const generatedDir = resolve(root, ".netlify-generated");
const generatedServer = resolve(generatedDir, "server-app.ts");
const distFunctions = resolve(root, "dist/netlify/functions");
const apiEntry = resolve(root, "netlify/functions/api.ts");

function fail(message) {
  console.error(message);
  process.exit(1);
}

function transformServerSource() {
  const sourcePath = resolve(root, "server.ts");
  const source = readFileSync(sourcePath, "utf8");
  const marker = "// ----------------------------------------------------\n// VITE OR STATIC FILE SERVING";
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) fail("Cannot find server static-serving marker; Netlify function build aborted.");
  const apiOnlySource = `${source.slice(0, markerIndex).replaceAll("\"./src/", "\"../src/")}

export default app;
`;
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(generatedServer, apiOnlySource, "utf8");
}

function buildStaticFrontend() {
  execFileSync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"], { cwd: root, stdio: "inherit" });
}

async function buildFunctionBundle() {
  mkdirSync(distFunctions, { recursive: true });
  await build({
    entryPoints: [generatedServer],
    outfile: resolve(distFunctions, "server-app.mjs"),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    packages: "external",
    sourcemap: false,
    logLevel: "info",
  });

  await build({
    entryPoints: [apiEntry],
    outfile: resolve(distFunctions, "api.js"),
    bundle: true,
    platform: "node",
    target: "node20",
    format: "esm",
    external: ["./server-app.mjs"],
    sourcemap: false,
    logLevel: "info",
  });
}

function copyNetlifyConfigForFolderReplacement() {
  copyFileSync(resolve(root, "netlify.toml"), resolve(root, "dist/netlify.toml"));
}

rmSync(resolve(root, "dist"), { recursive: true, force: true });
transformServerSource();
buildStaticFrontend();
await buildFunctionBundle();
copyNetlifyConfigForFolderReplacement();

console.log(JSON.stringify({
  status: "PASS",
  publishDirectory: "dist",
  apiFunction: "dist/netlify/functions/api.js",
  replacementMode: "static frontend plus Netlify Function API",
  productionImport: "BLOCKED",
}, null, 2));
