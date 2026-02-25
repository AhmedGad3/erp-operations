import { MainCategory } from "src/Common/Enums";
import { AlternativeUnitDto } from "./alternative-unit.dto";
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Length, Matches, Min, ValidateNested } from "class-validator";
import { Transform, Type } from "class-transformer";

export class CreateMaterialDto {

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    nameAr: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.trim())
    nameEn: string;

    // ✅ بقت optional لأن الفرونت ممكن يبعت undefined
    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    subCategory?: string;

    @IsString()
    @IsNotEmpty()
    @Transform(({ value }) => value?.toUpperCase().trim())
    @Length(3, 20)
    @Matches(/^[A-Z0-9-]+$/, {
        message: 'Code must contain only uppercase letters, numbers, and hyphens'
    })
    code: string;

    @IsEnum(MainCategory)
    @Transform(({ value }) => value?.trim())
    mainCategory: MainCategory;

    @IsMongoId()
    @IsNotEmpty()
    baseUnit: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => AlternativeUnitDto)
    @ArrayMinSize(0)
    @IsOptional()
    alternativeUnits?: AlternativeUnitDto[];

    @IsNumber()
    @Min(0)
    @IsOptional()
    minLevelStock?: number;

    @IsNumber()
    @Min(0)
    @IsOptional()
    lastPurchasedPrice?: number;

    @IsDateString()
    @IsOptional()
    lastPurchasedDate?: Date;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value?.trim())
    description?: string;

    @IsMongoId()
    @IsOptional()
    defaultPurchaseUnit?: string;

    @IsMongoId()
    @IsOptional()
    defaultIssueUnit?: string;
}