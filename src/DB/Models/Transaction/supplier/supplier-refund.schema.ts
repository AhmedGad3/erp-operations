import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

export enum RefundMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
}


@Schema({ timestamps: true })
export class SupplierRefund {
    @Prop({ required: true, unique: true })
    refundNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
    supplierId: Types.ObjectId;

    @Prop({ required: true })
    amount: number;

    @Prop({ enum: RefundMethod, required: true })
    method: RefundMethod;

    @Prop({ required: true })
    refundDate: Date;

    @Prop()
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;
}

export const SupplierRefundSchema =
    SchemaFactory.createForClass(SupplierRefund);

export type SupplierRefundDocument = HydratedDocument<SupplierRefund>;
