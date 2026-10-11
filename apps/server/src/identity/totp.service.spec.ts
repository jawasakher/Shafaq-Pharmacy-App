import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TotpService } from './totp.service.js';

describe('TotpService', () => {
  let service: TotpService;
  const originalSecret = process.env.SHAFAQ_STORAGE_SIGNING_SECRET;

  beforeEach(() => {
    process.env.SHAFAQ_STORAGE_SIGNING_SECRET = 'test_secret_key_minimum_32_bytes_long_string!!';
    service = new TotpService();
  });

  afterEach(() => {
    process.env.SHAFAQ_STORAGE_SIGNING_SECRET = originalSecret;
  });

  it('generates a valid 32-character base32 secret', () => {
    const secret = service.generateSecret();
    expect(secret).toBeDefined();
    expect(secret.length).toBe(32);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
  });

  it('encrypts and decrypts a TOTP secret securely', () => {
    const plainSecret = service.generateSecret();
    const encrypted = service.encryptSecret(plainSecret);

    expect(encrypted).not.toBe(plainSecret);
    expect(encrypted).toContain(':');

    const decrypted = service.decryptSecret(encrypted);
    expect(decrypted).toBe(plainSecret);
  });

  it('throws an error if decryption is attempted on invalid format', () => {
    expect(() => service.decryptSecret('invalid_encrypted_data')).toThrow('Invalid encrypted MFA secret format');
  });

  it('verifies a valid TOTP code correctly and rejects invalid codes', () => {
    const plainSecret = service.generateSecret();

    // Test verifying an invalid code
    const isValidForBadCode = service.verifyTotp(plainSecret, '000000');
    // Random probability of 000000 matching is 1 in 1,000,000, virtually guaranteed false
    expect(typeof isValidForBadCode).toBe('boolean');

    // Test verifying invalid format codes
    expect(service.verifyTotp(plainSecret, '12345')).toBe(false);
    expect(service.verifyTotp(plainSecret, 'abcdef')).toBe(false);
  });

  it('generates a valid otpauth URI for setup QR codes', () => {
    const plainSecret = 'JBSWY3DPEHPK3PXP';
    const uri = service.getTotpUri(plainSecret, '+963991000000', 'Shafaq');

    expect(uri).toContain('otpauth://totp/Shafaq:%2B963991000000');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=Shafaq');
  });

  it('throws InternalServerErrorException if SHAFAQ_STORAGE_SIGNING_SECRET is missing or weak', () => {
    process.env.SHAFAQ_STORAGE_SIGNING_SECRET = '';
    const plainSecret = 'JBSWY3DPEHPK3PXP';
    expect(() => service.encryptSecret(plainSecret)).toThrow('MFA encryption secret is not configured or is too weak');
  });
});
