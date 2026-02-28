import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';

type AuthenticatedRequest = Request & { user: { _id: string } };
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, VerifyLoginOtpDto, VerifyOtpDto } from './dto';
import { Auth } from '../Common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth()
  @Get('me')
  async getProfile(@Req() req: AuthenticatedRequest) {
    return this.authService.getProfile(req.user._id);
  }

  // @Auth('admin')
  // @Post('signup')
  // async signup(@Body() signupDto: SignupDto) {
  //   const result = await this.authService.signupService(signupDto);
  //   return {
  //     message: result.message,
  //   };
  // }

  // @Post('verify-signup')
  // async verifySignup(@Body() dto: VerifyOtpDto) {
  //   return this.authService.verifyOtp(dto);
  // }

  @Post('login')
  async requestLogin(@Body() loginDto: LoginDto) {
    const result = await this.authService.requestLoginOtp(loginDto.email);
    return {
      message: result.message,
    };
  }

  @Post('verify-login')
  async verifyLogin(@Body() dto: VerifyLoginOtpDto) {
    return this.authService.verifyLoginOtp(dto.email, dto.code);
  }
}
