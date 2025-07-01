# kubectl-komodor

A kubectl plugin to open resources in Komodor directly from the command line.

> **Note:** The current context name must either be equal to the cluster name in Komodor, or an ARN that ends with the cluster name in Komodor (e.g. `arn:aws:eks:us-east-1:123456789:cluster/your-cluster-name`).

## Installation

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

## Release

To create a new release for all supported platforms:

1. Make sure your working directory is clean and all changes are committed.
2. Bump the version in your package.json if needed.
3. Run:

```sh
bun run release-all <new-version>
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
