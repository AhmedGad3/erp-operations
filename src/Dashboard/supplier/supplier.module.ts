import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Supplier, SupplierRepository, SupplierSchema } from "src/DB";
import { SupplierTransaction, SupplierTransactionSchema } from "src/DB/Models/Transaction/supplier/supplier-transaction.schema";
import { SupplierService } from "./supplier.service";
import { SupplierController } from "./supplier.controller";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Supplier.name, schema: SupplierSchema },
            { name: SupplierTransaction.name, schema: SupplierTransactionSchema },
        ]),
    ],
    providers: [
        SupplierRepository,
        SupplierService,
    ],
    controllers: [
        SupplierController
    ],
    exports: [SupplierService],
})
export class SupplierModule { }
