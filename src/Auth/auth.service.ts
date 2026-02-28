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
    // Ã˜Â§Ã˜Â­Ã˜Â°Ã™Â Ã˜Â£Ã™Å  OTP Ã™â€šÃ˜Â¯Ã™Å Ã™â€¦ Ã™â€žÃ™â€ Ã™ÂÃ˜Â³ Ã˜Â§Ã™â€žÃ˜Â¥Ã™Å Ã™â€¦Ã™Å Ã™â€ž Ã™Ë†Ã˜Â§Ã™â€žÃ™â€ Ã™Ë†Ã˜Â¹
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

    await this.otpRepository.deleteOne({ _id: otpEntry._id });
  }
  async getProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // async signupService(signupDto: SignupDto): Promise<{ message: string }> {
  //   const { name, email } = signupDto;

  //   // Ã˜ÂªÃ˜Â­Ã™â€šÃ™â€š Ã˜Â¥Ã˜Â°Ã˜Â§ Ã˜Â§Ã™â€žÃ˜Â¥Ã™Å Ã™â€¦Ã™Å Ã™â€ž Ã™â€¦Ã™Ë†Ã˜Â¬Ã™Ë†Ã˜Â¯ Ã™â€¦Ã˜Â³Ã˜Â¨Ã™â€šÃ™â€¹Ã˜Â§
  //   const existingUser = await this.userRepository.findByEmail(email);
  //   if (existingUser) {
  //     throw new ConflictException('User already exists');
  //   }

  //   // Ã˜ÂªÃ™Ë†Ã™â€žÃ™Å Ã˜Â¯ Ã™Ë†Ã˜Â­Ã™ÂÃ˜Â¸ OTP
  //   const code = this.generateOtp();
  //   await this.saveOtp(email, code, otpType.CONFIRM_EMAIL);

  //   // Ã˜Â¥Ã˜Â±Ã˜Â³Ã˜Â§Ã™â€ž OTP Ã™â€žÃ™â€žÃ™â€¦Ã˜Â¯Ã™Å Ã˜Â±
  //   await sendEmail({
  //     to: process.env.EMAIL,
  //     subject: 'New Account Registration Request',
  //     html: `
  //       <h3>New registration request</h3>
  //       <p><strong>Email:</strong> ${email}</p>
  //       <p><strong>Name:</strong> ${name}</p>
  //       <p>The verification code is: <strong>${code}</strong></p>
  //       <p>Valid for 10 minutes.</p>
  //     `,
  //   });

  //   return {
  //     message:
  //       'OTP sent to manager. Please contact the manager to get the code and verify your account.',
  //   };
  // }

  /**
   * Step 2: Verify OTP and create user
  //  */
  // async verifyOtp(dto: VerifyOtpDto) {
  //   const { name, email, password, code } = dto;

  //   await this.validateOtp(email, code, otpType.CONFIRM_EMAIL);

  //   const existingUser = await this.userRepository.findByEmail(email);
  //   if (existingUser) {
  //     throw new ConflictException('User already exists');
  //   }

  //   const createdUser = await this.userRepository.create({
  //     name,
  //     email,
  //     password: hash(password),
  //   });

  //   return { message: 'User created successfully', data: createdUser };
  // }

  /**
   * Step 3: Login
   */
  async requestLoginOtp(email: string) {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.LOGIN_OTP);

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
    // Ã˜ÂªÃ˜Â­Ã™â€šÃ™â€š Ã™â€¦Ã™â€  Ã˜ÂµÃ˜Â­Ã˜Â© OTP
    await this.validateOtp(email, code, otpType.LOGIN_OTP);

    // Ã˜Â¬Ã™â€žÃ˜Â¨ Ã˜Â¨Ã™Å Ã˜Â§Ã™â€ Ã˜Â§Ã˜Âª Ã˜Â§Ã™â€žÃ™â€¦Ã˜Â³Ã˜ÂªÃ˜Â®Ã˜Â¯Ã™â€¦
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Ã˜ÂªÃ™Ë†Ã™â€žÃ™Å Ã˜Â¯ Ã˜Â§Ã™â€žÃ™â‚¬ Token
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
