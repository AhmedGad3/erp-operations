import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsNumber,
    Min,
    IsDateString,
} from 'class-validator';

export class CreateProjectMiscellaneousDto {
    @IsDateString()
    @IsNotEmpty()
    date: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @IsString()
    @IsOptional()
    category?: string;

    @IsString()
    @IsOptional()
    notes?: string;
}