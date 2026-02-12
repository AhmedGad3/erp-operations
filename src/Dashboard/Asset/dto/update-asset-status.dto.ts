import { IsEnum, IsNotEmpty } from 'class-validator';
import { AssetStatus } from '../../../DB/Models/Asset/asset.schema';

export class UpdateAssetStatusDto {
    @IsEnum(AssetStatus)
    @IsNotEmpty()
    status: AssetStatus;
}