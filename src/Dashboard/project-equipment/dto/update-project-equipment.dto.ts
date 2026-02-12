import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class UpdateProjectEquipmentDto {
    @IsNumber()
    @Min(1)
    @IsOptional()
    numberOfDays?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    dailyRentalRate?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    fuelCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    operatorCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    maintenanceCost?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    otherOperatingCost?: number;

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