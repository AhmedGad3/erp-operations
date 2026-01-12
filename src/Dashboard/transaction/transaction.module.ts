import { Module } from '@nestjs/common';
import { PurchaseModule } from './purchase/purchase.module';
import { PaymentModule } from './payment/payment.module';
import { SupplierLedgerModule } from './ledger/Supplier/supplier-ledger.module';
import { ClientLedgerModule } from './ledger/Client/client-ledger.module';
import { TransferOrdersModule } from './transfer/transfer-orders.module';
import { StockModule } from './stock/stock.module';

@Module({
    imports: [
        PurchaseModule,
        PaymentModule,
        SupplierLedgerModule,
        ClientLedgerModule,
        TransferOrdersModule,
        StockModule

    ],
})
export class TransactionModule { }
