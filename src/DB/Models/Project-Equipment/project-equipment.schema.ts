import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum EquipmentSource {
    COMPANY_ASSET = 'COMPANY_ASSET', // من عندنا
    EXTERNAL_RENTAL = 'EXTERNAL_RENTAL', // من بره
}

@Schema({ timestamps: true, collection: 'project_equipment' })
export class ProjectEquipment {
    @Prop({ type: Types.ObjectId, ref: 'Project', required: true, index: true })
    projectId: Types.ObjectId;

    @Prop({
        type: String,
        enum: Object.values(EquipmentSource),
        required: true,
        index: true,
    })
    equipmentSource: EquipmentSource;

    // ============ لو COMPANY_ASSET ============
    @Prop({ type: Types.ObjectId, ref: 'Asset' })
    assetId?: Types.ObjectId;

    // ============ لو EXTERNAL_RENTAL ============
    @Prop({ trim: true })
    equipmentName?: string; // اسم المعدة المستأجرة

    @Prop({ trim: true })
    supplierName?: string; // اسم المورد (نص حر)

    // ============ تفاصيل الإيجار (مشترك) ============
    @Prop({ type: Number, required: true, min: 1 })
    numberOfDays: number; // عدد الأيام

    @Prop({ type: Number, required: true, min: 0 })
    dailyRentalRate: number; // سعر الإيجار اليومي

    @Prop({ type: Number, required: true, min: 0 })
    rentalCost: number; // إجمالي الإيجار (numberOfDays × dailyRentalRate)

    // ============ تكاليف التشغيل (للمعدات بتاعتنا بس) ============
    @Prop({ type: Number, default: 0, min: 0 })
    fuelCost: number; // بنزين

    @Prop({ type: Number, default: 0, min: 0 })
    operatorCost: number; // سائق/مشغل

    @Prop({ type: Number, default: 0, min: 0 })
    maintenanceCost: number; // صيانة

    @Prop({ type: Number, default: 0, min: 0 })
    otherOperatingCost: number; // تكاليف تشغيل أخرى

    @Prop({ type: Number, default: 0, min: 0 })
    totalOperatingCost: number; // مجموع تكاليف التشغيل

    // ============ المجموع الكلي ============
    @Prop({ type: Number, required: true, min: 0 })
    totalCost: number; // rentalCost + totalOperatingCost

    // ============ التواريخ ============
    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date })
    endDate?: Date;

    @Prop()
    notes?: string;

    @Prop({ default: true, index: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const ProjectEquipmentSchema = SchemaFactory.createForClass(ProjectEquipment);
export type TProjectEquipment = HydratedDocument<ProjectEquipment>;

// ✅ Indexes
ProjectEquipmentSchema.index({ projectId: 1, isActive: 1 });
ProjectEquipmentSchema.index({ assetId: 1, isActive: 1 });
ProjectEquipmentSchema.index({ equipmentSource: 1 });
ProjectEquipmentSchema.index({ startDate: 1, endDate: 1 });