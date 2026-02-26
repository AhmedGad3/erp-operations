import { MongooseModule } from '@nestjs/mongoose';
import { AssetInvoice, AssetInvoiceSchema } from './Asset-Invoice.schema';

export const AssetInvoiceModel = MongooseModule.forFeature([
    { name: AssetInvoice.name, schema: AssetInvoiceSchema },
]);