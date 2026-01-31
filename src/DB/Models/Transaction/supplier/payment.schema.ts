import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

@Schema({ timestamps: true })
export class SupplierPayment {
    @Prop({ required: true, unique: true })
    paymentNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
    supplierId: Types.ObjectId;

    @Prop({ required: true, min: 0 })
    amount: number;

     @Prop({ type: Number, default: 0, min: 0 })
    discountAmount: number;

    @Prop({ required: true, enum: ['CASH', 'TRANSFER', 'CHEQUE'] })
    method: string;

    @Prop()
    transferRef?: string;

    @Prop()
    chequeNo?: string;

    @Prop({ required: true })
    paymentDate: Date;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}


export const SupplierPaymentSchema =
    SchemaFactory.createForClass(SupplierPayment);

export type SupplierPaymentDocument =
    HydratedDocument<SupplierPayment>;
