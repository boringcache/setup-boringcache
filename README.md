# boringcache/setup-boringcache

Install the BoringCache CLI on a GitHub Actions runner.

## When to use it

Start here when you want to call `boringcache` yourself or you need a workflow the higher-level actions do not cover.

## Quick start

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    restore-token: ${{ secrets.BORINGCACHE_RESTORE_TOKEN }}
    save-token: ${{ github.event_name == 'pull_request' && '' || secrets.BORINGCACHE_SAVE_TOKEN }}

- run: boringcache --version
```

## Trust model

- Pass `restore-token` to every job that should read cache.
- Pass `save-token` only to trusted jobs that should publish cache updates.
- `token` is legacy compatibility only for older workflows.
- `require-server-signature` defaults to `true` so downstream CLI commands verify publication signatures by default.

## What it handles

- Installs a pinned BoringCache CLI version and adds it to `PATH`.
- Verifies checksums by default.
- Reuses the runner tool cache when available.
- Exposes `BORINGCACHE_RESTORE_TOKEN` and `BORINGCACHE_SAVE_TOKEN` when you pass them as inputs.
- Enables strict server signature verification by default for downstream `boringcache` commands.

## Key inputs

| Input | Description |
|-------|-------------|
| `version` | CLI version to install. |
| `restore-token` | Restore-capable token for read-only or mixed workflows. |
| `save-token` | Save-capable token for trusted jobs that should publish cache updates. |
| `token` | Legacy compatibility token. Prefer split tokens for new workflows. |
| `require-server-signature` | Export `BORINGCACHE_REQUIRE_SERVER_SIGNATURE`. Default: `true`. |
| `verify-checksum` | Verify the downloaded binary checksum. Default: `true`. |
| `platform` | Override the detected platform asset. |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Installed CLI version. |
| `path` | Path to the installed binary. |
| `cache-hit` | Whether the binary came from the tool cache. |
| `asset` | Platform-specific asset that was installed. |

## Learn more

- [GitHub Actions docs](https://boringcache.com/docs#setup-boringcache)
- [GitHub Actions auth and trust model](https://boringcache.com/docs#actions-auth)
- [CLI docs](https://boringcache.com/docs#cli-run)
