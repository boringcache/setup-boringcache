# boringcache/setup-boringcache

Install the BoringCache CLI on GitHub Actions runners.

Use this when you want to call `boringcache` directly instead of using a higher-level BoringCache action.

## Quick start

```yaml
- uses: boringcache/setup-boringcache@v1
  with:
    restore-token: ${{ secrets.BORINGCACHE_RESTORE_TOKEN }}
    save-token: ${{ github.event_name == 'pull_request' && '' || secrets.BORINGCACHE_SAVE_TOKEN }}

- run: boringcache --version
```

## What it does

- Installs a pinned BoringCache CLI version and adds it to `PATH`.
- Verifies checksums by default.
- Reuses the runner tool cache when available.
- Exposes `BORINGCACHE_RESTORE_TOKEN` and `BORINGCACHE_SAVE_TOKEN` when you pass them as inputs.

## Key inputs

| Input | Description |
|-------|-------------|
| `version` | CLI version to install. |
| `restore-token` | Restore-capable token for read-only or mixed workflows. |
| `save-token` | Save-capable token for trusted jobs that should publish cache updates. |
| `token` | Legacy compatibility token. Prefer split tokens for new workflows. |
| `verify-checksum` | Verify the downloaded binary checksum. Default: `true`. |
| `platform` | Override the detected platform asset. |

## Outputs

| Output | Description |
|--------|-------------|
| `version` | Installed CLI version. |
| `path` | Path to the installed binary. |
| `cache-hit` | Whether the binary came from the tool cache. |
| `asset` | Platform-specific asset that was installed. |

## Docs

- [GitHub Actions docs](https://boringcache.com/docs#setup-boringcache)
- [GitHub Actions auth and trust model](https://boringcache.com/docs#actions-auth)
- [CLI docs](https://boringcache.com/docs#cli-run)
