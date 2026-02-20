// dto/create-subcontractor-work.dto.ts

import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class CreateSubcontractorWorkDto {
    @IsString()
    @IsNotEmpty()
    contractorName: string;

    @IsString()
    @IsNotEmpty()
    itemDescription: string;

    @IsString()
    @IsOptional()
    unit?: string;

    @IsDateString()
@IsNotEmpty()
workDate: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    unitPrice: number;

    @IsString()
    @IsOptional()
    notes?: string;
}