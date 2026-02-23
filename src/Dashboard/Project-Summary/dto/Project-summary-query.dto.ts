import { IsMongoId, IsOptional, IsDateString } from 'class-validator';

export class ProjectSummaryQueryDto {
    @IsMongoId()
    projectId: string;

    @IsOptional()
    @IsDateString()
    dateFrom?: string;

    @IsOptional()
    @IsDateString()
    dateTo?: string;
}