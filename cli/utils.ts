import { execSync } from "child_process";
import { readFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

export function getKubectlConfigValue(command: string): string {
  try {
    return execSync(`kubectl config ${command}`, { encoding: "utf8" }).trim();
  } catch (error) {
    return "";
  }
}

export async function getApiKey(): Promise<string | null> {
  try {
    const configPath = join(homedir(), ".kubectl-komodor", "config.json");
    const configData = await readFile(configPath, "utf8");
    const config = JSON.parse(configData);
    return config.apiKey || null;
  } catch (error) {
    return null;
  }
}
