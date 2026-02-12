import { MongooseModule } from '@nestjs/mongoose';
import { Asset, AssetSchema } from './asset.schema';

// model
export const AssetModel = MongooseModule.forFeature([
    { name: Asset.name, schema: AssetSchema },
]);