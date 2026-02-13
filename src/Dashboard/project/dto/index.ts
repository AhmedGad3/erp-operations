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
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ProjectStatus } from '../../../DB/Models/Project/project.schema';

export class CreateProjectDto {
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

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    contractAmount: number;

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