#!/usr/bin/env bun

import { parseArgs } from "util";
import { openCommand } from "./cli/commands/open";
import { rcaCommand } from "./cli/commands/rca";
import { authCommand } from "./cli/commands/auth";

function printHelp() {
  console.log(`kubectl komodor <command> [options]

Commands:
  auth        Save your Komodor API key for authentication
  open        Open the resource in Komodor
  rca         Start a root cause analysis session for the resource

Examples:
  kubectl komodor auth <api-key>
  kubectl komodor open ds my-daemonset -n kube-system
  kubectl komodor open deployment my-deploy -c my-cluster
  kubectl komodor rca deployment my-deploy -n default

Use 'kubectl komodor <command> --help' for command-specific help.
`);
}

async function main() {
  const { positionals } = parseArgs({
    args: Bun.argv.slice(2),
    strict: false,
    allowPositionals: true,
  });

  if (positionals.length < 1) {
    printHelp();
    process.exit(1);
  }

  const command = positionals[0];

  switch (command) {
    case "auth":
      await authCommand();
      break;
    case "open":
      await openCommand();
      break;
    case "rca":
      await rcaCommand();
      break;
    default:
      console.error(
        `Unsupported command: '${command}'. Supported commands: auth, open, rca`,
      );
      console.error("Use 'kubectl komodor --help' for more information");
      process.exit(1);
  }
}

main();
