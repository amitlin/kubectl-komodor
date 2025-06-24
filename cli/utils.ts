import { execSync } from "child_process";

export function getKubectlConfigValue(args: string): string {
  try {
    return execSync(`kubectl config ${args}`, { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}
