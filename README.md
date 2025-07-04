# kubectl-komodor

A kubectl plugin to interact with Kubernetes resources through Komodor directly from the command line.

> **Note:** The current context name must either be equal to the cluster name in Komodor, or an ARN that ends with the cluster name in Komodor (e.g. `arn:aws:eks:us-east-1:123456789:cluster/your-cluster-name`).

## Features

- **🌐 Resource Navigation**: Open any Kubernetes resource directly in Komodor's web interface
- **🔍 Root Cause Analysis**: Start automated RCA sessions for resources and get detailed analysis results

## Installation

> **Note for Alpine Linux users:**
> 
> The kubectl-komodor binary for Linux (built with Bun) requires the `libstdc++` package to be installed on Alpine Linux. This is because Bun's runtime depends on the C++ standard library, and fully static binaries are not currently supported. You can install it with:
> 
> ```sh
> apk add --no-cache libstdc++
> ```

### With Krew (recommended)

```sh
kubectl krew install komodor
```

### With Krew (Latest)
```sh
kubectl krew install --manifest-url=https://raw.githubusercontent.com/amitlin/kubectl-komodor/refs/heads/main/komodor.yaml
```

### Manual (local build)

```sh
bun install
bun run install-locally
```

## Quick Start

1. **Authenticate** (required for RCA features):
   ```sh
   kubectl komodor auth <your-api-key>
   ```

2. **Open a resource in Komodor**:
   ```sh
   kubectl komodor open deployment my-deploy
   ```

3. **Start a Root Cause Analysis**:
   ```sh
   kubectl komodor rca deployment my-deploy
   ```

## Commands

### `auth` - Authentication

Save your Komodor API key for authenticated operations.

```sh
kubectl komodor auth <api-key>
```

**Examples:**
```sh
kubectl komodor auth your-api-key-here
```

The API key is stored securely in `~/.kubectl-komodor/config.json`.

### `open` - Open Resource in Komodor

Open any Kubernetes resource directly in Komodor's web interface.

```sh
kubectl komodor open <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]
```

**Arguments:**
- `resourceType` - The Kubernetes resource type (e.g., deployment, pod, service)
- `resourceName` - The name of the resource

**Options:**
- `-n, --namespace <ns>` - Specify the namespace (default: current or 'default')
- `-c, --cluster <cluster>` - Specify the cluster name (default: derived from current context)

**Examples:**
```sh
kubectl komodor open ds my-daemonset -n kube-system
kubectl komodor open deployment my-deploy -c my-cluster
kubectl komodor open pod my-pod -n default
kubectl komodor open service my-service
kubectl komodor open ingress my-ingress
```

### `rca` - Root Cause Analysis

Start an automated root cause analysis session for a resource and get detailed results.

```sh
kubectl komodor rca <resourceType> <resourceName> [--namespace <ns>] [--cluster <cluster>]
```

**Arguments:**
- `resourceType` - The Kubernetes resource type (e.g., deployment, pod, service)
- `resourceName` - The name of the resource

**Options:**
- `-n, --namespace <ns>` - Specify the namespace (default: current or 'default')
- `-c, --cluster <cluster>` - Specify the cluster name (default: derived from current context)

**Examples:**
```sh
kubectl komodor rca deployment my-deploy -n default
kubectl komodor rca pod my-pod -c my-cluster
kubectl komodor rca service my-service -n kube-system
```

**Note:** This command requires authentication. Run `kubectl komodor auth <api-key>` first.

## Supported Resource Types

The plugin supports all major Kubernetes resource types with common aliases:

### Workloads
- **Pod** (`pod`, `pods`)
- **Deployment** (`deploy`, `deployment`, `deployments`)
- **ReplicaSet** (`rs`, `replicaset`, `replicasets`)
- **StatefulSet** (`sts`, `statefulset`, `statefulsets`)
- **DaemonSet** (`ds`, `daemonset`, `daemonsets`)
- **Job** (`job`, `jobs`)
- **CronJob** (`cronjob`, `cronjobs`)
- **Argo Rollout** (`argo`, `rollout`, `argo rollout`, `argo rollouts`)

### Network
- **Service** (`svc`, `service`, `services`)
- **Ingress** (`ing`, `ingress`, `ingresses`)
- **Endpoints** (`endpoint`, `endpoints`)
- **EndpointSlice** (`endpointslice`, `endpointslices`)
- **NetworkPolicy** (`netpol`, `networkpolicy`, `networkpolicies`)

### Storage
- **PersistentVolumeClaim** (`pvc`, `pvcs`, `persistentvolumeclaim`, `persistentvolumeclaims`)
- **PersistentVolume** (`pv`, `pvs`, `persistentvolume`, `persistentvolumes`)
- **StorageClass** (`sc`, `storageclass`, `storageclasses`) - *Global resource*

### Configuration
- **ConfigMap** (`cm`, `configmap`, `configmaps`)
- **Secret** (`secret`, `secrets`)
- **ResourceQuota** (`rq`, `resourcequota`, `resourcequotas`)
- **LimitRange** (`limitrange`, `limitranges`)
- **HorizontalPodAutoscaler** (`hpa`, `hpas`, `horizontalpodautoscaler`, `horizontalpodautoscalers`)
- **PodDisruptionBudget** (`pdb`, `pdbs`, `poddisruptionbudget`, `poddisruptionbudgets`)
- **Namespace** (`ns`, `namespace`, `namespaces`) - *Global resource*

### Access Control
- **ServiceAccount** (`sa`, `serviceaccount`, `serviceaccounts`)
- **Role** (`role`, `roles`)
- **RoleBinding** (`rolebinding`, `rolebindings`)
- **ClusterRole** (`clusterrole`, `clusterroles`) - *Global resource*
- **ClusterRoleBinding** (`clusterrolebinding`, `clusterrolebindings`) - *Global resource*

## Development

```sh
bun ./index.ts komodor open deployment my-deploy
```

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

- Use conventional commits.
- See `.pre-commit-config.yaml` for linting and formatting hooks.

## Release

To create a new release for all supported platforms:

1. Make sure your working directory is clean and all changes are committed.
2. Bump the version in your package.json if needed.
3. Run:

```sh
bun run release-all
```

This will:

- Build binaries for all supported platforms (darwin/linux, amd64/arm64)
- Package each binary and the LICENSE file into a tarball
- Generate or update the `komodor.yaml` manifest with the correct SHA256 and URIs

4. Upload the generated tarballs to your GitHub release for the new version.
5. Commit and push the updated `komodor.yaml` manifest if needed.
6. (Optional, but recommended) Update the Krew plugin index:
   - Fork and clone https://github.com/kubernetes-sigs/krew-index
   - Copy your updated `komodor.yaml` manifest to the `plugins/` directory in your fork
   - Open a pull request to the krew-index repository with your changes
   - See the [Krew plugin submission guide](https://krew.sigs.k8s.io/docs/developer-guide/release/) for more details

## License

MIT
