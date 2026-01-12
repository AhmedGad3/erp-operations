import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {  HydratedDocument, Types } from "mongoose";


export enum ClientTransactionType {
  INVOICE = 'invoice',      // فاتورة عميل
  PAYMENT = 'payment',      // تحصيل
  RETURN = 'return',        // مرتجع فاتورة
  REFUND = 'refund',        // رد فلوس للعميل
  OPENING = 'opening',      // رصيد افتتاحي
  ADJUSTMENT = 'adjustment' // تسوية
}

@Schema({ timestamps: true })
export class ClientTransaction {

    @Prop({ required: true, unique: true, index: true })
    transactionNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
    clientId: Types.ObjectId;

     @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true }) 
    projectId: Types.ObjectId;

    @Prop({ required: true, enum: ClientTransactionType })
    type: ClientTransactionType;

    @Prop({ type: Number, default: 0, min: 0 })
    debit: number;

    @Prop({ type: Number, default: 0, min: 0 })
    credit: number;

    @Prop({ type: Number, required: true })
    balanceAfter: number;

    @Prop({ required: true })
    referenceType: string;

    @Prop({ type: Types.ObjectId, required: true })
    referenceId: Types.ObjectId;

    @Prop({ trim: true })
    description?: string;

    @Prop({ required: true })
    transactionDate: Date;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const ClientTransactionSchema = SchemaFactory.createForClass(ClientTransaction);
export type ClientTransactionDocument = HydratedDocument<ClientTransaction>;

ClientTransactionSchema.index({ clientId: 1, transactionDate: 1 });
