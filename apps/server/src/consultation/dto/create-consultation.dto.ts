import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateConsultationDto {
  @IsString()
  symptoms!: string;

  @IsString()
  duration!: string;

  @IsInt()
  @Min(0)
  age!: number;

  @IsOptional()
  @IsString()
  currentMedications?: string;

  @IsOptional()
  @IsString()
  allergies?: string;

  @IsOptional()
  @IsString()
  additionalDetails?: string;

  @IsOptional()
  @IsString()
  pharmacyId?: string;
}
