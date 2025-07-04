#!/usr/bin/env bun

import { $ } from "bun";
const PLUGIN_NAME = "kubectl-komodor";
const ENTRYPOINT = "index.ts";
const VERSION = Bun.argv[2];
const MANIFEST_FILE = "komodor.yaml";

if (!VERSION) {
  console.error("Usage: bun release-all.ts <new-version>");
  process.exit(1);
}

const platforms = [
  { os: "darwin", arch: "arm64", target: "bun-darwin-arm64" },
  { os: "darwin", arch: "amd64", target: "bun-darwin-x64" },
  { os: "linux", arch: "arm64", target: "bun-linux-arm64" },
  { os: "linux", arch: "amd64", target: "bun-linux-x64" },
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

const manifestBlocks: string[] = [];

for (const { os, arch, target } of platforms) {
  const OUTFILE = `${PLUGIN_NAME}`;
  const TARBALL = `${PLUGIN_NAME}-${os}-${arch}.tar.gz`;

  console.log(`Building for ${os}/${arch}...`);
  if (os === "linux") {
    console.log(`Building ${os}/${arch} binary using Docker for Alpine compatibility...`);
    const dockerfileContent = `FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lockb ./
COPY tsconfig.json ./
RUN bun install
COPY . .
RUN bun build index.ts --compile --target=${target} --outfile=${OUTFILE} --minify
CMD [\"cat\", \"${OUTFILE}\"]`;
    await Bun.write("Dockerfile.build", dockerfileContent);
    await $`docker build -f Dockerfile.build -t temp-builder .`;
    await $`docker create --name temp-container temp-builder`;
    await $`docker cp temp-container:/app/${OUTFILE} ./${OUTFILE}`;
    await $`docker rm temp-container`;
    await $`docker rmi temp-builder`;
    await $`rm Dockerfile.build`;
  } else {
    await $`bun build ${ENTRYPOINT} --compile --target=${target} --outfile=${OUTFILE} --minify`;
  }

  console.log(`Packaging ${OUTFILE} and LICENSE into ${TARBALL}...`);
  await $`tar czf ${TARBALL} ${OUTFILE} LICENSE`;

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

console.log(`\nWrote manifest to ${MANIFEST_FILE}`);
console.log("----------------------------------------");
console.log(
  "Upload the tarballs to your GitHub release, then update your manifest if needed.",
);
