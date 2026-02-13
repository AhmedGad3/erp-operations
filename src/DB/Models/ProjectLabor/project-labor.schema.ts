import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'project_labor' })
export class ProjectLabor {
    @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
    projectId: Types.ObjectId;

    @Prop({ required: true, trim: true })
    workerName: string;

    @Prop({ required: true, trim: true })
    specialty: string; // نجار، حداد، عامل بناء، إلخ

    @Prop({ trim: true })
    taskDescription?: string; // وصف الشغلانة

    @Prop({ type: Number, required: true, min: 1 })
    numberOfDays: number;

    @Prop({ type: Number, required: true, min: 0 })
    dailyRate: number;

    @Prop({ type: Number, required: true, min: 0 })
    laborCost: number; // numberOfDays × dailyRate

    @Prop({ type: Number, default: 0, min: 0 })
    materialCost: number; // المواد اللي العامل جابها معاه (اختياري)

    @Prop({ type: Number, required: true, min: 0 })
    totalCost: number; // laborCost + materialCost

    @Prop({ type: Date, required: true })
    startDate: Date;

    @Prop({ type: Date })
    endDate?: Date;

    @Prop()
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const ProjectLaborSchema = SchemaFactory.createForClass(ProjectLabor);
export type TProjectLabor = HydratedDocument<ProjectLabor>;

// ✅ Indexes
ProjectLaborSchema.index({ projectId: 1 });
ProjectLaborSchema.index({ startDate: 1, endDate: 1 });
ProjectLaborSchema.index({ workerName: 1 });