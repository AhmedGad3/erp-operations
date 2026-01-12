import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ClientType } from 'src/Common/Enums';

@Schema({ timestamps: true })
export class Client {
    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ required: true, trim: true })
    nameEn: string;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ trim: true })
    phone?: string;

    @Prop({ trim: true })
    address?: string;

    @Prop({ trim: true, lowercase: true })
    email?: string;

    @Prop({ trim: true })
    taxNumber?: string;

    @Prop({ trim: true })
    commercialRegister?: string;

    @Prop({ type: String, enum: ClientType, default: ClientType.INDIVIDUAL })
    type: ClientType;

    @Prop({ type: String })
    notes?: string;

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;
}

export const ClientSchema = SchemaFactory.createForClass(Client);
export type TClient = HydratedDocument<Client>;

// ✅ Virtual populate
ClientSchema.virtual('projects', {
    ref: 'Project',
    localField: '_id',
    foreignField: 'clientId',
    match: { isActive: true },
});

// ✅ Enable virtuals in JSON
ClientSchema.set('toJSON', { virtuals: true });
ClientSchema.set('toObject', { virtuals: true });