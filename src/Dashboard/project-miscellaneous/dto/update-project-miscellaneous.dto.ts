import {
    IsString,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class UpdateProjectMiscellaneousDto {
    @IsDateString()
    @IsOptional()
    date?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsNumber()
    @Min(0)
    @IsOptional()
    amount?: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}