"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectLinuxDistro = detectLinuxDistro;
exports.detectMacOSVersion = detectMacOSVersion;
exports.getLinuxAssetName = getLinuxAssetName;
const core = __importStar(require("@actions/core"));
const exec = __importStar(require("@actions/exec"));
const tc = __importStar(require("@actions/tool-cache"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const checksums_1 = require("./checksums");
const TOOL_NAME = 'boringcache';
const GITHUB_RELEASES_BASE = 'https://github.com/boringcache/cli/releases/download';
function detectLinuxDistro() {
    try {
        const content = fs.readFileSync('/etc/os-release', 'utf-8');
        const lines = content.split('\n');
        const fields = {};
        for (const line of lines) {
            const match = line.match(/^(\w+)=(.*)$/);
            if (match) {
                fields[match[1]] = match[2].replace(/^["']|["']$/g, '');
            }
        }
        return {
            id: fields['ID'] || '',
            versionId: fields['VERSION_ID'] || '',
            codename: fields['VERSION_CODENAME'] || '',
        };
    }
    catch {
        core.debug('Failed to read /etc/os-release');
        return null;
    }
}
async function detectMacOSVersion() {
    try {
        const { stdout } = await exec.getExecOutput('sw_vers', ['-productVersion'], { silent: true });
        const output = stdout.trim();
        const major = output.split('.')[0];
        core.debug(`Detected macOS version: ${output} (major: ${major})`);
        return major;
    }
    catch {
        core.debug('Failed to detect macOS version');
        return null;
    }
}
function getLinuxAssetName(distro, arch) {
    if (!distro || !distro.id) {
        return `boringcache-linux-${arch}`;
    }
    switch (distro.id) {
        case 'ubuntu':
            if (distro.versionId) {
                return `boringcache-ubuntu-${distro.versionId}-${arch}`;
            }
            return `boringcache-linux-${arch}`;
        case 'debian':
            if (distro.codename) {
                return `boringcache-debian-${distro.codename}-${arch}`;
            }
            return `boringcache-linux-${arch}`;
        case 'alpine':
            return `boringcache-alpine-${arch}`;
        case 'arch':
            return `boringcache-arch-${arch}`;
        default:
            return `boringcache-linux-${arch}`;
    }
}
async function getPlatformInfo() {
    const platformOverride = core.getInput('platform');
    if (platformOverride) {
        core.info(`Using platform override: ${platformOverride}`);
        const isWindows = platformOverride.includes('windows');
        return {
            os: isWindows ? 'windows' : platformOverride.includes('macos') ? 'macos' : 'linux',
            arch: platformOverride.includes('arm64') ? 'arm64' : 'amd64',
            assetName: `boringcache-${platformOverride}${isWindows && !platformOverride.endsWith('.exe') ? '.exe' : ''}`,
            isWindows,
        };
    }
    const runnerOS = process.env.RUNNER_OS || os.platform();
    const runnerArch = process.env.RUNNER_ARCH || os.arch();
    let normalizedOS = runnerOS;
    let normalizedArch = runnerArch;
    if (runnerOS === 'darwin' || runnerOS === 'Darwin') {
        normalizedOS = 'macOS';
    }
    else if (runnerOS === 'win32' || runnerOS === 'Windows') {
        normalizedOS = 'Windows';
    }
    else if (runnerOS === 'linux' || runnerOS === 'Linux') {
        normalizedOS = 'Linux';
    }
    if (runnerArch === 'x64' || runnerArch === 'X64' || runnerArch === 'amd64') {
        normalizedArch = 'X64';
    }
    else if (runnerArch === 'arm64' || runnerArch === 'ARM64' || runnerArch === 'aarch64') {
        normalizedArch = 'ARM64';
    }
    const isWindows = normalizedOS === 'Windows';
    const arch = normalizedArch === 'ARM64' ? 'arm64' : 'amd64';
    let assetName;
    switch (normalizedOS) {
        case 'Linux': {
            const distro = detectLinuxDistro();
            if (distro) {
                core.info(`Detected Linux distro: ${distro.id} ${distro.versionId} (${distro.codename})`);
            }
            assetName = getLinuxAssetName(distro, arch);
            break;
        }
        case 'macOS': {
            const macVersion = await detectMacOSVersion();
            if (macVersion && (macVersion === '15' || macVersion === '14')) {
                assetName = `boringcache-macos-${macVersion}-arm64`;
            }
            else {
                assetName = 'boringcache-macos-14-arm64';
            }
            break;
        }
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
function getDownloadUrl(version, assetName) {
    return `${GITHUB_RELEASES_BASE}/${version}/${assetName}`;
}
function getChecksumsUrl(version) {
    return `${GITHUB_RELEASES_BASE}/${version}/SHA256SUMS`;
}
async function getExpectedChecksum(version, assetName) {
    const checksumsUrl = getChecksumsUrl(version);
    core.debug(`Fetching checksums from: ${checksumsUrl}`);
    try {
        const checksumsPath = await tc.downloadTool(checksumsUrl);
        const content = await fs.promises.readFile(checksumsPath, 'utf-8');
        const checksum = (0, checksums_1.parseChecksums)(content, assetName);
        if (checksum) {
            core.debug(`Fetched checksum for ${assetName}: ${checksum}`);
        }
        return checksum;
    }
    catch (error) {
        core.debug(`Failed to fetch SHA256SUMS: ${error instanceof Error ? error.message : error}`);
        return null;
    }
}
async function verifyFileChecksum(filePath, expectedChecksum) {
    const fileBuffer = await fs.promises.readFile(filePath);
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);
    const actualChecksum = hash.digest('hex');
    if (actualChecksum !== expectedChecksum) {
        throw new Error(`Checksum verification failed. Expected: ${expectedChecksum}, Actual: ${actualChecksum}`);
    }
    core.info(`Checksum verified: ${actualChecksum}`);
}
async function downloadAndInstall(version, platform, verifyChecksumEnabled) {
    const downloadUrl = getDownloadUrl(version, platform.assetName);
    core.info(`Downloading BoringCache CLI from: ${downloadUrl}`);
    const downloadedPath = await tc.downloadTool(downloadUrl);
    if (verifyChecksumEnabled) {
        const expectedChecksum = await getExpectedChecksum(version, platform.assetName);
        if (expectedChecksum) {
            core.info('Verifying checksum...');
            await verifyFileChecksum(downloadedPath, expectedChecksum);
        }
        else {
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
async function getInstalledVersion(binaryPath) {
    let output = '';
    try {
        await exec.exec(binaryPath, ['--version'], {
            silent: true,
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                },
            },
        });
        const match = output.match(/(\d+\.\d+\.\d+)/);
        return match ? match[1] : output.trim();
    }
    catch {
        return 'unknown';
    }
}
async function run() {
    try {
        const version = core.getInput('version') || 'v1.0.3';
        const token = core.getInput('token');
        const skipCache = core.getInput('skip-cache') === 'true';
        const verifyChecksumEnabled = core.getInput('verify-checksum') !== 'false';
        const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
        core.info(`Setting up BoringCache CLI ${normalizedVersion}`);
        const platform = await getPlatformInfo();
        core.info(`Platform: ${platform.os} ${platform.arch}`);
        core.info(`Asset: ${platform.assetName}`);
        let toolPath;
        let cacheHit = false;
        if (!skipCache) {
            let cachedPath = tc.find(TOOL_NAME, normalizedVersion.replace(/^v/, ''));
            if (cachedPath && verifyChecksumEnabled) {
                const binaryName = platform.isWindows ? 'boringcache.exe' : 'boringcache';
                const cachedBinary = path.join(cachedPath, binaryName);
                if (fs.existsSync(cachedBinary)) {
                    const expectedChecksum = await getExpectedChecksum(normalizedVersion, platform.assetName);
                    if (expectedChecksum) {
                        const fileBuffer = await fs.promises.readFile(cachedBinary);
                        const hash = crypto.createHash('sha256');
                        hash.update(fileBuffer);
                        const actualChecksum = hash.digest('hex');
                        if (actualChecksum !== expectedChecksum) {
                            core.warning('Cached CLI binary is stale (checksum mismatch), re-downloading');
                            cachedPath = '';
                        }
                    }
                }
            }
            if (cachedPath) {
                core.info(`Found cached BoringCache CLI at: ${cachedPath}`);
                toolPath = cachedPath;
                cacheHit = true;
            }
            else {
                core.info('BoringCache CLI not found in cache, downloading...');
                toolPath = await downloadAndInstall(normalizedVersion, platform, verifyChecksumEnabled);
            }
        }
        else {
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
        core.setOutput('asset', platform.assetName);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
run();
