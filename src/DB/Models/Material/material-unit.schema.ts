import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";


@Schema({timestamps: true})
export class MaterialUnit {

    @Prop({type: Types.ObjectId, ref: "Unit", required: true})
    unitId: Types.ObjectId;

    @Prop({type: Number, required: true, min: 0.000001})
    conversionFactor: number;

    @Prop({ default: false })
    isDefaultPurchase: boolean;
    
    @Prop({ default: false })
    allowOverride: boolean;

    @Prop({ default: false })
    isDefaultIssue: boolean;

}

export const MaterialUnitSchema = SchemaFactory.createForClass(MaterialUnit);