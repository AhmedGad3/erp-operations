import { Module } from '@nestjs/common';
import { AssetInvoiceController } from './asset-invoice.controller';
import { AssetInvoiceService } from './asset-invoice.service';
import { AssetRepository } from 'src/DB/Models/Asset/asset.repository';
import { AssetModel } from 'src/DB/Models/Asset/asset.model';
import { CounterService } from '../transaction/common/counter.service';
import { AssetInvoiceModel } from 'src/DB/Models/AssetInvoice/Asset-Invoice.model';
import { CommonModule } from '../transaction/common/common.module';
import { AssetInvoiceRepository } from 'src/DB/Models/AssetInvoice/Asset-Invoice.repository';

@Module({
    imports: [
        AssetInvoiceModel,
        AssetModel,
        CommonModule,
    ],
    controllers: [AssetInvoiceController],
    providers: [
        AssetInvoiceService,
        AssetInvoiceRepository,
        AssetRepository,
        CounterService,
    ],
    exports: [AssetInvoiceService, AssetInvoiceRepository],
})
export class AssetInvoiceModule {}