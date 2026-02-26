import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export enum AssetStatus {
    AVAILABLE = 'AVAILABLE',
    IN_USE = 'IN_USE',
    MAINTENANCE = 'MAINTENANCE',
    RETIRED = 'RETIRED',
}

@Schema({ timestamps: true, collection: 'assets' })
export class Asset {
    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ required: true, trim: true })
    nameEn: string;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ required: true, trim: true })
    assetTypeAr: string;

    @Prop({ required: true, trim: true })
    assetTypeEn: string;

  

    @Prop({
        type: String,
        enum: Object.values(AssetStatus),
        default: AssetStatus.AVAILABLE,
        
    })
    status: AssetStatus;

    @Prop()
    notes?: string;

    @Prop({ default: true, index: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const AssetSchema = SchemaFactory.createForClass(Asset);
export type TAsset = HydratedDocument<Asset>;

// ✅ Indexes
AssetSchema.index({ status: 1, isActive: 1 });