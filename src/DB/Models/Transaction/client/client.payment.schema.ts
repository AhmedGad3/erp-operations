// src/DB/Models/Project/customer-payment.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CHEQUE = 'CHEQUE',
}

@Schema({ timestamps: true })
export class ClientsPayment {
    @Prop({ required: true, unique: true, index: true })
    paymentNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
    clientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
    projectId: Types.ObjectId;

   @Prop({ required: true, min: 0 })
    amount: number; 

    @Prop({ type: Number, default: 0, min: 0 })
    contractPayment: number; 

    @Prop({ type: Number, default: 0, min: 0 })
    additionalPayment: number;

    @Prop({
        type: String,
        enum: Object.values(PaymentMethod),
        required: true,
    })
    method: PaymentMethod;

    @Prop({ trim: true })
    transferRef?: string;

    @Prop({ trim: true })
    chequeNo?: string;

    @Prop({ required: true })
    paymentDate: Date;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const ClientsPaymentSchema = SchemaFactory.createForClass(ClientsPayment);
export type ClientsPaymentDocument = HydratedDocument<ClientsPayment>;

ClientsPaymentSchema.index({ projectId: 1, paymentDate: 1 });
ClientsPaymentSchema.index({ clientId: 1, paymentDate: 1 });