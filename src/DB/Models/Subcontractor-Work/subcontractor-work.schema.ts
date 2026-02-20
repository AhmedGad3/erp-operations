import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SubcontractorWork {
    @Prop({ required: true, unique: true })
    workNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
    project: Types.ObjectId;

    @Prop({ required: true, trim: true })
    contractorName: string;

    @Prop({ required: true, trim: true })
    itemDescription: string;

    @Prop({ trim: true })
    unit?: string;

    @Prop({ required: true, type: Number, min: 0 })
    quantity: number;

    @Prop({ required: true, type: Number, min: 0 })
    unitPrice: number;

    @Prop({ type: Number, min: 0 })
    totalAmount: number;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const SubcontractorWorkSchema = SchemaFactory.createForClass(SubcontractorWork);
export type TSubcontractorWork = HydratedDocument<SubcontractorWork>;

// Auto-calculate totalAmount before save
SubcontractorWorkSchema.pre('save', function (next) {
    this.totalAmount = this.quantity * this.unitPrice;
    next();
});

// Also handle findOneAndUpdate
SubcontractorWorkSchema.pre('findOneAndUpdate', function (next) {
    const update = this.getUpdate() as any;
    if (update?.quantity !== undefined || update?.unitPrice !== undefined) {
        const quantity = update.quantity ?? update.$set?.quantity;
        const unitPrice = update.unitPrice ?? update.$set?.unitPrice;
        if (quantity !== undefined && unitPrice !== undefined) {
            update.totalAmount = quantity * unitPrice;
        }
    }
    next();
});

SubcontractorWorkSchema.index({ project: 1, contractorName: 1 });
SubcontractorWorkSchema.index({ workNo: 1 });
SubcontractorWorkSchema.index({ isActive: 1, project: 1 });

SubcontractorWorkSchema.set('toJSON', { virtuals: true });
SubcontractorWorkSchema.set('toObject', { virtuals: true });