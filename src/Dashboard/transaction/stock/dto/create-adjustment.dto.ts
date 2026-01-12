
import {
    IsMongoId,
    IsNotEmpty,
    IsNumber,
    IsString,
    Min,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateAdjustmentDto {
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