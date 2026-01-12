import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { PurchaseController } from "./purchase.controller";
import { PurchaseService } from "./purchase.service";
import {
    PurchaseInvoice,
    PurchaseInvoiceSchema,
} from "src/DB/Models/Transaction/supplier/purchase-invoice.schema";
import {
    PurchaseReturn,
    PurchaseReturnSchema,
} from "src/DB/Models/Transaction/supplier/purchase-return.schema";

// ✅ Modules
import { CommonModule } from "../common/common.module";
import { StockModule } from "../stock/stock.module";
import { Material, MaterialRepository, MaterialSchema } from "src/DB";
import { SupplierLedgerModule } from "../ledger/Supplier/supplier-ledger.module";

@Module({
    imports: [
        CommonModule,     // CounterService
        StockModule,      // StockMovementService
SupplierLedgerModule,
        MongooseModule.forFeature([
            { name: PurchaseInvoice.name, schema: PurchaseInvoiceSchema },
            { name: PurchaseReturn.name, schema: PurchaseReturnSchema },
            { name: Material.name, schema: MaterialSchema },
        ]),
    ],
    controllers: [PurchaseController],
    providers: [PurchaseService, MaterialRepository], // ✅ بس
})
export class PurchaseModule { }
