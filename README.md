# boringcache/setup-boringcache

Install the BoringCache CLI on GitHub Actions runners. Use this when you want to call `boringcache save` / `boringcache restore` directly instead of using the language-specific actions.

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
    version: v1.3.0
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
          version: v1.3.0
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
| `version` | No | `v1.3.0` | Version of BoringCache CLI to install. |
| `token` | No | - | API token to set as `BORINGCACHE_API_TOKEN`. |
| `skip-cache` | No | `false` | Skip using the tool cache (always download fresh). |
| `verify-checksum` | No | `true` | Verify SHA256 checksum of downloaded binary. |
| `platform` | No | auto-detect | Override platform binary (e.g., `ubuntu-24.04-amd64`, `alpine-amd64`, `debian-bookworm-arm64`). |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Installed BoringCache CLI version |
| `path` | Path to the installed binary |
| `cache-hit` | Whether the binary was restored from cache |
| `asset` | The platform-specific asset name that was downloaded |

### Platform override

By default, the action auto-detects the runner's OS and architecture (Linux distro via `/etc/os-release`, macOS version via `sw_vers`). Use the `platform` input to force a specific binary:

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    platform: ubuntu-22.04-amd64
```

## Platform behavior

Supported platforms:

| Platform | Architecture | Asset example |
|----------|--------------|---------------|
| Ubuntu | x64, arm64 | `boringcache-ubuntu-24.04-amd64` |
| Debian | x64, arm64 | `boringcache-debian-bookworm-amd64` |
| Alpine | x64, arm64 | `boringcache-alpine-amd64` |
| macOS | arm64 | `boringcache-macos-15-arm64` |
| Windows | x64 | `boringcache-windows-2022-amd64.exe` |

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
