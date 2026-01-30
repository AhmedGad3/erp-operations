
import { Type } from 'class-transformer';
import {
    IsArray,
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
    ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';

export class AdjustmentItemDto {
    @IsMongoId()
    @IsNotEmpty()
    materialId: Types.ObjectId;

    @IsMongoId()
    @IsNotEmpty()
    unitId: Types.ObjectId;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    actualQuantity: number;

    @IsString()
    @IsNotEmpty()
    reason: string;
}

export class CreateAdjustmentDto {
     @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AdjustmentItemDto)
    adjustments: AdjustmentItemDto[];
}