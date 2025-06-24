#!/usr/bin/env bun

import { parseArgs } from "util";
import { resolveResourceType } from "./cli/resourceTypes";
import { getKubectlConfigValue } from "./cli/utils";
import { openCommand } from "./cli/commands/open";

function printHelp() {
  console.log(`kubectl komodor <command> <resourceType> <resourceName> [--namespace <ns>]

Commands:
  open        Open the resource in Komodor

Resource Types:
  Supports all major Kubernetes resource types and common aliases (e.g. ds for DaemonSet, deploy for Deployment, etc.)
  Use -- to see the full list in the code or documentation.

Options:
  -h, --help  Show this help message
  -n, --namespace <ns>  Specify the namespace (default: current or 'default')

Examples:
  kubectl komodor open ds my-daemonset -n kube-system
  kubectl komodor open deployment my-deploy
`);
}

function parseArgsWithBun() {
  const { values, positionals } = parseArgs({
    args: Bun.argv.slice(2),
    options: {
      namespace: { type: "string" },
      n: { type: "string" },
      help: { type: "boolean" },
      h: { type: "boolean" },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help || values.h) {
    printHelp();
    process.exit(0);
  }

  if (positionals.length < 1) {
    console.error(
      "Usage: kubectl komodor <command> <resourceType> <resourceName> [--namespace <ns>]",
    );
    process.exit(1);
  }

  const command = positionals[0];
  if (!["open"].includes(command)) {
    console.error(
      `Unsupported command: '${command}'. Supported commands: open`,
    );
    process.exit(1);
  }

  if (positionals.length < 3) {
    console.error(
      "Usage: kubectl komodor open <resourceType> <resourceName> [--namespace <ns>]",
    );
    process.exit(1);
  }

  const resourceTypeInput = positionals[1];
  const resourceTypeObj = resolveResourceType(resourceTypeInput);
  if (!resourceTypeObj) {
    // Import RESOURCE_TYPES for error message
    const { RESOURCE_TYPES } = require("./cli/resourceTypes");
    console.error(
      `Unsupported resource type: '${resourceTypeInput}'. Supported types: ` +
        (RESOURCE_TYPES as any[]).map((t: any) => t.aliases[0]).join(", "),
    );
    process.exit(1);
  }

  const resourceName = positionals[2];
  let namespace =
    (typeof values.namespace === "string" ? values.namespace : undefined) ||
    (typeof values.n === "string" ? values.n : undefined) ||
    getKubectlConfigValue("view --minify --output 'jsonpath={..namespace}'") ||
    "default";
  if (resourceTypeObj.global) {
    namespace = "";
  }

  return { command, resourceTypeObj, resourceName, namespace };
}

async function main() {
  const { command, resourceTypeObj, resourceName, namespace } =
    parseArgsWithBun();
  switch (command) {
    case "open":
      await openCommand(resourceTypeObj, resourceName, namespace);
      break;
    default:
      console.error(
        `Unsupported command: '${command}'. Supported commands: open`,
      );
      process.exit(1);
  }
}

main();
