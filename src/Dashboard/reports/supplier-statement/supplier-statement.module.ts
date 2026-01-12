import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Supplier, SupplierSchema } from '../../../DB/Models/Supplier/supplier.schema';
import {
    SupplierTransaction,
    SupplierTransactionSchema,
} from '../../../DB/Models/Transaction/supplier/supplier-transaction.schema';
import { SupplierStatementController } from './supplier-statement.controller';
import { SupplierStatementService } from './supplier-statement.service';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Supplier.name, schema: SupplierSchema },
            { name: SupplierTransaction.name, schema: SupplierTransactionSchema },
        ]),
    ],
    controllers: [SupplierStatementController],
    providers: [SupplierStatementService],
    exports: [SupplierStatementService],
})
export class SupplierStatementModule {}
