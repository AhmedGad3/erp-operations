import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum StockMovementType {
    IN = 'IN',
    OUT = 'OUT',
   ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
    RETURN_IN = 'RETURN_IN',
    RETURN_OUT = 'RETURN_OUT',
    PROJECT_ISSUE = 'PROJECT_ISSUE',
    PROJECT_RETURN = 'PROJECT_RETURN',
}

@Schema({ timestamps: true })
export class StockMovement {

    @Prop({ required: true, unique: true, index: true })
    movementNo: number;

    @Prop({ type: Types.ObjectId, ref: 'Material', required: true, index: true })
    materialId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Unit', required: true }) 
    unitId: Types.ObjectId;

    @Prop({ required: true, enum: StockMovementType })
    type: StockMovementType;

    @Prop({ required: true, min: 0 })
    quantity: number;

    @Prop({ required: true })
    balanceAfter: number;

    @Prop({ type: Number, min: 0 })
    unitPrice?: number;

    @Prop({ required: true })
    referenceType: string;

    @Prop({ type: Types.ObjectId, required: true })
    referenceId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Project' })
    projectId?: Types.ObjectId;

    @Prop({ trim: true })
    notes?: string;

    @Prop({ required: true })
    movementDate: Date;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;
}

export const StockMovementSchema =
    SchemaFactory.createForClass(StockMovement);
export type StockMovementDocument =
    HydratedDocument<StockMovement>;

StockMovementSchema.index({ materialId: 1, movementDate: 1 });
StockMovementSchema.index({ projectId: 1 });
