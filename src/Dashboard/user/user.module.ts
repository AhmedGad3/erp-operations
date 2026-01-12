import { Module } from '@nestjs/common';
import { UserModel, UserRepository } from '../../DB';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { otpRepository } from '../../DB/Models/Otp/otp.repository';
import { OtpModel } from '../../DB/Models/Otp/otp.model';
import { CloudService } from '../../Common/Services/cloud.service';

@Module({
  imports: [UserModel, OtpModel],
controllers: [UserController],
  providers: [UserRepository,otpRepository, UserService, CloudService],
})
export class UserModule {}
