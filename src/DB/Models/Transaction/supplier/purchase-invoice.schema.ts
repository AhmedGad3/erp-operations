import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";


export enum PurchaseInvoiceStatus {
    OPEN = 'OPEN',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
}

@Schema({ timestamps: true })
export class PurchaseInvoice {


    @Prop({ required: true, unique: true, index: true })
    invoiceNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true, index: true })
    supplierId: Types.ObjectId;

    @Prop({ trim: true })
    supplierInvoiceNo?: string;

    @Prop({ required: true })
    invoiceDate: Date;

    @Prop({ type: Number, default: 30, min: 0 })
    creditDays: number;

    @Prop({ required: true })
    dueDate: Date;

    @Prop({
        type: [
            {
                materialId: { type: Types.ObjectId, ref: 'Material', required: true },
                 unitId: { type: Types.ObjectId, ref: 'Unit', required: true },
                quantity: { type: Number, required: true, min: 0 },
                unitPrice: { type: Number, required: true, min: 0 },
                total: { type: Number, required: true, min: 0 },
            },
        ],
        required: true,
    })
    items: {
        materialId: Types.ObjectId;
         unitId: Types.ObjectId;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];

    @Prop({ required: true, min: 0 })
    totalAmount: number;

    @Prop({ default: 0, min: 0 })
    paidAmount: number;

    @Prop({ required: true, min: 0 })
    remainingAmount: number;

    @Prop({
        required: true,
        enum: PurchaseInvoiceStatus,
        default: PurchaseInvoiceStatus.OPEN,
    })
    status: PurchaseInvoiceStatus;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;


}


export const PurchaseInvoiceSchema = SchemaFactory.createForClass(PurchaseInvoice);


export type PurchaseInvoiceDocument = HydratedDocument<PurchaseInvoice>;


