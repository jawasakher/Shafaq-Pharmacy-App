import { IsIn } from 'class-validator';

export class PriceResponseDto {
    @IsIn(['ACCEPT', 'REJECT'])
    decision!: 'ACCEPT' | 'REJECT';
}
