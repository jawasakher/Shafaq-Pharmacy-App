import { describe, it, expect } from 'vitest';
import { PhoneNormalizerService } from './phone-normalizer.service.js';
import { BadRequestException } from '@nestjs/common';

describe('PhoneNormalizerService', () => {
  const service = new PhoneNormalizerService();

  it('normalizes valid phone numbers with plus prefix', () => {
    expect(service.normalize('+963991000000')).toBe('+963991000000');
  });

  it('adds plus prefix to valid numbers starting with country code without plus', () => {
    expect(service.normalize('963991000000')).toBe('+963991000000');
  });

  it('throws BadRequestException for invalid or malformed phone numbers', () => {
    expect(() => service.normalize('invalid')).toThrow(BadRequestException);
    expect(() => service.normalize('123')).toThrow(BadRequestException);
    expect(() => service.normalize('')).toThrow(BadRequestException);
  });
});
