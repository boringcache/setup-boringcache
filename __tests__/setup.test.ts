import { exportConfiguredTokens, getLinuxAssetName, getLinuxFallbackAssetName, LinuxDistro } from '../lib/setup';

describe('getLinuxAssetName', () => {
  it('returns musl asset for alpine', () => {
    const distro: LinuxDistro = { id: 'alpine', versionId: '3.19', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-musl-amd64');
  });

  it('returns musl asset for alpine arm64', () => {
    const distro: LinuxDistro = { id: 'alpine', versionId: '3.21', codename: '' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-linux-musl-arm64');
  });

  it('returns generic linux for ubuntu', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '24.04', codename: 'noble' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('returns generic linux for debian', () => {
    const distro: LinuxDistro = { id: 'debian', versionId: '12', codename: 'bookworm' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-linux-arm64');
  });

  it('returns generic linux for unknown distro', () => {
    const distro: LinuxDistro = { id: 'fedora', versionId: '39', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('returns generic linux when distro is null', () => {
    expect(getLinuxAssetName(null, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('returns generic linux when distro id is empty', () => {
    const distro: LinuxDistro = { id: '', versionId: '', codename: '' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-linux-arm64');
  });
});

describe('getLinuxFallbackAssetName', () => {
  it('returns alpine fallback for alpine distro', () => {
    const distro: LinuxDistro = { id: 'alpine', versionId: '3.19', codename: '' };
    expect(getLinuxFallbackAssetName(distro, 'amd64')).toBe('boringcache-alpine-amd64');
  });

  it('returns alpine arm64 fallback', () => {
    const distro: LinuxDistro = { id: 'alpine', versionId: '3.21', codename: '' };
    expect(getLinuxFallbackAssetName(distro, 'arm64')).toBe('boringcache-alpine-arm64');
  });

  it('returns undefined for non-alpine distros', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '24.04', codename: 'noble' };
    expect(getLinuxFallbackAssetName(distro, 'amd64')).toBeUndefined();
  });

  it('returns undefined when distro is null', () => {
    expect(getLinuxFallbackAssetName(null, 'amd64')).toBeUndefined();
  });
});

describe('detectLinuxDistro', () => {
  let detectLinuxDistro: typeof import('../lib/setup').detectLinuxDistro;
  let readFileSyncSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    readFileSyncSpy?.mockRestore();
  });

  function setupMock(content: string | Error) {
    const fs = require('fs');
    if (content instanceof Error) {
      readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw content; });
    } else {
      readFileSyncSpy = jest.spyOn(fs, 'readFileSync').mockReturnValue(content);
    }
    // Re-import to pick up mock
    const setup = require('../lib/setup');
    detectLinuxDistro = setup.detectLinuxDistro;
  }

  it('parses ubuntu os-release correctly', () => {
    setupMock([
      'NAME="Ubuntu"',
      'VERSION_ID="24.04"',
      'ID=ubuntu',
      'VERSION_CODENAME=noble',
      'PRETTY_NAME="Ubuntu 24.04 LTS"',
    ].join('\n'));

    const result = detectLinuxDistro();
    expect(result).toEqual({ id: 'ubuntu', versionId: '24.04', codename: 'noble' });
    expect(readFileSyncSpy).toHaveBeenCalledWith('/etc/os-release', 'utf-8');
  });

  it('parses debian os-release correctly', () => {
    setupMock([
      'PRETTY_NAME="Debian GNU/Linux 12 (bookworm)"',
      'ID=debian',
      'VERSION_ID="12"',
      'VERSION_CODENAME=bookworm',
    ].join('\n'));

    const result = detectLinuxDistro();
    expect(result).toEqual({ id: 'debian', versionId: '12', codename: 'bookworm' });
  });

  it('parses alpine os-release correctly', () => {
    setupMock([
      'NAME="Alpine Linux"',
      'ID=alpine',
      'VERSION_ID=3.19.0',
    ].join('\n'));

    const result = detectLinuxDistro();
    expect(result).toEqual({ id: 'alpine', versionId: '3.19.0', codename: '' });
  });

  it('returns null when /etc/os-release is missing', () => {
    setupMock(new Error('ENOENT'));

    const result = detectLinuxDistro();
    expect(result).toBeNull();
  });
});

describe('detectMacOSVersion', () => {
  let detectMacOSVersion: typeof import('../lib/setup').detectMacOSVersion;
  let getExecOutputSpy: jest.SpyInstance;

  afterEach(() => {
    getExecOutputSpy?.mockRestore();
  });

  function setupMock(output: string | Error) {
    const actionsExec = require('@actions/exec');
    if (output instanceof Error) {
      getExecOutputSpy = jest.spyOn(actionsExec, 'getExecOutput').mockRejectedValue(output);
    } else {
      getExecOutputSpy = jest.spyOn(actionsExec, 'getExecOutput').mockResolvedValue({
        stdout: output,
        stderr: '',
        exitCode: 0,
      });
    }
    const setup = require('../lib/setup');
    detectMacOSVersion = setup.detectMacOSVersion;
  }

  it('detects macOS 15', async () => {
    setupMock('15.2.1\n');
    expect(await detectMacOSVersion()).toBe('15');
  });

  it('detects macOS 14', async () => {
    setupMock('14.5\n');
    expect(await detectMacOSVersion()).toBe('14');
  });

  it('returns null on failure', async () => {
    setupMock(new Error('command not found'));
    expect(await detectMacOSVersion()).toBeNull();
  });
});

describe('exportConfiguredTokens', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('exports the legacy token env when token is provided', () => {
    const setSecretSpy = jest.spyOn(require('@actions/core'), 'setSecret').mockImplementation(() => {});
    const exportVariableSpy = jest.spyOn(require('@actions/core'), 'exportVariable').mockImplementation(() => {});
    const infoSpy = jest.spyOn(require('@actions/core'), 'info').mockImplementation(() => {});

    exportConfiguredTokens({ token: 'legacy-token' });

    expect(setSecretSpy).toHaveBeenCalledWith('legacy-token');
    expect(exportVariableSpy).toHaveBeenCalledWith('BORINGCACHE_API_TOKEN', 'legacy-token');
    expect(infoSpy).toHaveBeenCalledWith('BORINGCACHE_API_TOKEN environment variable set');
  });

  it('exports restore and save token envs independently', () => {
    const setSecretSpy = jest.spyOn(require('@actions/core'), 'setSecret').mockImplementation(() => {});
    const exportVariableSpy = jest.spyOn(require('@actions/core'), 'exportVariable').mockImplementation(() => {});

    exportConfiguredTokens({
      restoreToken: 'restore-token',
      saveToken: 'save-token',
    });

    expect(setSecretSpy).toHaveBeenCalledWith('restore-token');
    expect(setSecretSpy).toHaveBeenCalledWith('save-token');
    expect(exportVariableSpy).toHaveBeenCalledWith('BORINGCACHE_RESTORE_TOKEN', 'restore-token');
    expect(exportVariableSpy).toHaveBeenCalledWith('BORINGCACHE_SAVE_TOKEN', 'save-token');
  });

  it('exports strict signature verification by default', () => {
    const exportVariableSpy = jest.spyOn(require('@actions/core'), 'exportVariable').mockImplementation(() => {});

    exportConfiguredTokens({}, { requireServerSignature: true });

    expect(exportVariableSpy).toHaveBeenCalledWith('BORINGCACHE_REQUIRE_SERVER_SIGNATURE', '1');
  });

  it('allows strict signature verification to be disabled explicitly', () => {
    const exportVariableSpy = jest.spyOn(require('@actions/core'), 'exportVariable').mockImplementation(() => {});

    exportConfiguredTokens({}, { requireServerSignature: false });

    expect(exportVariableSpy).toHaveBeenCalledWith('BORINGCACHE_REQUIRE_SERVER_SIGNATURE', '0');
  });
});
