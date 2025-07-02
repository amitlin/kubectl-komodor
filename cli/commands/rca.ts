import { getKubectlConfigValue, getApiKey } from "../utils";
import { resolveResourceType } from "../resourceTypes";
import { parseArgs as parseArgsUtil } from "util";
import chalk from "chalk";

interface RCASessionRequest {
    kind: string;
    name: string;
    namespace: string;
    clusterName: string;
}

interface RCASessionResponse {
    sessionId: string;
}

interface RCASessionResult {
    sessionId: string;
    evidenceCollection?: Array<{
        query: string;
        snippet: string;
    }>;
    isComplete?: boolean;
    isFailed?: boolean;
    isStuck?: boolean;
    operations?: string[];
    problemShort?: string;
    recommendation?: string;
    whatHappened?: string[];
}

function printHelp() {
    console.log(`kubectl komodor rca <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]

Start a root cause analysis session for the resource.

Arguments:
  resourceType    The Kubernetes resource type (e.g., deployment, pod, service)
  resourceName    The name of the resource

Options:
  -h, --help              Show this help message
  -n, --namespace <ns>    Specify the namespace (default: current or 'default')
  -c, --cluster <cluster> Specify the cluster name (default: derived from current context)

Examples:
  kubectl komodor rca deployment my-deploy -n default
  kubectl komodor rca pod my-pod -c my-cluster
  kubectl komodor rca service my-service -n kube-system

Note: This command requires authentication. Run 'kubectl komodor auth <api-key>' first.
`);
}

function parseRcaArgs() {
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
            "Usage: kubectl komodor rca <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]",
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

async function rcaCommand() {
    const { resourceTypeObj, resourceName, namespace, cluster } = parseRcaArgs();

    const apiBaseUrl = process.env.KOMODOR_API_URL || "https://api.komodor.com";

    // Get API key from config
    const apiKey = await getApiKey();
    if (!apiKey) {
        console.error(chalk.red("❌ Error: API key not found. Please run 'kubectl komodor auth <api-key>' first"));
        process.exit(1);
    }

    console.log(chalk.blue(`🔍 Starting RCA session for ${chalk.bold(resourceTypeObj.canonical)} '${chalk.cyan(resourceName)}' in namespace '${chalk.yellow(namespace)}' on cluster '${chalk.green(cluster)}'...`));

    // Step 1: Start RCA session
    const sessionRequest: RCASessionRequest = {
        kind: resourceTypeObj.canonical,
        name: resourceName,
        namespace: namespace,
        clusterName: cluster,
    };

    try {
        const sessionResponse = await fetch(`${apiBaseUrl}/api/v2/klaudia/rca/sessions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                'X-API-KEY': apiKey
            },
            body: JSON.stringify(sessionRequest),
        });
        if (!sessionResponse.ok) {
            throw new Error(`Failed to start RCA session:  ${sessionResponse.status} ${sessionResponse.statusText}`);
        }

        const sessionData = await sessionResponse.json() as RCASessionResponse;
        const sessionId = sessionData.sessionId;

        console.log(chalk.green(`✅ RCA session started with ID: ${chalk.bold(sessionId)}`));
        console.log(chalk.blue("⏳ Polling for results..."));

        // Step 2: Poll for results
        let attempts = 0;
        const maxAttempts = 60; // 5 minutes with 5-second intervals
        const pollInterval = 5000; // 5 seconds
        let printedOperations = new Set<string>();

        while (attempts < maxAttempts) {
            attempts++;

            try {
                const resultResponse = await fetch(`${apiBaseUrl}/api/v2/klaudia/rca/sessions/${sessionId}`, {
                    headers: {
                        'X-API-KEY': apiKey
                    }
                });

                if (!resultResponse.ok) {
                    throw new Error(`Failed to fetch RCA results: ${resultResponse.status} ${resultResponse.statusText}`);
                }

                const result = await resultResponse.json() as RCASessionResult;

                // Show progress: print only new operations
                if (result.operations && result.operations.length > 0) {
                    for (const op of result.operations) {
                        if (!printedOperations.has(op)) {
                            console.log(chalk.yellow(`🔄 ${op}...`));
                            printedOperations.add(op);
                        }
                    }
                }

                // Check if analysis is complete
                if (result.isComplete || result.isFailed || result.isStuck) {
                    console.log("\n"); // New line after progress

                    if (result.isFailed) {
                        console.log(chalk.red("❌ RCA analysis failed"));
                        return;
                    }

                    if (result.isStuck) {
                        console.log(chalk.yellow("⚠️  RCA analysis got stuck"));
                        return;
                    }

                    if (result.isComplete) {
                        // Web UI style output
                        console.log("\n" + chalk.cyan("═".repeat(80)));

                        // What Happened (Problem)
                        if (result.problemShort) {
                            console.log(`\n${chalk.bold.blue("📊 What Happened:")}\n  ${chalk.red("🚨")} ${chalk.bold(result.problemShort)}`);
                        }
                        if (result.whatHappened && result.whatHappened.length > 0) {
                            result.whatHappened.forEach((item, index) => {
                                console.log(`  ${chalk.cyan(index + 1)}. ${item}`);
                            });
                        }

                        // Related Evidence
                        if (result.evidenceCollection && result.evidenceCollection.length > 0) {
                            console.log(`\n${chalk.bold.blue("🔍 Related Evidence:")}`);
                            result.evidenceCollection.forEach((evidence, index) => {
                                console.log(`  ${chalk.cyan(index + 1)}. ${chalk.gray("From:")} ${chalk.italic(evidence.query)}`);
                                // Print snippet as a code block
                                const snippet = evidence.snippet
                                    .split("\n")
                                    .map(line => `    ${line}`)
                                    .join("\n");
                                console.log(chalk.bgGray.white(snippet) + "\n");
                            });
                        }

                        // Suggested Remediation
                        if (result.recommendation) {
                            console.log(`${chalk.bold.blue("💡 Suggested Remediation:")}\n  ${chalk.green(result.recommendation)}`);
                        }

                        console.log("\n" + chalk.cyan("═".repeat(80)));
                        return;
                    }
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, pollInterval));

            } catch (error) {
                console.error(chalk.red(`\n❌ Error polling RCA results: ${error}`));
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }

        console.log(chalk.yellow("\n⏰ RCA analysis timed out after 5 minutes"));

    } catch (error) {
        console.error(chalk.red(`❌ Error: ${error}`));
        process.exit(1);
    }
}

export { rcaCommand }; 