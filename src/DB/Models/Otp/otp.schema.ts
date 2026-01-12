import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";


export enum otpType {
    CONFIRM_EMAIL = 'confirmEmail',
    RESET_PASSWORD = 'resetPassword',
    LOGIN_OTP = 'loginOtp'
} 

@Schema({timestamps: true})
export class OTP {

    @Prop({type: String, required: true })
    email: string;

    @Prop({type: String, required: true})
    code: string;

    @Prop({type: String, enum: otpType, required: true})
    otp_type: string;

    @Prop({type: Date, required: true})
    expiresIn : Date;
}

export const otpSchema = SchemaFactory.createForClass(OTP);

export type TOtp = HydratedDocument<OTP> & Document;