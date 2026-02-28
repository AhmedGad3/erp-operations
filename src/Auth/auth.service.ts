import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash, sendEmail, TokenService } from '../Common';
import { UserRepository } from '../DB';
import { SignupDto, VerifyOtpDto } from './dto/index';
import { otpRepository } from '../DB/Models/Otp/otp.repository';
import { otpType } from '../DB/Models/Otp/otp.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private tokenService: TokenService,
    private readonly otpRepository: otpRepository,
  ) {}

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async saveOtp(
    email: string,
    code: string,
    type: otpType,
  ): Promise<void> {
    // Ø§Ø­Ø°Ù Ø£ÙŠ OTP Ù‚Ø¯ÙŠÙ… Ù„Ù†ÙØ³ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ ÙˆØ§Ù„Ù†ÙˆØ¹
    await this.otpRepository.deleteMany({ email, otp_type: type });

    const hashedCode = hash(code);
    await this.otpRepository.create({
      email,
      code: hashedCode,
      otp_type: type,
      // OTP valid for  10 minutes
      expiresIn: new Date(Date.now() + 10 * 60 * 1000),
    });
  }

  private async validateOtp(
    email: string,
    code: string,
    type: otpType,
  ): Promise<void> {
    const otpEntry = await this.otpRepository.findOne({
      email,
      otp_type: type,
      expiresIn: { $gt: new Date() },
    });

    if (!otpEntry || !compare(code, otpEntry.code)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Ø­Ø°Ù Ø§Ù„Ù€ OTP Ø¨Ø¹Ø¯ Ø§Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù…
    await this.otpRepository.deleteOne({ _id: otpEntry._id });
  }

  async signupService(signupDto: SignupDto): Promise<{ message: string }> {
    const { name, email } = signupDto;

    // ØªØ­Ù‚Ù‚ Ø¥Ø°Ø§ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ù…ÙˆØ¬ÙˆØ¯ Ù…Ø³Ø¨Ù‚Ù‹Ø§
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // ØªÙˆÙ„ÙŠØ¯ ÙˆØ­ÙØ¸ OTP
    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.CONFIRM_EMAIL);

    // Ø¥Ø±Ø³Ø§Ù„ OTP Ù„Ù„Ù…Ø¯ÙŠØ±
    await sendEmail({
      to: process.env.EMAIL,
      subject: 'New Account Registration Request',
      html: `
        <h3>New registration request</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p>The verification code is: <strong>${code}</strong></p>
        <p>Valid for 10 minutes.</p>
      `,
    });

    return {
      message:
        'OTP sent to manager. Please contact the manager to get the code and verify your account.',
    };
  }

  /**
   * Step 2: Verify OTP and create user
   */
  async verifyOtp(dto: VerifyOtpDto) {
    const { name, email, password, code } = dto;

    // ØªØ­Ù‚Ù‚ Ù…Ù† ØµØ­Ø© OTP
    await this.validateOtp(email, code, otpType.CONFIRM_EMAIL);

    // ØªØ­Ù‚Ù‚ Ø¥Ø°Ø§ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ Ù…ÙˆØ¬ÙˆØ¯ (Ø­Ù…Ø§ÙŠØ© Ù…Ø²Ø¯ÙˆØ¬Ø©)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const createdUser = await this.userRepository.create({
      name,
      email,
      password: hash(password),
    });

    return { message: 'User created successfully', data: createdUser };
  }

  /**
   * Step 3: Login
   */
  async requestLoginOtp(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ØªÙˆÙ„ÙŠØ¯ ÙˆØ­ÙØ¸ OTP
    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.LOGIN_OTP);

    // Ø¥Ø±Ø³Ø§Ù„ OTP Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…
    await sendEmail({
      to: email,
      from: process.env.EMAIL,
      subject: 'Your Login OTP',
      html: `
        <p>Your OTP code is <strong>${code}</strong>.</p>
        <p>Valid for 10 minutes.</p>
      `,
    });

    return { message: 'OTP sent to your email' };
  }

  // Step 2: Verify OTP and login
  async verifyLoginOtp(email: string, code: string) {
    // ØªØ­Ù‚Ù‚ Ù…Ù† ØµØ­Ø© OTP
    await this.validateOtp(email, code, otpType.LOGIN_OTP);

    // Ø¬Ù„Ø¨ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // ØªÙˆÙ„ÙŠØ¯ Ø§Ù„Ù€ Token
    const token = this.tokenService.sign(
      { _id: user._id },
      { secret: process.env.JWT_SECRET, expiresIn: '1d' },
    );

    return { message: 'Login successful', token };
  }
}

// async signupService(signupDto: SignupDto): Promise<{ message: string }> {
//   const { name, email, password } = signupDto;
//   // check if user exists
//   const user = await this.userRepository.findByEmail(email);

//   if (user) throw new ConflictException('User already exists');

//   // create user
//  await this.userRepository.create({
//     name,
//     email,
//     password: hash(password),
//   });

//   const code = Math.floor(100000 + Math.random() * 900000).toString();
//   const hashedCode = hash(code);

//   await this.otpRepository.create({
//     email,
//     code: hashedCode,
//     otp_type: otpType.confirmEmail,
//     expiresIn: new Date(Date.now() + 10 * 60 * 1000),
//   });

//   sendEmail({
//     to: process.env.EMAIL,
//     from: process.env.EMAIL,
//     subject: 'new account Register ',
//     html: `<p>Hi ${email} is tring to register his ${code} is valid for 10 minutes</p>`,
//   });

//   return { message: 'OTP sent to manger, please verify it to complete signup' };
// }

// async verifyOtp(dto: VerifyOtpDto) {
//   const { email, code, name, password } = dto;

//   const otpEntry = await this.otpRepository.validateOtp(email, 'confirm-email');
//   if (!otpEntry || !compare(code, otpEntry.code)) {
//     throw new BadRequestException('Invalid or expired OTP');
//   }

//   const createdUser = await this.userRepository.create({
//     name,
//     email,
//     password: hash(password),
//   });

//   await this.otpRepository.deleteOne({ _id: otpEntry._id });

//   return { message: 'User created successfully', data: createdUser };
// }
// async loginService(loginDto: LoginDto) {
//   const { email, password } = loginDto;
//   // check if user exists
//   const user = await this.userRepository.findByEmail(email);
//   if (!user) throw new NotFoundException('User not found');

//   // compare password
//   if (!compare(password, user.password))
//     throw new NotFoundException('Invalid email or password');

//   // generate token
//   const token = this.tokenService.sign(
//     { _id: user._id },
//     { secret: process.env.JWT_SECRET, expiresIn: '1h' },
//   );
//   return token;
// }
