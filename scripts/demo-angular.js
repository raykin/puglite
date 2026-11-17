#!/usr/bin/env node
"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "..");
const demoDir = path.join(repoRoot, "angular-puglite-demo");
const SKIPPED_ENTRIES = new Set(["node_modules", "dist", ".angular", "package-lock.json"]);

function usage() {
  console.error("Usage: node scripts/demo-angular.js <angular-major> [target-dir]");
  process.exit(1);
}

function npmView(spec, field) {
  const out = execFileSync("npm", ["view", spec, field, "--json"], { encoding: "utf8" });
  const value = out.trim() ? JSON.parse(out) : undefined;
  return Array.isArray(value) ? value[value.length - 1] : value;
}

function latestVersion(name, major) {
  const latest = npmView(`${name}@^${major}.0.0`, "version");
  if (!latest) throw new Error(`no ${name} release for Angular ${major}`);
  return latest;
}

function peerRange(spec, peer) {
  const range = (npmView(spec, "peerDependencies") || {})[peer];
  if (!range) throw new Error(`${spec} has no ${peer} peer dependency`);
  return range;
}

function angularRange(name, major) {
  if (name === "@angular-devkit/architect") {
    return `>=0.${major}00.0 <0.${major + 1}00.0`;
  }
  if (
    name.startsWith("@angular/") ||
    name.startsWith("@angular-builders/") ||
    name === "@angular-devkit/build-angular"
  ) {
    return `^${major}.0.0`;
  }
  return undefined;
}

function prepareTarget(targetArg, major) {
  if (!targetArg) {
    return fs.mkdtempSync(path.join(os.tmpdir(), `puglite-demo-ng${major}-`));
  }
  const target = path.resolve(targetArg);
  if (fs.existsSync(target) && fs.readdirSync(target).length > 0) {
    throw new Error(`${target} is not empty`);
  }
  fs.mkdirSync(target, { recursive: true });
  return target;
}

function copyDemo(target) {
  for (const entry of fs.readdirSync(demoDir)) {
    if (SKIPPED_ENTRIES.has(entry)) continue;
    fs.cpSync(path.join(demoDir, entry), path.join(target, entry), { recursive: true });
  }
}

function pinAngular(target, major) {
  const compilerCli = latestVersion("@angular/compiler-cli", major);
  const core = latestVersion("@angular/core", major);
  const typescript = peerRange(`@angular/compiler-cli@${compilerCli}`, "typescript");
  const zoneJs = peerRange(`@angular/core@${core}`, "zone.js");

  const packageJsonPath = path.join(target, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
  for (const field of ["dependencies", "devDependencies"]) {
    const deps = packageJson[field] || {};
    for (const name of Object.keys(deps)) {
      const range = angularRange(name, major);
      if (range) deps[name] = range;
    }
    if (deps.typescript) deps.typescript = typescript;
    if (deps["zone.js"]) deps["zone.js"] = zoneJs;
    if (deps.puglite) deps.puglite = `file:${repoRoot}`;
  }
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
}

function main() {
  const [majorArg, targetArg] = process.argv.slice(2);
  const major = Number(majorArg);
  if (!Number.isInteger(major) || major < 1) usage();

  const target = prepareTarget(targetArg, major);
  copyDemo(target);
  pinAngular(target, major);
  execFileSync("npm", ["install", "--no-audit", "--no-fund"], {
    cwd: target,
    stdio: "inherit",
  });
  console.log(target);
}

main();
