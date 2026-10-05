import {
    IsArray,
    IsInt,
    IsNotEmpty,
    IsNumberString,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CreateOrderItemDto {
    @IsString()
    @IsNotEmpty()
    medicineName!: string;

    @IsInt()
    @Min(1)
    quantity!: number;
}

export class CreateOrderDto {
    @IsString()
    @IsNotEmpty()
    pharmacyId!: string;

    @IsString()
    @IsNotEmpty()
    deliveryAddress!: string;

    @IsNumberString()
    deliveryLatitude!: string;

    @IsNumberString()
    deliveryLongitude!: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items!: CreateOrderItemDto[];
}