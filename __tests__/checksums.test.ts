import { getChecksum, hasChecksums, CHECKSUMS } from '../lib/checksums';

describe('checksums', () => {
  describe('getChecksum', () => {
    it('returns checksum for known version and asset', () => {
      const checksum = getChecksum('v1.0.0', 'boringcache-linux-amd64');
      expect(checksum).toBe('23575d642408816df72e36f5722fe08c908957cab354fce4dfa9d84c8b1f46fd');
    });

    it('returns undefined for unknown version', () => {
      const checksum = getChecksum('v0.0.0', 'boringcache-linux-amd64');
      expect(checksum).toBeUndefined();
    });

    it('returns undefined for unknown asset', () => {
      const checksum = getChecksum('v1.0.0', 'unknown-asset');
      expect(checksum).toBeUndefined();
    });
  });

  describe('hasChecksums', () => {
    it('returns true for known version', () => {
      expect(hasChecksums('v1.0.0')).toBe(true);
    });

    it('returns false for unknown version', () => {
      expect(hasChecksums('v0.0.0')).toBe(false);
    });
  });

  describe('CHECKSUMS', () => {
    it('has checksums for all expected platforms', () => {
      const v1 = CHECKSUMS['v1.0.0'];
      expect(v1).toBeDefined();

      const expectedAssets = [
        'boringcache-linux-amd64',
        'boringcache-linux-arm64',
        'boringcache-macos-14-arm64',
        'boringcache-macos-15-arm64',
        'boringcache-windows-2022-amd64.exe',
        'boringcache-ubuntu-22.04-amd64',
        'boringcache-ubuntu-24.04-amd64',
      ];

      for (const asset of expectedAssets) {
        expect(v1[asset]).toBeDefined();
        expect(v1[asset]).toMatch(/^[a-f0-9]{64}$/);
      }
    });

    it('all checksums are valid sha256 format', () => {
      for (const [version, assets] of Object.entries(CHECKSUMS)) {
        for (const [asset, checksum] of Object.entries(assets)) {
          expect(checksum).toMatch(/^[a-f0-9]{64}$/);
        }
      }
    });
  });
});
