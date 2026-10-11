import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

@Injectable()
export class TotpService {
  private getEncryptionKey(): Buffer {
    const secret = process.env.SHAFAQ_STORAGE_SIGNING_SECRET;
    if (!secret || secret.trim().length < 16) {
      throw new InternalServerErrorException(
        'MFA encryption secret is not configured or is too weak',
      );
    }
    return createHmac('sha256', secret).digest();
  }

  generateSecret(): string {
    const bytes = randomBytes(20);
    return this.base32Encode(bytes);
  }

  encryptSecret(plainSecret: string): string {
    const key = this.getEncryptionKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plainSecret, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  decryptSecret(encryptedSecret: string): string {
    const parts = encryptedSecret.split(':');
    if (parts.length !== 3) {
      throw new InternalServerErrorException('Invalid encrypted MFA secret format');
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  getTotpUri(secret: string, accountName: string, issuer: string = 'Shafaq'): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  verifyTotp(plainSecret: string, token: string, window: number = 1): boolean {
    const cleanToken = token.trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const step = 30;
    const currentCounter = Math.floor(nowSeconds / step);

    for (let delta = -window; delta <= window; delta++) {
      const expectedToken = this.generateTotpCode(plainSecret, currentCounter + delta);
      if (expectedToken === cleanToken) {
        return true;
      }
    }

    return false;
  }

  private generateTotpCode(secret: string, counter: number): string {
    const key = this.base32Decode(secret);
    const buffer = Buffer.alloc(8);

    let tmp = counter;
    for (let i = 7; i >= 0; i--) {
      buffer[i] = tmp & 0xff;
      tmp = Math.floor(tmp / 256);
    }

    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = (binary % 1000000).toString().padStart(6, '0');
    return otp;
  }

  private base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;
      while (bits >= 5) {
        output += BASE32_CHARS[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_CHARS[(value << (5 - bits)) & 31];
    }

    return output;
  }

  private base32Decode(base32: string): Buffer {
    const clean = base32.toUpperCase().replace(/=+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < clean.length; i++) {
      const val = BASE32_CHARS.indexOf(clean[i]);
      if (val === -1) continue;
      value = (value << 5) | val;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }
}
