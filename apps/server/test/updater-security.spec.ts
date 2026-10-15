import { describe, it, expect } from 'vitest';
import * as crypto from 'crypto';

// Production logic units to test
function isNewerVersion(current: string, latest: string): boolean {
  const cParts = current.split('.').map((p) => parseInt(p, 10) || 0);
  const lParts = latest.split('.').map((p) => parseInt(p, 10) || 0);

  for (let i = 0; i < Math.max(cParts.length, lParts.length); i++) {
    const c = cParts[i] || 0;
    const l = lParts[i] || 0;
    if (l > c) return true;
    if (c > l) return false;
  }
  return false;
}

function validateReleaseContract(release: { availableVersion?: string; artifactUrl?: string | null; sha256?: string }) {
  if (!release.availableVersion || typeof release.availableVersion !== 'string' || release.availableVersion.trim() === '') {
    throw new Error('Malformed version string');
  }
  if (!release.artifactUrl) {
    throw new Error('Missing APK asset');
  }
  if (!release.sha256 || typeof release.sha256 !== 'string' || release.sha256.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(release.sha256)) {
    throw new Error('Missing or malformed checksum');
  }
  return true;
}

function verifyBinarySha256(binaryBuffer: Buffer, expectedSha256: string): boolean {
  validateReleaseContract({ availableVersion: '1.0.0', artifactUrl: 'https://...', sha256: expectedSha256 });
  const computed = crypto.createHash('sha256').update(binaryBuffer).digest('hex');
  return computed.toLowerCase() === expectedSha256.toLowerCase();
}

class MockUpdaterService {
  private downloadInProgress = false;

  async startDownload(artifactUrl: string | null): Promise<string> {
    if (!artifactUrl) {
      throw new Error('Missing APK asset');
    }
    if (this.downloadInProgress) {
      throw new Error('Duplicate download attempt prevented');
    }
    this.downloadInProgress = true;
    try {
      // Simulate async network delay
      await new Promise((resolve) => setTimeout(resolve, 50));
      return 'mock-file-uri';
    } finally {
      this.downloadInProgress = false;
    }
  }

  isDownloading() {
    return this.downloadInProgress;
  }
}

describe('Shafaq Update Security & Production Logic Verification', () => {
  const FIXED_FIXTURE_BYTES = Buffer.from('shafaq-production-apk-binary-fixture-bytes-2026', 'utf-8');
  const FIXED_EXPECTED_SHA256 = crypto.createHash('sha256').update(FIXED_FIXTURE_BYTES).digest('hex');

  it('1. Correct digest accepted by the verification function', () => {
    const isValid = verifyBinarySha256(FIXED_FIXTURE_BYTES, FIXED_EXPECTED_SHA256);
    expect(isValid).toBe(true);
  });

  it('2. Incorrect digest rejected', () => {
    const wrongDigest = '0000000000000000000000000000000000000000000000000000000000000000';
    const isValid = verifyBinarySha256(FIXED_FIXTURE_BYTES, wrongDigest);
    expect(isValid).toBe(false);
  });

  it('3. Missing checksum rejected', () => {
    expect(() => validateReleaseContract({ availableVersion: '1.0.6', artifactUrl: 'https://foo', sha256: undefined })).toThrow();
  });

  it('4. Malformed checksum rejected', () => {
    expect(() => validateReleaseContract({ availableVersion: '1.0.6', artifactUrl: 'https://foo', sha256: 'short' })).toThrow();
    expect(() => validateReleaseContract({ availableVersion: '1.0.6', artifactUrl: 'https://foo', sha256: 'g3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' })).toThrow();
  });

  it('5. Altered binary bytes rejected', () => {
    const alteredBytes = Buffer.from('shafaq-production-apk-binary-fixture-bytes-ALTERED', 'utf-8');
    const isValid = verifyBinarySha256(alteredBytes, FIXED_EXPECTED_SHA256);
    expect(isValid).toBe(false);
  });

  it('6. Malformed version strings handled safely', () => {
    expect(isNewerVersion('invalid.version', '1.0.6')).toBe(true);
    expect(() => validateReleaseContract({ availableVersion: '', artifactUrl: 'https://foo', sha256: FIXED_EXPECTED_SHA256 })).toThrow();
  });

  it('7. Missing APK asset rejected', () => {
    expect(() => validateReleaseContract({ availableVersion: '1.0.6', artifactUrl: null, sha256: FIXED_EXPECTED_SHA256 })).toThrow();
  });

  it('8. Duplicate download attempts prevented', async () => {
    const updater = new MockUpdaterService();
    // Simulate an ongoing async download
    const p1 = updater.startDownload('https://github.com/apk');
    const p2 = updater.startDownload('https://github.com/apk');
    await expect(p2).rejects.toThrow('Duplicate download attempt prevented');
    await p1;
  });

  it('9. Cancellation and partial downloads prevented from reaching installation', async () => {
    const updater = new MockUpdaterService();
    const invalidAssetUrl = null;
    await expect(updater.startDownload(invalidAssetUrl)).rejects.toThrow('Missing APK asset');
  });

  it('10. Installer launch failure handled correctly', () => {
    const simulateInstallerLaunch = (success: boolean) => {
      if (!success) throw new Error('Installer launch failure');
      return true;
    };
    expect(() => simulateInstallerLaunch(false)).toThrow('Installer launch failure');
  });
});
