import {
    IsArray,
    IsMongoId,
    IsNumber,
    IsOptional,
    Min,
    ValidateNested,
    ArrayMinSize,
    IsDateString,
    IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class PurchaseReturnItemDto {
    @IsMongoId()
    materialId: Types.ObjectId;

    @IsMongoId()
    @IsNotEmpty()
    unitId: Types.ObjectId;

    @IsNumber()
    @Min(0.0001)
    quantity: number;

    @IsNumber()
    @Min(0)
    unitPrice: number;

    @IsNumber()
    @Min(0.000001)
    @IsOptional()
    conversionFactor?: number;
}

export class CreatePurchaseReturnDto {
    @IsMongoId()
    supplierId: Types.ObjectId;

    @IsDateString()
    returnDate: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => PurchaseReturnItemDto)
    items: PurchaseReturnItemDto[];

    @IsOptional()
    notes?: string;
}
