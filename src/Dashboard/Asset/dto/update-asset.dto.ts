import { IsString, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { AssetStatus } from '../../../DB/Models/Asset/asset.schema';

export class UpdateAssetDto {
    @IsString()
    @IsOptional()
    @MaxLength(100)
    nameAr?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    nameEn?: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    code?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    assetTypeAr?: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    assetTypeEn?: string;

    @IsEnum(AssetStatus)
    @IsOptional()
    status?: AssetStatus;

    @IsString()
    @IsOptional()
    notes?: string;
}