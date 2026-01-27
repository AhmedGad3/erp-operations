
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

class MaterialIssueItemDto {
    @IsMongoId()
    @IsNotEmpty()
    materialId: Types.ObjectId;

    @IsMongoId()
    @IsNotEmpty()
    unitId: Types.ObjectId;  // ✅ الوحدة

    @IsNumber()
    @Min(0.0001)
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    unitPrice: number;
}

export class CreateMaterialIssueDto {
    @IsMongoId()
    @IsNotEmpty()
    projectId: Types.ObjectId;

    @IsDateString()
    @IsNotEmpty()
    issueDate: string;

    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => MaterialIssueItemDto)
    items: MaterialIssueItemDto[];

    @IsOptional()
    notes?: string;
}