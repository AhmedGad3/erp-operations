import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { compare, hash, sendEmail, TokenService } from '../Common';
import { TUser, UserRepository } from '../DB';
import { LoginDto, SignupDto, VerifyOtpDto } from './dto/index';
import { otpRepository } from 'src/DB/Models/Otp/otp.repository';
import { otpType } from 'src/DB/Models/Otp/otp.schema';

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
    // احذف أي OTP قديم لنفس الإيميل والنوع
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

    if (!otpEntry || !(await compare(code, otpEntry.code))) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // حذف الـ OTP بعد الاستخدام
    await this.otpRepository.deleteOne({ _id: otpEntry._id });
  }

  async signupService(signupDto: SignupDto): Promise<{ message: string }> {
    const { name, email } = signupDto;

    // تحقق إذا الإيميل موجود مسبقًا
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // توليد وحفظ OTP
    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.CONFIRM_EMAIL);

    // إرسال OTP للمدير
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

    // تحقق من صحة OTP
    await this.validateOtp(email, code, otpType.CONFIRM_EMAIL);

    // تحقق إذا الإيميل موجود (حماية مزدوجة)
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    // إنشاء المستخدم
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

    // توليد وحفظ OTP
    const code = this.generateOtp();
    await this.saveOtp(email, code, otpType.LOGIN_OTP);

    // إرسال OTP للمستخدم
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
