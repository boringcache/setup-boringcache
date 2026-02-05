# boringcache/setup-boringcache

**Cache once. Reuse everywhere.**

BoringCache is a universal build artifact cache for CI, Docker, and local development. It stores and restores directories you choose so build outputs, dependencies, and tool caches can be reused across environments.

BoringCache does not run builds and is not tied to any build tool. It works with any language, framework, or workflow by caching directories explicitly selected by the user.

Caches are content-addressed and verified before restore. If identical content already exists, uploads are skipped. The same cache can be reused in GitHub Actions, Docker/BuildKit, and on developer machines using the same CLI.

This action installs the BoringCache CLI in GitHub Actions runners. It does not perform any caching by itself. Use this when you want to call `boringcache save` / `boringcache restore` directly instead of using the cache actions.

## Quick start

```yaml
steps:
  - uses: actions/checkout@v4

  - uses: boringcache/setup-boringcache@v1

  - run: boringcache --version
```

## Mental model

This action installs the BoringCache CLI and adds it to `PATH`.

- It does not restore or save caches by itself.
- Use the CLI directly or pair with other BoringCache actions.

Checksum verification is enabled by default. Checksums are embedded for known versions; if a version lacks an embedded checksum, a warning is logged.

## Common patterns

### Basic install

```yaml
- uses: boringcache/setup-boringcache@v1
```

### Version pinning

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    version: v1.0.0
```

### With API token

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    token: ${{ secrets.BORINGCACHE_API_TOKEN }}

- run: boringcache restore my-org/my-project "deps:node_modules"
```

### Disable checksum verification (not recommended)

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    verify-checksum: false
```

### Complete example

```yaml
name: Build
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: boringcache/setup-boringcache@v1
        with:
          version: v1.0.0
          token: ${{ secrets.BORINGCACHE_API_TOKEN }}

      - name: Restore cache
        run: boringcache restore my-org/my-project "node-deps:node_modules"

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Save cache
        run: boringcache save my-org/my-project "node-deps:node_modules"
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `version` | No | `v1.0.0` | Version of BoringCache CLI to install. |
| `token` | No | - | API token to set as `BORINGCACHE_API_TOKEN`. |
| `skip-cache` | No | `false` | Skip using the tool cache (always download fresh). |
| `verify-checksum` | No | `true` | Verify SHA256 checksum of downloaded binary. |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Installed BoringCache CLI version |
| `path` | Path to the installed binary |
| `cache-hit` | Whether the binary was restored from cache |

## Platform behavior

Supported platforms:

| Platform | Architecture |
|----------|--------------|
| Linux | x64, arm64 |
| macOS | arm64 |
| Windows | x64 |

## Environment variables

| Variable | Description |
|----------|-------------|
| `BORINGCACHE_API_TOKEN` | API token for authentication (set when `token` input is provided) |

## Troubleshooting

- Checksum verification failed: pin to a supported version or disable `verify-checksum` (not recommended).
- Unsupported platform: verify the runner OS/arch is in the supported matrix.

## Release notes

See https://github.com/boringcache/setup-boringcache/releases.

## License

MIT
