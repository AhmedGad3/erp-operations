import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, HydratedDocument, Types } from 'mongoose';
import { UserRoles } from '../../../Common/Enums';

//class schema
@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ type: String, required: true, minlength: 3 })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true, minlength: 6 })
  password: string;

  @Prop({ type: String, enum: UserRoles, default: UserRoles.USER })
  role: string;

  @Prop({ type: Boolean, default: false })
  isDeleted: boolean;

  @Prop({type: Types.ObjectId, ref: 'User'})
  createdBy: Types.ObjectId;

  @Prop({type: Types.ObjectId, ref: 'User'})
  updatedBy: Types.ObjectId;
}

//schema
export const userSchema = SchemaFactory.createForClass(User);

//type
export type TUser = HydratedDocument<User> & Document;
