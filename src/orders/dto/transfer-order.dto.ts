import { IsUUID } from 'class-validator';

export class TransferOrderDto {
    @IsUUID()
    targetPharmacyId!: string;
}
