import { IsDateString, IsMongoId, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class SupplierStatementDto {
    @IsMongoId()
    supplierId: string;

    @IsOptional()
    @IsDateString()
    startDate?: string;

    @IsOptional()
    @IsDateString()
    endDate?: string;
}
