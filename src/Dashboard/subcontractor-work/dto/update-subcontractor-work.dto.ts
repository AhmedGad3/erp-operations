// dto/update-subcontractor-work.dto.ts

import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
} from 'class-validator';

export class UpdateSubcontractorWorkDto {
    @IsString()
    @IsOptional()
    contractorName?: string;

    @IsString()
    @IsOptional()
    itemDescription?: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    quantity?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    unitPrice?: number;

    @IsString()
    @IsOptional()
    notes?: string;
}