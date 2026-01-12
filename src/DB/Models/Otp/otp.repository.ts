import { Injectable } from "@nestjs/common";
import { DBService } from "src/DB/db.service";
import { OTP, TOtp } from "./otp.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";


@Injectable()
export class  otpRepository extends DBService<TOtp> {
    constructor (@InjectModel(OTP.name) private readonly otpModel: Model<TOtp>){
        super(otpModel)
    }

    validateOtp (email: string, otp_type: string) : Promise<TOtp | null> {
        return this.findOne({
            email,
            otp_type,
            expiresIn: {$gt: new Date()}
        });
    }
}