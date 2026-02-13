import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class UpdateProjectLaborDto {
    @IsString()
    @IsOptional()
    workerName?: string;

    @IsString()
    @IsOptional()
    specialty?: string;

    @IsString()
    @IsOptional()
    taskDescription?: string;

    @IsNumber()
    @Min(1)
    @IsOptional()
    numberOfDays?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    dailyRate?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    materialCost?: number;

    @IsDateString()
    @IsOptional()
    startDate?: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}