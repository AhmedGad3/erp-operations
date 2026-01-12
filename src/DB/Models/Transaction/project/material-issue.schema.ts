import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true })
export class MaterialIssue {
    @Prop({ required: true, unique: true, index: true })
    issueNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
    projectId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
    clientId: Types.ObjectId;

    @Prop({ required: true })
    issueDate: Date;

    @Prop({
        type: [
            {
                materialId: { type: Types.ObjectId, ref: 'Material', required: true },
                unitId: { type: Types.ObjectId, ref: 'Unit', required: true }, // ✅ الوحدة
                quantity: { type: Number, required: true, min: 0.0001 },
                // unitCost: { type: Number, required: true, min: 0 },
                
                unitPrice: { type: Number, required: true, min: 0 },
                // totalCost: { type: Number, required: true, min: 0 },
                totalPrice: { type: Number, required: true, min: 0 },
            },
        ],
        required: true,
    })
    items: Array<{
        materialId: Types.ObjectId;
        unitId: Types.ObjectId;  // ✅
        quantity: number;
        unitCost: number;
        // unitPrice: number;
        // totalCost: number;
        totalPrice: number;
    }>;

    @Prop({ required: true, min: 0 })
    totalCost: number;

    @Prop({ required: true, min: 0 })
    totalPrice: number;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const MaterialIssueSchema = SchemaFactory.createForClass(MaterialIssue);
export type MaterialIssueDocument = HydratedDocument<MaterialIssue>;

MaterialIssueSchema.index({ projectId: 1, issueDate: 1 });
MaterialIssueSchema.index({ clientId: 1, issueDate: 1 });