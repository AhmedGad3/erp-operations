import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, SignupDto, VerifyLoginOtpDto, VerifyOtpDto } from './dto';
import { Auth } from '../Common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Auth('admin')
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    const result = await this.authService.signupService(signupDto);
    return {
      message: result.message,
    };
  }

  
  @Post('verify-signup')
  async verifySignup(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto);
  }

  
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
