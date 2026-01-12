import { OmitType, PartialType } from "@nestjs/mapped-types";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateIf } from "class-validator";
import { UnitCategory } from "src/Common/Enums";



export class CreateUnitDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  nameEn: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase().trim())
  code: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.trim())
  description?: string;

  @IsMongoId({ message: 'baseUnitId must be a valid MongoDB ID' })
  @ValidateIf((o) => !o.isBase)
  @IsNotEmpty({ message: 'baseUnitId is required for derived units' })
  baseUnitId?: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  symbol: string;

  @IsEnum(UnitCategory)
  category: UnitCategory;

  @IsNumber()
  @Min(0.000001)
  @ValidateIf((o) => !o.isBase)
  @IsNotEmpty({ message: 'conversionFactor is required for derived units' })
  conversionFactor?: number;

  @IsBoolean()
  @IsOptional()
  isBase?: boolean;
}

export class UpdateUnitDto extends PartialType(
  OmitType(CreateUnitDto, ['isBase', 'baseUnitId', 'category'] as const),
) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}


export class ConvertUnitDto {
  @IsNumber()
  @Min(0.000001)
  quantity: number;

  @IsMongoId()
  @IsNotEmpty()
  fromUnitId: string;

  @IsMongoId()
  @IsNotEmpty()
  toUnitId: string;
}