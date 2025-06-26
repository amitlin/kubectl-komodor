#!/usr/bin/env bun

import { $ } from "bun";
const PLUGIN_NAME = "kubectl-komodor";
const MANIFEST_TEMPLATE = "komodor.dev.example.yaml";
const MANIFEST = "komodor.dev.yaml";
const ENTRYPOINT = "index.ts";

if (Bun.argv.length < 3) {
  console.error("Usage: bun release.ts <new-version>");
  process.exit(1);
}
const NEW_VERSION = Bun.argv[2];

// 0. Copy the example manifest to the working manifest
await Bun.write(MANIFEST, await Bun.file(MANIFEST_TEMPLATE).text());

// 1. Bump version in package.json (if present)
try {
  const pkg = Bun.file("package.json");
  if (await pkg.exists()) {
    const pkgJson = await pkg.json();
    pkgJson.version = NEW_VERSION;
    await Bun.write("package.json", JSON.stringify(pkgJson, null, 2) + "\n");
    console.log("Updated package.json version.");
  }
} catch (e) {
  // ignore if no package.json
}

// 2. Bump version in manifest
let manifest = await Bun.file(MANIFEST).text();
manifest = manifest.replace(/version: ".*"/, `version: "${NEW_VERSION}"`);

// 3. Detect platform
const os = process.platform === "darwin" ? "darwin" : process.platform;
const arch = process.arch;
let manifestArch: string = arch;
if (arch === "arm64") manifestArch = "arm64";
else if (arch === "x64") manifestArch = "amd64";

const OUTFILE = PLUGIN_NAME;
const TARBALL = `${PLUGIN_NAME}-${os}-${manifestArch}.tar.gz`;

// 4. Build binary
console.log(`Building binary for ${os}/${manifestArch}...`);
await $`bun build ${ENTRYPOINT} --compile --outfile=${OUTFILE}`;

// 5. Package tarball
console.log(`Packaging ${OUTFILE} into ${TARBALL}...`);
await $`tar czf ${TARBALL} ${OUTFILE}`;

// 6. Calculate SHA256
console.log("Calculating SHA256...");
const shaOut = await $`shasum -a 256 ${TARBALL}`;
const SHA256 = shaOut.stdout.toString().split(" ")[0];

// 7. Update manifest (uri and sha256 for this platform)
const uri = `file://${process.cwd()}/${TARBALL}`;
manifest = manifest.replace(
  new RegExp(`(os: ${os}\\s+arch: ${manifestArch}[\\s\\S]*?uri: ).*`, "m"),
  `$1${uri}`,
);
manifest = manifest.replace(
  new RegExp(`(os: ${os}\\s+arch: ${manifestArch}[\\s\\S]*?sha256: ).*`, "m"),
  `$1${SHA256}`,
);
await Bun.write(MANIFEST, manifest);
console.log(`Updated ${MANIFEST} for ${os}/${manifestArch}`);

// 8. Install with krew
console.log("Installing plugin with krew...");
await $`kubectl krew uninstall komodor`.catch(() => {});
await $`kubectl krew install --manifest=${MANIFEST} --archive=${TARBALL}`;

console.log("Done!");
console.log("Test with: kubectl komodor --help");
