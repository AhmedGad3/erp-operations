import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Types } from 'mongoose';
import { BadRequestException } from '@nestjs/common';

export class ProjectSummaryQueryDto {
    @IsNotEmpty()
    @IsString()
    projectId: string;

    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;
}