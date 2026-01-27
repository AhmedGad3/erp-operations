// project.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum ProjectStatus {
    PLANNED = 'PLANNED',
    IN_PROGRESS = 'IN_PROGRESS',
    ON_HOLD = 'ON_HOLD',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    CLOSED = 'CLOSED',
}

export interface ProjectVirtuals {
    contractRemaining: number;
    expectedProfit: number;
    realizedProfit: number;
    completionPercentage: number;
    profitMargin: number;
    realizedProfitMargin: number;
}

@Schema({ timestamps: true, collection: 'projects' })
export class Project {
    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ required: true, trim: true })
    nameEn: string;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
    clientId: Types.ObjectId;

    @Prop({ trim: true })
    projectManager?: string;

    @Prop({ trim: true })
    siteEngineer?: string;

    @Prop({ trim: true })
    location?: string;

    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date })
    expectedEndDate?: Date;

    @Prop({ type: Date })
    actualEndDate?: Date;

    // ============ 💰 المالية ============
    @Prop({ type: Number, required: true, min: 0 })
    contractAmount: number; // قيمة العقد (ثابت)

    @Prop({ type: Number, default: 0, min: 0 })
    totalPaid: number; // المبلغ المدفوع من العقد (يتحدث)

    @Prop({ type: Number, default: 0, min: 0 })
    totalInvoiced: number; // مجموع فواتير المواد (للمراجعة فقط)

    // ============ 💸 التكاليف ============
    @Prop({ type: Number, default: 0, min: 0 })
    materialCosts: number;

    @Prop({ type: Number, default: 0, min: 0 })
    laborCosts: number;

    @Prop({ type: Number, default: 0, min: 0 })
    equipmentCosts: number;

    @Prop({ type: Number, default: 0, min: 0 })
    otherCosts: number;

    @Prop({ type: Number, default: 0, min: 0 })
    totalCosts: number;

    // ============ تفاصيل العمالة ============
    @Prop({
        type: {
            numberOfWorkers: { type: Number, default: 0, min: 0 },
            monthlyCost: { type: Number, default: 0, min: 0 },
            numberOfMonths: { type: Number, default: 0, min: 0 },
            totalCost: { type: Number, default: 0, min: 0 },
            notes: String,
        },
        _id: false,
    })
    laborDetails?: {
        numberOfWorkers: number;
        monthlyCost: number;
        numberOfMonths: number;
        totalCost: number;
        notes?: string;
    };

    // ============ الحالة ============
    @Prop({
        type: String,
        enum: Object.values(ProjectStatus),
        default: ProjectStatus.PLANNED,
        index: true,
    })
    status: ProjectStatus;

    @Prop()
    notes?: string;

    @Prop({ default: true, index: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy: Types.ObjectId;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
export type TProject = HydratedDocument<Project> & ProjectVirtuals;

// ✅ Indexes
ProjectSchema.index({ clientId: 1, isActive: 1 });
ProjectSchema.index({ status: 1, isActive: 1 });

// ============ 📊 Virtuals للحسابات ============

// ✅ JSON settings
ProjectSchema.set('toJSON', { virtuals: true });
ProjectSchema.set('toObject', { virtuals: true });


// الباقي من العقد الأساسي
ProjectSchema.virtual('contractRemaining').get(function () {
    return this.contractAmount - this.totalPaid;
});

// الربح المتوقع النهائي (لو العميل دفع كل الفلوس)
ProjectSchema.virtual('expectedProfit').get(function () {
    return this.contractAmount - this.totalCosts;
});

// الربح المحقق لحد دلوقتي (الفلوس اللي قبضتها - التكاليف)
ProjectSchema.virtual('realizedProfit').get(function () {
    return this.totalPaid - this.totalCosts;
});

// نسبة الإنجاز (بناءً على المدفوعات)
ProjectSchema.virtual('completionPercentage').get(function () {
    if (this.contractAmount === 0) return 0;
    return (this.totalPaid / this.contractAmount) * 100;
});

// هامش الربح المتوقع
ProjectSchema.virtual('profitMargin').get(function (this: TProject) {
    if (this.contractAmount === 0) return 0;
    const expectedProfit = this.contractAmount - this.totalCosts;
    return (expectedProfit / this.contractAmount) * 100;
});

// هامش الربح المحقق
ProjectSchema.virtual('realizedProfitMargin').get(function (this: TProject) {
    if (this.totalPaid === 0) return 0;
    const realizedProfit = this.totalPaid - this.totalCosts;
    return (realizedProfit / this.totalPaid) * 100;
});