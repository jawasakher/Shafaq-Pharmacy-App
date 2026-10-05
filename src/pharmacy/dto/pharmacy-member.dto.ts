import { IsUUID } from 'class-validator';

export class PharmacyMemberDto {
    @IsUUID()
    userId!: string;
}