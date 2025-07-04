#!/usr/bin/env bun

import { $ } from "bun";
const PLUGIN_NAME = "kubectl-komodor";
const VERSION = Bun.argv[2];
const MANIFEST_FILE = "komodor.yaml";

if (!VERSION) {
  console.error("Usage: bun release-all.ts <new-version>");
  process.exit(1);
}

// Platforms for Krew manifest (excluding Alpine since Krew doesn't support platform selectors for Alpine)
const platforms = [
  { os: "darwin", arch: "arm64" },
  { os: "darwin", arch: "amd64" },
  { os: "linux", arch: "arm64" },
  { os: "linux", arch: "amd64" },
];

let homepage = "https://github.com/amitlin/kubectl-komodor";
let shortDescription = "Interact with cluster resources through Komodor";
let description =
  "A utility to interact with cluster resources through Komodor. Open up resources in Komodor directly from the command line.";
try {
  const manifestText = await Bun.file(MANIFEST_FILE).text();
  homepage = manifestText.match(/homepage: "([^"]+)"/)?.[1] || homepage;
  shortDescription =
    manifestText.match(/shortDescription: "([^"]+)"/)?.[1] || shortDescription;
  description =
    manifestText
      .match(/description: \|\n([\s\S]+?)\n\s+[a-zA-Z]/)?.[1]
      ?.trim() || description;
} catch {}

console.log("🔨 Building all artifacts using build-artifacts script...");
await $`bun run build-artifacts`;

const manifestBlocks: string[] = [];

for (const { os, arch } of platforms) {
  const TARBALL = `${PLUGIN_NAME}-${os}-${arch}.tar.gz`;

  console.log(`Processing ${TARBALL} for manifest...`);
  
  // Check if tarball exists
  try {
    await $`ls ${TARBALL}`;
  } catch {
    console.error(`❌ Tarball ${TARBALL} not found. Make sure build-artifacts completed successfully.`);
    process.exit(1);
  }

  const shaOut = await $`shasum -a 256 ${TARBALL}`;
  const SHA256 = shaOut.stdout.toString().split(" ")[0];

  const uri = `https://github.com/amitlin/kubectl-komodor/releases/download/${VERSION}/${TARBALL}`;
  manifestBlocks.push(
    `    - selector:\n` +
      `        matchLabels:\n` +
      `          os: ${os}\n` +
      `          arch: ${arch}\n` +
      `      uri: ${uri}\n` +
      `      sha256: ${SHA256}\n` +
      `      bin: ${PLUGIN_NAME}`,
  );
}

const manifestYaml = `apiVersion: krew.googlecontainertools.github.com/v1alpha2
kind: Plugin
metadata:
  name: komodor
spec:
  version: "${VERSION}"
  homepage: "${homepage}"
  shortDescription: "${shortDescription}"
  description: |
    ${description.split("\n").join("\n    ")}
  platforms:
${manifestBlocks.join("\n")}
`;

await Bun.write(MANIFEST_FILE, manifestYaml);

console.log(`\n📝 Wrote manifest to ${MANIFEST_FILE}`);
console.log("----------------------------------------");
console.log("📦 Generated tarballs:");
const tarballs = await $`ls -la *.tar.gz`;
console.log(tarballs.stdout.toString());
console.log("\n📋 Next steps:");
console.log("1. Upload the tarballs to your GitHub release");
console.log("2. Commit and push the updated manifest if needed");
console.log("3. Note: Alpine musl builds are available but not included in Krew manifest");
