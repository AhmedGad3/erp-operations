import {
    ConflictException,
   Injectable,
} from '@nestjs/common';


  import {  hash, sendEmail, TokenService } from '../../Common';
  import { TUser, UserRepository } from '../../DB';
  import { CreateUserpDto } from './dto/index';
  import { otpRepository } from '../../DB/Models/Otp/otp.repository';
  
  @Injectable()
  export class UserService {
    constructor(
      private readonly userRepository: UserRepository,
      private tokenService: TokenService,
      private readonly otpRepository: otpRepository,
    ) {}
  
    async createService(createUserDto: CreateUserpDto): Promise<TUser> {
      const { name, email, password,role } = createUserDto;
  
      // تحقق إذا الإيميل موجود مسبقًا
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('User already exists');
      }
  
      const createdUser = await this.userRepository.create({
        name,
        email,
        password: hash(password),
        role
      });

      await sendEmail({
        to: process.env.EMAIL,
        subject: 'New Account Creation submitted',
        html: `
          <h3>New user created</h3>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Name:</strong> ${name}</p>
        `,
      });
  
      return createdUser;
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