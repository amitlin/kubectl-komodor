import { getKubectlConfigValue } from "../utils";
import { resolveResourceType } from "../resourceTypes";
import { parseArgs as parseArgsUtil } from "util";
import { $ } from "bun";
import chalk from "chalk";

function printHelp() {
  console.log(`kubectl komodor open <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]

Open the resource in Komodor.

Arguments:
  resourceType    The Kubernetes resource type (e.g., deployment, pod, service)
  resourceName    The name of the resource

Options:
  -h, --help              Show this help message
  -n, --namespace <ns>    Specify the namespace (default: current or 'default')
  -c, --cluster <cluster> Specify the cluster name (default: derived from current context)

Examples:
  kubectl komodor open ds my-daemonset -n kube-system
  kubectl komodor open deployment my-deploy -c my-cluster
  kubectl komodor open pod my-pod -n default
`);
}

function parseOpenArgs() {
  const { values, positionals } = parseArgsUtil({
    args: Bun.argv.slice(2),
    options: {
      namespace: { type: "string" },
      n: { type: "string" },
      help: { type: "boolean" },
      h: { type: "boolean" },
      cluster: { type: "string" },
      c: { type: "string" },
    },
    strict: false,
    allowPositionals: true,
  });

  if (values.help || values.h) {
    printHelp();
    process.exit(0);
  }

  if (positionals.length < 3) {
    console.error(
      "Usage: kubectl komodor open <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]",
    );
    process.exit(1);
  }

  const resourceTypeInput = positionals[1];
  const resourceTypeObj = resolveResourceType(resourceTypeInput);
  if (!resourceTypeObj) {
    // Import RESOURCE_TYPES for error message
    const { RESOURCE_TYPES } = require("../resourceTypes");
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
    getKubectlConfigValue("view --minify --output 'jsonpath={..namespace}'")
  if (resourceTypeObj.global) {
    namespace = "";
  }

  let cluster =
    (typeof values.cluster === "string" ? values.cluster : undefined) ||
    (typeof values.c === "string" ? values.c : undefined);
  if (!cluster) {
    const clusterContext = getKubectlConfigValue("current-context");
    cluster = clusterContext.includes("/")
      ? clusterContext.split("/").pop()!
      : clusterContext;
  }

  return { resourceTypeObj, resourceName, namespace, cluster };
}

async function openCommand() {
  const { resourceTypeObj, resourceName, namespace, cluster } = parseOpenArgs();
  
  const workspaceId = `cluster-${cluster}`;

  const now = Date.now();
  const hourAgo = now - 3600_000;

  const drawers = encodeURIComponent(
    JSON.stringify([
      {
        index: 0,
        drawerType: "ResourceDrawerByData",
        cluster,
        namespace,
        resourceType: resourceTypeObj.canonical,
        resourceName,
        buildPreloadResource: true,
      },
    ]),
  );

  const url =
    `https://app.komodor.com/main/resources/${resourceTypeObj.category}/${resourceTypeObj.urlPath}/${cluster}` +
    `?drawers=${drawers}` +
    `&workspaceId=${workspaceId}` +
    `&deleted-pods-timeWindow=${hourAgo}-${now}&deleted-pods-timeframe=hour`;

  console.log(chalk.blue(`🌐 Opening Komodor URL: ${chalk.underline(url)}`));
  await $`open ${url}`;
}

export { openCommand };
