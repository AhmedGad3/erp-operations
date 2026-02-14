import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'project_miscellaneous' })
export class ProjectMiscellaneous {
    @Prop({ type: Types.ObjectId, ref: 'Project', required: true })
    projectId: Types.ObjectId;

    @Prop({ type: Date, required: true, index: true })
    date: Date;

    @Prop({ required: true, trim: true })
    description: string; // شاي، أكل، مواصلات، إلخ

    @Prop({ type: Number, required: true, min: 0 })
    amount: number;

    @Prop({ trim: true })
    category?: string; // ضيافة، مواصلات، كهرباء، إلخ (نص حر)

    @Prop()
    notes?: string;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const ProjectMiscellaneousSchema = SchemaFactory.createForClass(ProjectMiscellaneous);
export type TProjectMiscellaneous = HydratedDocument<ProjectMiscellaneous>;

// ✅ Indexes
ProjectMiscellaneousSchema.index({ projectId: 1 });
ProjectMiscellaneousSchema.index({ category: 1 });
