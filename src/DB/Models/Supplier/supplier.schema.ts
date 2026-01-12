import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Supplier extends Document {
    @Prop({ required: true, trim: true, index: true })
    nameAr: string;

    @Prop({ required: true, trim: true, index: true })
    nameEn: string;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({ trim: true })
    email?: string;

    @Prop({ trim: true })
    address?: string;

    @Prop({ type: Number, default: 30, min: 0 })
    defaultCreditDays: number;

    @Prop({ trim: true })
    taxId?: string;

    @Prop({ trim: true })
    commercialRegister?: string;

    @Prop({ trim: true })
    bankAccount?: string;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ default: true, index: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);
export type TSupplier = HydratedDocument<Supplier>;

// Indexes
// SupplierSchema.index({ nameAr: 'text', nameEn: 'text', code: 'text' });