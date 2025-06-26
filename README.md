# kubectl-komodor

A kubectl plugin to open resources in Komodor directly from the command line.

> **Note:** The current context name must either be equal to the cluster name in Komodor, or an ARN that ends with the cluster name in Komodor (e.g. `arn:aws:eks:us-east-1:123456789:cluster/your-cluster-name`).

## Installation

### With Krew (recommended)

```sh
kubectl krew install --manifest-url=https://raw.githubusercontent.com/amitlin/kubectl-komodor/refs/heads/main/kubectl-komodor.yaml
```

### Manual (local build)

```sh
bun install
bun run install-locally
```

## Usage

```sh
kubectl komodor open <resourceType> <resourceName> [--namespace <ns>]
```

- Supports all major Kubernetes resource types and common aliases (e.g. `ds` for DaemonSet, `deploy` for Deployment, etc.)
- Use `--help` for more info.

## Examples

```sh
kubectl komodor open ds my-daemonset -n kube-system
kubectl komodor open deployment my-deploy
```

## Development

```sh
bun ./index.ts komodor open deployment my-deploy
```

## Contributing

Pull requests are welcome! Please open an issue first to discuss major changes.

- Use conventional commits.
- See `.pre-commit-config.yaml` for linting and formatting hooks.

## License

MIT
