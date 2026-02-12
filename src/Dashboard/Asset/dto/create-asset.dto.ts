import { IsString, IsNotEmpty, IsEnum, IsOptional, MaxLength, IsNumber, Min, IsDate } from 'class-validator';
import { AssetStatus } from '../../../DB/Models/Asset/asset.schema';

export class CreateAssetDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nameAr: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    nameEn: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(50)
    code: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    assetTypeAr: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    assetTypeEn: string;


    @IsDate()
    
    purchaseDate: Date;


    @IsNumber()
    @Min(0)
    purchasePrice: number;

    @IsEnum(AssetStatus)
    @IsOptional()
    status?: AssetStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}