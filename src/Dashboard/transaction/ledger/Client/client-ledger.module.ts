// src/routes/transaction/ledger/Client/client-ledger.module.ts

import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CommonModule } from "../../common/common.module";
import { ClientLedgerController } from "./client-ledger.controller";
import { ClientLedgerService } from "./client-ledger.service"; 
import { ClientTransaction, ClientTransactionSchema } from "src/DB/Models/Transaction/client/client-transaction.schema";

@Module({
    imports: [
        CommonModule,
        MongooseModule.forFeature([
            { name: ClientTransaction.name, schema: ClientTransactionSchema }, 
        ]),
    ],
    controllers: [ClientLedgerController],
    providers: [ClientLedgerService], 
    exports: [ClientLedgerService],   
})
export class ClientLedgerModule { }
