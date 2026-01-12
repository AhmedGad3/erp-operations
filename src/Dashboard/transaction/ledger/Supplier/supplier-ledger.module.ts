import { Module } from "@nestjs/common";
import { SupplierLedgerController } from "./supplier-ledger.controller";
import { CommonModule } from "../../common/common.module";

@Module({
    imports: [
        CommonModule,
    ],
    controllers: [SupplierLedgerController],
})
export class SupplierLedgerModule { }
