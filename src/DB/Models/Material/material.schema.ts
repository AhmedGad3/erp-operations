import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { MainCategory } from "src/Common/Enums";
import { MaterialUnit, MaterialUnitSchema } from "./material-unit.schema";

@Schema({ timestamps: true })
export class Material {


    @Prop({ required: true, trim: true })
    nameAr: string;

    @Prop({ required: true, trim: true })
    nameEn: string;

    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ required: true, enum: MainCategory, default: MainCategory.OTHERS })
    mainCategory: string;

    @Prop({ required: true, trim: true })
    subCategory: string;

    @Prop({ required: true, type: Types.ObjectId, ref: 'Unit' })
    baseUnit: Types.ObjectId;

    @Prop({ type: [MaterialUnitSchema], default: [] })
    alternativeUnits: MaterialUnit[];


    @Prop({ type: Number, default: 0, min: 0 })
    currentStock: number;

    @Prop({ type: Number, default: 0, min: 0 })
    minStockLevel: number;

    @Prop({ type: Number, default: 0, min: 0 })
    lastPurchasePrice: number;


    @Prop({ type: Date })
    lastPurchaseDate: Date

    @Prop({ trim: true })
    description?: string;

    @Prop({ default: true, index: true })
    isActive: boolean;

    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    createdBy: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    updatedBy?: Types.ObjectId;

}

export const MaterialSchema = SchemaFactory.createForClass(Material);

export type TMaterial = HydratedDocument<Material>


MaterialSchema.set('toJSON', { virtuals: true });
MaterialSchema.set('toObject', { virtuals: true });

// export interface ICreateMaterialData {
//     nameAr: string;
//     nameEn: string;
//     code: string;
//     mainCategory: string;
//     subCategory: string;
//     baseUnit: Types.ObjectId;
//     alternativeUnits?: Array<{
//         unitId: Types.ObjectId;
//         conversionFactor: number;
//         isDefaultPurchase?: boolean;
//         isDefaultIssue?: boolean;
//     }>;
//     minStockLevel?: number;
//     description?: string;
//     createdBy: Types.ObjectId;
// }