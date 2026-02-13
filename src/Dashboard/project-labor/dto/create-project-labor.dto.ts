import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class CreateProjectLaborDto {
    @IsString()
    @IsNotEmpty()
    workerName: string;

    @IsString()
    @IsNotEmpty()
    specialty: string;

    @IsString()
    @IsOptional()
    taskDescription?: string;

    @IsNumber()
    @Min(1)
    @IsNotEmpty()
    numberOfDays: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    dailyRate: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    materialCost?: number;

    @IsDateString()
    @IsNotEmpty()
    startDate: string;

    @IsDateString()
    @IsOptional()
    endDate?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}