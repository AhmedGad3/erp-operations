import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash, sendEmail, TokenService } from '../Common';
import { UserRepository } from '../DB';
import { otpRepository } from '../DB/Models/Otp/otp.repository';
import { otpType } from '../DB/Models/Otp/otp.schema';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userRepository: UserRepository,
    private tokenService: TokenService,
    private readonly otpRepository: otpRepository,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async saveOtp(email: string, code: string, type: otpType): Promise<void> {
    // احذف أي OTP قديم لنفس الإيميل والنوع
    await this.otpRepository.deleteMany({ email, otp_type: type });

    const hashedCode = hash(code);
    await this.otpRepository.create({
      email,
      code: hashedCode,
      otp_type: type,
      // OTP صالح لمدة 10 دقائق
      expiresIn: new Date(Date.now() + 10 * 60 * 1000),
    });
  }

  private async validateOtp(email: string, code: string, type: otpType): Promise<void> {
    const otpEntry = await this.otpRepository.findOne({
      email,
      otp_type: type,
      expiresIn: { $gt: new Date() },
    });

    if (!otpEntry || !compare(code, otpEntry.code)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpRepository.deleteOne({ _id: otpEntry._id });
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // الخطوة 1: طلب OTP لتسجيل الدخول
  async requestLoginOtp(email: string) {
    this.logger.log(`Login OTP requested for ${email}`);
    const safeResponse = {
      message: 'If an account exists for this email, a login code has been sent.',
    };

    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      this.logger.warn(`Login OTP requested for unknown email: ${email}`);
      return safeResponse;
    }

    this.logger.log(`User found for login OTP: ${email}`);

    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.LOGIN_OTP);
    this.logger.log(`OTP saved for ${email}`);

    try {
      await sendEmail({
        to: email,
        from: process.env.EMAIL,
        subject: 'Your Login OTP',
        html: `
          <p>Your OTP code is <strong>${code}</strong>.</p>
          <p>Valid for 10 minutes.</p>
        `,
      });
      this.logger.log(`OTP email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send OTP email to ${email}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException('Failed to send OTP email');
    }

    return safeResponse;
  }

  // الخطوة 2: التحقق من OTP وتسجيل الدخول
  async verifyLoginOtp(email: string, code: string) {
    // تحقق من صحة OTP
    await this.validateOtp(email, code, otpType.LOGIN_OTP);

    // جلب بيانات المستخدم
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // توليد الـ Token
    const token = this.tokenService.sign(
      { _id: user._id },
      { secret: process.env.JWT_SECRET, expiresIn: '1d' },
    );

    return { message: 'Login successful', token };
  }
}
