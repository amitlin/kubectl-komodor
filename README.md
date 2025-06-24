# kubectl-komodor

A kubectl plugin to open resources in Komodor directly from the command line.

## Installation

### With Krew (recommended)

```sh
kubectl krew install komodor
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
