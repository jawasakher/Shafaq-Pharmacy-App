import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PhoneNormalizerService {
  normalize(phone: string): string {
    const value = phone.trim();

    if (!/^\\+?[1-9]\\d{7,14}$/.test(value)) {
      throw new BadRequestException('Invalid phone number');
    }

    return value.startsWith('+') ? value : `+${value}`;
  }
}
