import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonModule } from '../common/common.module';

import {
  SupplierPayment,
  SupplierPaymentSchema,
} from 'src/DB/Models/Transaction/supplier/payment.schema';

import {
  SupplierRefund,
  SupplierRefundSchema,
} from 'src/DB/Models/Transaction/supplier/supplier-refund.schema';

import {
  PurchaseInvoice,
  PurchaseInvoiceSchema,
} from 'src/DB/Models/Transaction/supplier/purchase-invoice.schema';

import {
  ClientsPayment,
  ClientsPaymentSchema,
} from 'src/DB/Models/Transaction/client/client.payment.schema';

import { Project, ProjectSchema } from 'src/DB/Models/Project/project.schema';

import { SupplierLedgerModule } from '../ledger/Supplier/supplier-ledger.module';
import { ClientLedgerModule } from '../ledger/Client/client-ledger.module';

import { SupplierPaymentController } from './supplier/supplier.payment.controller';
import { SupplierPaymentService } from './supplier/supplier.payment.service';

import { ClientPaymentController } from './client/client-payment.controller';
import { ClientPaymentService } from './client/client.payment.service';

@Module({
  imports: [
    CommonModule,          // CounterService
    SupplierLedgerModule,
    ClientLedgerModule,

    MongooseModule.forFeature([
      { name: SupplierPayment.name, schema: SupplierPaymentSchema },
      { name: SupplierRefund.name, schema: SupplierRefundSchema },
      { name: PurchaseInvoice.name, schema: PurchaseInvoiceSchema },

      // ✅ Client
      { name: ClientsPayment.name, schema: ClientsPaymentSchema },
      { name: Project.name, schema: ProjectSchema },
    ]),
  ],

  controllers: [
    SupplierPaymentController,
    ClientPaymentController,
  ],

  providers: [
    SupplierPaymentService,
    ClientPaymentService,
  ],
})
export class PaymentModule {}
