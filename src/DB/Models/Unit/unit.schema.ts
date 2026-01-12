import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, HydratedDocument, Types } from "mongoose";
import { UnitCategory } from "src/Common/Enums";




@Schema({timestamps: true})
export class Unit extends Document {
    
    @Prop({required: true,  trim: true})
    nameAr : string;

    @Prop({required: true,  trim: true})
    nameEn : string;


    @Prop({required: true, unique: true, uppercase: true, trim: true })
    code:string
    
    @Prop({required: true,  trim: true})
    symbol : string;
    
    @Prop({required: true,  enum: UnitCategory})
    category : string;
    

    @Prop({ trim: true })
  description?: string;


    @Prop({required: true, default: 1})
    conversionFactor : number;
    
    @Prop({ default: false })
    isBase: boolean; 

    @Prop({ type: Types.ObjectId, ref: 'Unit', index: true })
  baseUnitId?: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;

     @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;


  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId

}

export const UnitSchema = SchemaFactory.createForClass(Unit);

export type TUnit = HydratedDocument<Unit> ;

UnitSchema.index({ category: 1, isBase: 1, isActive: 1 });
UnitSchema.index({ baseUnitId: 1, isActive: 1 });

// Text search index
UnitSchema.index({ nameAr: 'text', nameEn: 'text', code: 'text' });

UnitSchema.pre('save', function(next) {
  if (this.isBase && this.conversionFactor !== 1) {
    return next(new Error( 'Base unit must have conversionFactor = 1' ));
  }

  if (!this.isBase && !this.baseUnitId) {
    return next(new Error('Derived unit must have baseUnitId'));
  }

  if (this.isBase && this.baseUnitId) {
    this.baseUnitId = undefined;
  }

  next();
});