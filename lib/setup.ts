import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as tc from '@actions/tool-cache';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getChecksum, hasChecksums } from './checksums';

const TOOL_NAME = 'boringcache';
const GITHUB_RELEASES_BASE = 'https://github.com/boringcache/cli/releases/download';

interface PlatformInfo {
  os: string;
  arch: string;
  assetName: string;
  isWindows: boolean;
}

function getPlatformInfo(): PlatformInfo {
  const runnerOS = process.env.RUNNER_OS || os.platform();
  const runnerArch = process.env.RUNNER_ARCH || os.arch();

  let normalizedOS = runnerOS;
  let normalizedArch = runnerArch;

  if (runnerOS === 'darwin' || runnerOS === 'Darwin') {
    normalizedOS = 'macOS';
  } else if (runnerOS === 'win32' || runnerOS === 'Windows') {
    normalizedOS = 'Windows';
  } else if (runnerOS === 'linux' || runnerOS === 'Linux') {
    normalizedOS = 'Linux';
  }

  if (runnerArch === 'x64' || runnerArch === 'X64' || runnerArch === 'amd64') {
    normalizedArch = 'X64';
  } else if (runnerArch === 'arm64' || runnerArch === 'ARM64' || runnerArch === 'aarch64') {
    normalizedArch = 'ARM64';
  }

  const isWindows = normalizedOS === 'Windows';
  let assetName: string;

  switch (normalizedOS) {
    case 'Linux':
      assetName = normalizedArch === 'ARM64' ? 'boringcache-linux-arm64' : 'boringcache-linux-amd64';
      break;
    case 'macOS':
      assetName = 'boringcache-macos-14-arm64';
      break;
    case 'Windows':
      assetName = 'boringcache-windows-2022-amd64.exe';
      break;
    default:
      throw new Error(`Unsupported platform: OS=${runnerOS}, ARCH=${runnerArch}`);
  }

  return {
    os: normalizedOS.toLowerCase(),
    arch: normalizedArch.toLowerCase(),
    assetName,
    isWindows,
  };
}

function getDownloadUrl(version: string, assetName: string): string {
  return `${GITHUB_RELEASES_BASE}/${version}/${assetName}`;
}

function getChecksumsUrl(version: string): string {
  return `${GITHUB_RELEASES_BASE}/${version}/SHA256SUMS`;
}

/**
 * Parse SHA256SUMS file content and extract checksum for a specific asset
 * Format: <sha256>  <filename> (two spaces between hash and filename)
 * or: <sha256> <filename> (single space)
 */
function parseChecksums(content: string, assetName: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match either "hash  filename" or "hash filename"
    const match = trimmed.match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (match) {
      const [, hash, filename] = match;
      // Match exact filename or filename at end of path
      if (filename === assetName || filename.endsWith(`/${assetName}`)) {
        return hash.toLowerCase();
      }
    }
  }
  return null;
}

/**
 * Fetch checksum from SHA256SUMS file in the release
 */
async function fetchChecksumFromRelease(version: string, assetName: string): Promise<string | null> {
  const checksumsUrl = getChecksumsUrl(version);
  core.debug(`Fetching checksums from: ${checksumsUrl}`);

  try {
    const checksumsPath = await tc.downloadTool(checksumsUrl);
    const content = await fs.promises.readFile(checksumsPath, 'utf-8');
    return parseChecksums(content, assetName);
  } catch (error) {
    core.debug(`Failed to fetch SHA256SUMS: ${error instanceof Error ? error.message : error}`);
    return null;
  }
}

/**
 * Get expected checksum for an asset, trying multiple sources:
 * 1. Hardcoded checksums (for known versions)
 * 2. Dynamic fetch from SHA256SUMS in release (for new versions)
 */
async function getExpectedChecksum(version: string, assetName: string): Promise<string | null> {
  // First, try hardcoded checksums (fast, no network request)
  const hardcodedChecksum = getChecksum(version, assetName);
  if (hardcodedChecksum) {
    core.debug(`Using hardcoded checksum for ${version}/${assetName}`);
    return hardcodedChecksum;
  }

  // If version has hardcoded checksums but not for this asset, warn
  if (hasChecksums(version)) {
    core.warning(`No hardcoded checksum for asset '${assetName}' in version ${version}, fetching from release...`);
  } else {
    core.info(`Version ${version} not in hardcoded checksums, fetching from release...`);
  }

  // Fetch from SHA256SUMS in the release
  const fetchedChecksum = await fetchChecksumFromRelease(version, assetName);
  if (fetchedChecksum) {
    core.debug(`Fetched checksum from release: ${fetchedChecksum}`);
    return fetchedChecksum;
  }

  return null;
}

async function verifyFileChecksum(filePath: string, expectedChecksum: string): Promise<void> {
  const fileBuffer = await fs.promises.readFile(filePath);
  const hash = crypto.createHash('sha256');
  hash.update(fileBuffer);
  const actualChecksum = hash.digest('hex');

  if (actualChecksum !== expectedChecksum) {
    throw new Error(
      `Checksum verification failed. Expected: ${expectedChecksum}, Actual: ${actualChecksum}`
    );
  }

  core.info(`Checksum verified: ${actualChecksum}`);
}

async function downloadAndInstall(
  version: string,
  platform: PlatformInfo,
  verifyChecksumEnabled: boolean
): Promise<string> {
  const downloadUrl = getDownloadUrl(version, platform.assetName);
  core.info(`Downloading BoringCache CLI from: ${downloadUrl}`);

  const downloadedPath = await tc.downloadTool(downloadUrl);

  if (verifyChecksumEnabled) {
    const expectedChecksum = await getExpectedChecksum(version, platform.assetName);
    if (expectedChecksum) {
      core.info('Verifying checksum...');
      await verifyFileChecksum(downloadedPath, expectedChecksum);
    } else {
      core.warning(`No checksum available for ${version}/${platform.assetName} - skipping verification`);
    }
  }

  const binaryName = platform.isWindows ? 'boringcache.exe' : 'boringcache';
  const installDir = path.join(os.tmpdir(), 'boringcache-install', version);
  await fs.promises.mkdir(installDir, { recursive: true });

  const binaryPath = path.join(installDir, binaryName);
  await fs.promises.copyFile(downloadedPath, binaryPath);

  if (!platform.isWindows) {
    await fs.promises.chmod(binaryPath, 0o755);
  }

  const cachedPath = await tc.cacheDir(installDir, TOOL_NAME, version.replace(/^v/, ''));
  return cachedPath;
}

async function getInstalledVersion(binaryPath: string): Promise<string> {
  let output = '';

  try {
    await exec.exec(binaryPath, ['--version'], {
      silent: true,
      listeners: {
        stdout: (data: Buffer) => {
          output += data.toString();
        },
      },
    });
    const match = output.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : output.trim();
  } catch {
    return 'unknown';
  }
}

async function run(): Promise<void> {
  try {
    const version = core.getInput('version') || 'v1.0.0';
    const token = core.getInput('token');
    const skipCache = core.getInput('skip-cache') === 'true';
    const verifyChecksumEnabled = core.getInput('verify-checksum') !== 'false';

    const normalizedVersion = version.startsWith('v') ? version : `v${version}`;

    core.info(`Setting up BoringCache CLI ${normalizedVersion}`);

    const platform = getPlatformInfo();
    core.info(`Platform: ${platform.os} ${platform.arch}`);
    core.info(`Asset: ${platform.assetName}`);

    let toolPath: string;
    let cacheHit = false;

    if (!skipCache) {
      const cachedPath = tc.find(TOOL_NAME, normalizedVersion.replace(/^v/, ''));
      if (cachedPath) {
        core.info(`Found cached BoringCache CLI at: ${cachedPath}`);
        toolPath = cachedPath;
        cacheHit = true;
      } else {
        core.info('BoringCache CLI not found in cache, downloading...');
        toolPath = await downloadAndInstall(normalizedVersion, platform, verifyChecksumEnabled);
      }
    } else {
      core.info('Skipping cache, downloading fresh binary...');
      toolPath = await downloadAndInstall(normalizedVersion, platform, verifyChecksumEnabled);
    }

    core.addPath(toolPath);
    core.info(`Added ${toolPath} to PATH`);

    if (token) {
      core.setSecret(token);
      core.exportVariable('BORINGCACHE_API_TOKEN', token);
      core.info('BORINGCACHE_API_TOKEN environment variable set');
    }

    const binaryName = platform.isWindows ? 'boringcache.exe' : 'boringcache';
    const binaryPath = path.join(toolPath, binaryName);

    const installedVersion = await getInstalledVersion(binaryPath);
    core.info(`BoringCache CLI ${installedVersion} installed successfully`);

    core.setOutput('version', installedVersion);
    core.setOutput('path', binaryPath);
    core.setOutput('cache-hit', cacheHit.toString());
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unexpected error occurred');
    }
  }
}

run();
