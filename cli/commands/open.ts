import { getKubectlConfigValue } from "../utils";
import { $ } from "bun";

export async function openCommand(
  resourceTypeObj: any,
  resourceName: string,
  namespace: string,
  cluster: string,
) {
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

  console.log(`Opening Komodor URL: ${url}`);
  await $`open ${url}`;
}
