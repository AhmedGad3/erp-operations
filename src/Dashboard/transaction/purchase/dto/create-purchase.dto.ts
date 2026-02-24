import {
    IsArray,
    IsDateString,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    Min,
    ValidateNested,
    ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

class PurchaseItemDto {
    @IsMongoId()
    @IsNotEmpty()
    materialId: Types.ObjectId;

    @IsMongoId()
    @IsNotEmpty()
    unitId: Types.ObjectId;

    @IsNumber()
    @Min(0.0001)
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsNumber()
    @Min(0.000001)
    @IsOptional()
    conversionFactor?: number;
}

export class CreatePurchaseDto {
    @IsMongoId()
    @IsNotEmpty()
    supplierId: Types.ObjectId;

    @IsDateString()
    invoiceDate: string;

    @IsOptional()
    supplierInvoiceNo?: string;

    @IsOptional()
    @IsNumber()
    @Min(0)
    creditDays?: number;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PurchaseItemDto)
    items: PurchaseItemDto[];

    @IsOptional()
    notes?: string;
}
