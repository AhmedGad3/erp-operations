import { Global, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserRepository } from '../DB/Models/User/user.repository';
import { UserModel } from '../DB/Models/User/user.model';
import { TokenService } from '../Common';
import { JwtService } from '@nestjs/jwt';
import { otpRepository } from '../DB/Models/Otp/otp.repository';
import { OtpModel } from '../DB/Models/Otp/otp.model';


@Global()
@Module({
  imports: [UserModel, OtpModel],
  controllers: [AuthController],
  providers: [AuthService, otpRepository,  UserRepository, TokenService, JwtService],
  exports: [TokenService, JwtService, UserRepository],
})
export class AuthModule {}
