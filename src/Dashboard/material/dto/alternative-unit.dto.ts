import { IsBoolean, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class AlternativeUnitDto {
    @IsMongoId()
    @IsNotEmpty()
    unitId: string;

    @IsNumber()
    @Min(0.000001)
    conversionFactor: number;

    @IsBoolean()
    @IsOptional()
    isDefaultPurchase?: boolean;

    @IsBoolean()
    @IsOptional()
    isDefaultIssue?: boolean;

    @IsBoolean()
@IsOptional()
allowOverride?: boolean;

}