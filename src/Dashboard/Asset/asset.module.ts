import { Module } from '@nestjs/common';
import { AssetModel } from '../../DB/Models/Asset/asset.model';
import { AssetRepository } from '../../DB/Models/Asset/asset.repository';
import { AssetController } from './asset.controller';
import { AssetService } from './asset.service';

@Module({
    imports: [AssetModel],
    controllers: [AssetController],
    providers: [AssetRepository, AssetService],
    exports: [AssetRepository, ],
})
export class AssetModule {}