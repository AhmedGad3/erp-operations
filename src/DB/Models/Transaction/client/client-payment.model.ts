// src/DB/Models/Project/customer-payment.model.ts
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsPayment, ClientsPaymentSchema } from './client.payment.schema';

export const ClientPaymentModel = MongooseModule.forFeature([
    { name: ClientsPayment.name, schema: ClientsPaymentSchema },
]);