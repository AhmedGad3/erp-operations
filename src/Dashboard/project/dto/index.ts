import {
    IsDateString,
    IsEnum,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    Length,
    Matches,
    Min,
    ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { ProjectStatus } from '../../../DB/Models/Project/project.schema';
import { OmitType, PartialType } from '@nestjs/mapped-types';

class LaborDetailsDto {
    @IsNumber()
    @Min(0)
    numberOfWorkers: number;

    @IsNumber()
    @Min(0)
    monthlyCost: number;

    @IsNumber()
    @Min(0)
    numberOfMonths: number;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    notes?: string;
}

export class    CreateProjectDto {
    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    nameAr: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    nameEn: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.toUpperCase().trim())
    @Length(3, 20)
    @Matches(/^[A-Z0-9-]+$/, {
        message: 'Code must contain only uppercase letters, numbers, and hyphens',
    })
    code: string;

    @IsMongoId()
    @IsNotEmpty()
    clientId: Types.ObjectId;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    projectManager?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    siteEngineer?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    location?: string;

    @IsDateString()
    startDate: string;

    @IsOptional()
    @IsDateString()
    expectedEndDate?: string;

    // 💰 قيمة العقد
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    contractAmount: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => LaborDetailsDto)
    laborDetails?: LaborDetailsDto;

    @IsOptional()
    @IsNumber()
    @Min(0)
    otherCosts?: number;

    @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    notes?: string;
}

export class UpdateProjectDto {
    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    nameAr?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    nameEn?: string;

     @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    projectManager?: string;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    siteEngineer?: string;

     @IsOptional()
    @IsEnum(ProjectStatus)
    status?: ProjectStatus;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.trim())
    notes?: string;

}

export class UpdateEquipmentCostsDto {
    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

// dto/update-labor-costs.dto.ts



export class UpdateLaborCostsDto {
    @IsNotEmpty()
    @ValidateNested()
    @Type(() => LaborDetailsDto)
    laborDetails: LaborDetailsDto;
}