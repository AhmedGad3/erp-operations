import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { Counter, CounterSchema } from "../../../DB/Models/Counter/counter.schema";
import { SupplierTransaction, SupplierTransactionSchema } from "../../../DB/Models/Transaction/supplier/supplier-transaction.schema";
import { CounterService } from "./counter.service";
import { SupplierLedgerService } from "../ledger/Supplier/supplier-ledger.service";
import { ClientLedgerService } from './../ledger/Client/client-ledger.service';
import { ClientTransaction, ClientTransactionSchema } from "../../../DB/Models/Transaction/client/client-transaction.schema";

@Module({
    imports: [
    MongooseModule.forFeature([{ name: Counter.name, schema: CounterSchema }]),
        MongooseModule.forFeature([
            { name: SupplierTransaction.name, schema: SupplierTransactionSchema },
        ]),
        MongooseModule.forFeature([
            { name: ClientTransaction.name, schema: ClientTransactionSchema },
        ])
    ],
    providers: [CounterService, SupplierLedgerService,ClientLedgerService],
    exports: [CounterService, SupplierLedgerService, ClientLedgerService],
})
export class CommonModule { }
