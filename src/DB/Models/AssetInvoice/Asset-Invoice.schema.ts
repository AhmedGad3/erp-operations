import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AssetInvoicePaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CHEQUE = 'CHEQUE',
}

@Schema({ timestamps: true, collection: 'asset-invoices' })
export class AssetInvoice {
    @Prop({ required: true, unique: true })
    invoiceNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Asset', required: true })
    asset: Types.ObjectId;

    @Prop({ required: true, trim: true })
    vendorName: string;

    @Prop({ required: true, type: Number, min: 0 })
    amount: number;

    @Prop({ required: true, type: Date })
    invoiceDate: Date;

    @Prop({
        required: true,
        enum: Object.values(AssetInvoicePaymentMethod),
        default: AssetInvoicePaymentMethod.CASH,
    })
    paymentMethod: AssetInvoicePaymentMethod;

    @Prop({ trim: true })
    referenceNo?: string;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const AssetInvoiceSchema = SchemaFactory.createForClass(AssetInvoice);
export type TAssetInvoice = HydratedDocument<AssetInvoice>;

// Indexes
AssetInvoiceSchema.index({ invoiceNo: 1 });
AssetInvoiceSchema.index({ asset: 1 });
AssetInvoiceSchema.index({ isActive: 1, invoiceDate: -1 });