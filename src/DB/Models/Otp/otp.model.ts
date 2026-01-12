import { MongooseModule } from '@nestjs/mongoose';
import { OTP, otpSchema } from './otp.schema';

// model
export const OtpModel = MongooseModule.forFeature([
  { name: OTP.name, schema: otpSchema },
]);
