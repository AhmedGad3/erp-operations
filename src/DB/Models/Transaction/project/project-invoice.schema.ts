import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ProjectInvoiceStatus {
    OPEN = 'OPEN',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
}

@Schema({ timestamps: true })
export class ProjectInvoice {
    @Prop({ required: true, unique: true, index: true })
    invoiceNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
    clientId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
    projectId: Types.ObjectId;

    @Prop({ required: true })
    invoiceDate: Date;

    @Prop({
        type: [
            {
                materialId: { type: Types.ObjectId, ref: 'Material', required: true },
                unitId: { type: Types.ObjectId, ref: 'Unit', required: true }, // ✅ الوحدة
                quantity: { type: Number, required: true, min: 0.0001 },
                unitPrice: { type: Number, required: true, min: 0 },
                total: { type: Number, required: true, min: 0 },
            },
        ],
        required: true,
    })
    items: Array<{
        materialId: Types.ObjectId;
        unitId: Types.ObjectId;  // ✅
        quantity: number;
        unitPrice: number;
        total: number;
    }>;

    @Prop({ required: true, min: 0 })
    totalAmount: number;

    @Prop({ default: 0, min: 0 })
    paidAmount: number;

    @Prop({ required: true, min: 0 })
    remainingAmount: number;

    @Prop({
        type: String,
        enum: Object.values(ProjectInvoiceStatus),
        default: ProjectInvoiceStatus.OPEN,
        index: true,
    })
    status: ProjectInvoiceStatus;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'MaterialIssue' })
    materialIssueId?: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const ProjectInvoiceSchema = SchemaFactory.createForClass(ProjectInvoice);
export type ProjectInvoiceDocument = HydratedDocument<ProjectInvoice>;

ProjectInvoiceSchema.index({ projectId: 1, status: 1 });
ProjectInvoiceSchema.index({ clientId: 1, invoiceDate: 1 });