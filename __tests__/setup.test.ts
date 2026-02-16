import { getLinuxAssetName, LinuxDistro } from '../lib/setup';

describe('getLinuxAssetName', () => {
  it('returns ubuntu asset for ubuntu distro with version', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '24.04', codename: 'noble' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-ubuntu-24.04-amd64');
  });

  it('returns ubuntu 22.04 asset', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '22.04', codename: 'jammy' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-ubuntu-22.04-arm64');
  });

  it('returns ubuntu 25.04 asset', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '25.04', codename: 'plucky' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-ubuntu-25.04-amd64');
  });

  it('falls back to linux for ubuntu without version', () => {
    const distro: LinuxDistro = { id: 'ubuntu', versionId: '', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('returns debian bookworm asset', () => {
    const distro: LinuxDistro = { id: 'debian', versionId: '12', codename: 'bookworm' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-debian-bookworm-amd64');
  });

  it('returns debian bullseye asset', () => {
    const distro: LinuxDistro = { id: 'debian', versionId: '11', codename: 'bullseye' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-debian-bullseye-arm64');
  });

  it('falls back to linux for debian without codename', () => {
    const distro: LinuxDistro = { id: 'debian', versionId: '12', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('returns alpine asset', () => {
    const distro: LinuxDistro = { id: 'alpine', versionId: '3.19', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-alpine-amd64');
  });

  it('returns arch asset', () => {
    const distro: LinuxDistro = { id: 'arch', versionId: '', codename: '' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-arch-arm64');
  });

  it('falls back to generic linux for unknown distro', () => {
    const distro: LinuxDistro = { id: 'fedora', versionId: '39', codename: '' };
    expect(getLinuxAssetName(distro, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('falls back to generic linux when distro is null', () => {
    expect(getLinuxAssetName(null, 'amd64')).toBe('boringcache-linux-amd64');
  });

  it('falls back to generic linux when distro id is empty', () => {
    const distro: LinuxDistro = { id: '', versionId: '', codename: '' };
    expect(getLinuxAssetName(distro, 'arm64')).toBe('boringcache-linux-arm64');
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
