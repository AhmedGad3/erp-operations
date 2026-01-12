import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';


@Schema({ timestamps: true })
export class PurchaseReturn {
    @Prop({ required: true, unique: true })
    returnNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Supplier', required: true })
    supplierId: Types.ObjectId;

    @Prop({ required: true })
    returnDate: Date;

    @Prop([
        {
            materialId: { type: Types.ObjectId, ref: 'Material', required: true },
             unitId: { type: Types.ObjectId, ref: 'Unit', required: true },
            quantity: { type: Number, required: true },
            unitPrice: { type: Number, required: true },
            total: { type: Number, required: true },
        },
    ])
    items: {
        materialId: Types.ObjectId;
         unitId: Types.ObjectId;
        quantity: number;
        unitPrice: number;
        total: number;
    }[];

    @Prop({ required: true })
    totalAmount: number;

    @Prop()
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    createdBy: Types.ObjectId;
}

export const PurchaseReturnSchema =
    SchemaFactory.createForClass(PurchaseReturn);

export type PurchaseReturnDocument = HydratedDocument<PurchaseReturn>;
