import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import { parseArgs as parseArgsUtil } from "util";
import chalk from "chalk";

function printHelp() {
    console.log(`kubectl komodor auth <api-key>

Save your Komodor API key for authentication.

Arguments:
  api-key     Your Komodor API key

Examples:
  kubectl komodor auth your-api-key-here

Options:
  -h, --help  Show this help message
`);
}

function parseAuthArgs() {
    const { values, positionals } = parseArgsUtil({
        args: Bun.argv.slice(2),
        options: {
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
        console.error("Error: API key is required");
        console.error("Usage: kubectl komodor auth <api-key>");
        process.exit(1);
    }

    return { apiKey: positionals[1] };
}

async function authCommand() {
    const { apiKey } = parseAuthArgs();

      if (!apiKey || apiKey.trim() === "") {
    console.error(chalk.red("❌ Error: API key is required"));
    console.error(chalk.gray("Usage: kubectl komodor auth <api-key>"));
    process.exit(1);
  }

    try {
        // Create .komodor directory in user's home directory
        const komodorDir = join(homedir(), ".kubectl-komodor");
        await mkdir(komodorDir, { recursive: true });

        // Save API key to config file
        const configPath = join(komodorDir, "config.json");
        const config = { apiKey: apiKey.trim() };

            await writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(chalk.green("✅ API key saved successfully"));
    console.log(chalk.blue(`📁 Configuration saved to: ${chalk.italic(configPath)}`));
      } catch (error) {
    console.error(chalk.red(`❌ Error saving API key: ${error}`));
    process.exit(1);
  }
}

export { authCommand }; 