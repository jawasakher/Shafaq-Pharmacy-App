import {
    IsArray,
    IsBoolean,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PharmacyQuoteItemDto {
    @IsUUID()
    orderItemId!: string;

    @IsBoolean()
    available!: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    unitPrice?: number;
}

export class PharmacyQuoteDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PharmacyQuoteItemDto)
    items!: PharmacyQuoteItemDto[];

    @IsOptional()
    @IsNumber()
    @Min(0)
    medicineSubtotal?: number;

    @IsOptional()
    @IsNumber()
    @Min(0)
    deliveryFee?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}
