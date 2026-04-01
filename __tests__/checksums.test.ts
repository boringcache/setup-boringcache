import { parseChecksums } from '../lib/checksums';

describe('parseChecksums', () => {
  it('parses checksum with two-space separator', () => {
    const content = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234  boringcache-linux-amd64\n';
    expect(parseChecksums(content, 'boringcache-linux-amd64'))
      .toBe('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234');
  });

  it('parses checksum with single-space separator', () => {
    const content = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234 boringcache-linux-amd64\n';
    expect(parseChecksums(content, 'boringcache-linux-amd64'))
      .toBe('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234');
  });

  it('finds correct asset among multiple entries', () => {
    const content = [
      'aaaa1234aaaa1234aaaa1234aaaa1234aaaa1234aaaa1234aaaa1234aaaa1234  boringcache-linux-arm64',
      'bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234  boringcache-linux-amd64',
      'cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234  boringcache-macos-universal',
      'dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234  boringcache-windows-amd64.exe',
    ].join('\n');
    expect(parseChecksums(content, 'boringcache-linux-amd64'))
      .toBe('bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234bbbb1234');
  });

  it('finds generic macOS and Windows assets', () => {
    const content = [
      'cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234  boringcache-macos-universal',
      'dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234  boringcache-windows-amd64.exe',
    ].join('\n');
    expect(parseChecksums(content, 'boringcache-macos-universal'))
      .toBe('cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234cccc1234');
    expect(parseChecksums(content, 'boringcache-windows-amd64.exe'))
      .toBe('dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234dddd1234');
  });

  it('matches filename at end of path', () => {
    const content = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234  ./bin/boringcache-linux-amd64\n';
    expect(parseChecksums(content, 'boringcache-linux-amd64'))
      .toBe('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234');
  });

  it('returns null for unknown asset', () => {
    const content = 'abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234  boringcache-linux-amd64\n';
    expect(parseChecksums(content, 'boringcache-unknown')).toBeNull();
  });

  it('returns null for empty content', () => {
    expect(parseChecksums('', 'boringcache-linux-amd64')).toBeNull();
  });

  it('lowercases uppercase checksums', () => {
    const content = 'ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234ABCD1234  boringcache-linux-amd64\n';
    expect(parseChecksums(content, 'boringcache-linux-amd64'))
      .toBe('abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234abcd1234');
  });
});
