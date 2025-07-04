#!/usr/bin/env bun

import { $ } from "bun";

interface BuildTarget {
  name: string;
  platform: string;
  arch: string;
  baseImage: string;
  target: string;
  useDocker: boolean;
}

const buildTargets: BuildTarget[] = [
  {
    name: "alpine-linux-arm64",
    platform: "linux",
    arch: "arm64",
    baseImage: "alpine:latest",
    target: "bun-linux-arm64",
    useDocker: true,
  },
  {
    name: "alpine-linux-amd64",
    platform: "linux",
    arch: "amd64",
    baseImage: "alpine:latest",
    target: "bun-linux-x64",
    useDocker: true,
  },
  {
    name: "debian-linux-arm64",
    platform: "linux",
    arch: "arm64",
    baseImage: "debian:bullseye-slim",
    target: "bun-linux-arm64",
    useDocker: true,
  },
  {
    name: "debian-linux-amd64",
    platform: "linux",
    arch: "amd64",
    baseImage: "debian:bullseye-slim",
    target: "bun-linux-x64",
    useDocker: true,
  },
  {
    name: "darwin-amd64",
    platform: "darwin",
    arch: "amd64",
    baseImage: "",
    target: "bun-darwin-x64",
    useDocker: false,
  },
  {
    name: "darwin-arm64",
    platform: "darwin",
    arch: "arm64",
    baseImage: "",
    target: "bun-darwin-arm64",
    useDocker: false,
  },
];

const PLUGIN_NAME = "kubectl-komodor";
const ENTRYPOINT = "index.ts";

async function runDockerBuild(target: BuildTarget): Promise<void> {
  const containerName = `build-${target.name}`;
  const outputFile = `${PLUGIN_NAME}`;
  
  console.log(`\n🚀 Building ${target.name}...`);
  
  try {
    // Build Docker image using existing Dockerfile
    console.log(`📦 Building Docker image for ${target.name}...`);
    await $`docker build -f build/Dockerfile.${target.name} -t ${containerName}-img .`;

    // Create container
    console.log(`🔧 Creating container for ${target.name}...`);
    await $`docker create --name ${containerName} ${containerName}-img`;

    // Copy binary from container
    console.log(`📋 Copying binary from container...`);
    await $`docker cp ${containerName}:/app/${outputFile} ./${outputFile}`;

    // Create tarball
    console.log(`📦 Creating tarball...`);
    await $`tar czf ${outputFile}-${target.platform}-${target.arch}${target.baseImage.includes('alpine') ? '-musl' : ''}.tar.gz ${outputFile} LICENSE`;

    console.log(`✅ Successfully built ${target.name}`);
  } catch (error) {
    console.error(`❌ Failed to build ${target.name}:`, error);
    throw error;
  } finally {
    // Cleanup
    try {
      await $`docker rm ${containerName}`;
      await $`docker rmi ${containerName}-img`;
      await $`rm ${outputFile}`;
    } catch (cleanupError) {
      console.warn(`⚠️  Cleanup warning for ${target.name}:`, cleanupError);
    }
  }
}

async function runNativeBuild(target: BuildTarget): Promise<void> {
  const outputFile = `${PLUGIN_NAME}`;
  
  console.log(`\n🚀 Building ${target.name} natively...`);
  
  try {
    // Build the binary using bun
    console.log(`📦 Building binary for ${target.target}...`);
    await $`bun build ${ENTRYPOINT} --compile --target=${target.target} --outfile=${outputFile} --minify`;

    // Create tarball
    console.log(`📦 Creating tarball...`);
    await $`tar czf ${outputFile}-${target.platform}-${target.arch}.tar.gz ${outputFile} LICENSE`;

    console.log(`✅ Successfully built ${target.name}`);
  } catch (error) {
    console.error(`❌ Failed to build ${target.name}:`, error);
    throw error;
  } finally {
    // Cleanup
    try {
      await $`rm ${outputFile}`;
    } catch (cleanupError) {
      console.warn(`⚠️  Cleanup warning for ${target.name}:`, cleanupError);
    }
  }
}

async function main() {
  console.log("🔨 Starting multi-platform build process...");
  console.log(`📋 Building ${buildTargets.length} targets:`);
  
  for (const target of buildTargets) {
    console.log(`  - ${target.name} (${target.platform}/${target.arch})`);
  }

  const results: Array<{ target: BuildTarget; success: boolean; error?: string }> = [];

  for (const target of buildTargets) {
    try {
      if (target.useDocker) {
        await runDockerBuild(target);
      } else {
        await runNativeBuild(target);
      }
      results.push({ target, success: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      results.push({ target, success: false, error: errorMessage });
    }
  }

  // Summary
  console.log("\n📊 Build Summary:");
  console.log("==================");
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful builds: ${successful.length}`);
  for (const result of successful) {
    console.log(`  - ${result.target.name}`);
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed builds: ${failed.length}`);
    for (const result of failed) {
      console.log(`  - ${result.target.name}: ${result.error}`);
    }
  }

  // List generated artifacts
  console.log("\n📦 Generated artifacts:");
  const artifacts = await $`ls -la *.tar.gz`;
  console.log(artifacts.stdout.toString());

  if (failed.length > 0) {
    process.exit(1);
  } else {
    console.log("\n🎉 All builds completed successfully!");
  }
}

// Handle cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Build interrupted, cleaning up...');
  try {
    // Clean up any running containers
    await $`docker ps -a --filter "name=build-" --format "{{.Names}}" | xargs -r docker rm`;
    await $`docker images --filter "reference=build-*" --format "{{.Repository}}:{{.Tag}}" | xargs -r docker rmi`;
  } catch (error) {
    console.warn('⚠️  Cleanup warning:', error);
  }
  process.exit(1);
});

main().catch((error) => {
  console.error('💥 Build script failed:', error);
  process.exit(1);
});
