import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, HydratedDocument, Types } from "mongoose";


export enum SupplierTransactionType {
    PURCHASE = "purchase",
    PAYMENT = "payment",
    RETURN = "return",
    REFUND = "refund",
    OPENING = "opening",
    ADJUSTMENT = "adjustment"
}

@Schema({ timestamps: true })
export class SupplierTransaction {

    @Prop({ required: true, unique: true, index: true })
    transactionNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
    supplierId: Types.ObjectId;

    @Prop({ required: true, enum: SupplierTransactionType })
    type: SupplierTransactionType;

    @Prop({ type: Number, default: 0, min: 0 })
    debit: number;

    @Prop({ type: Number, default: 0, min: 0 })
    credit: number;
@Prop({ type: Number, default: 0, min: 0 })
    discountAmount: number;
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

export const SupplierTransactionSchema = SchemaFactory.createForClass(SupplierTransaction);
export type SupplierTransactionDocument = HydratedDocument<SupplierTransaction>;

SupplierTransactionSchema.index({ supplierId: 1, transactionDate: 1 });
