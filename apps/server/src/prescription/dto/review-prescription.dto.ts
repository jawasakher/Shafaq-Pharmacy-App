import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewPrescriptionDto {
    @IsIn(['ACCEPT', 'REUPLOAD'])
    decision!: 'ACCEPT' | 'REUPLOAD';

    @IsOptional()
    @IsString()
    @MaxLength(2000)
    reviewNotes?: string;

    @IsOptional()
    @IsString()
    @MaxLength(1000)
    rejectionReason?: string;
}
