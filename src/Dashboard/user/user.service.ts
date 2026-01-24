import {
    ConflictException,
   Injectable,
   NotFoundException,
} from '@nestjs/common';


  import {  hash, sendEmail, TokenService } from '../../Common';
  import { TUser, UserRepository } from '../../DB';
  import { CreateUserDto, UpdateUserDto } from './dto/index';
  import { otpRepository } from '../../DB/Models/Otp/otp.repository';
import { Types } from 'mongoose';
import { create } from 'domain';
  
  @Injectable()
  export class UserService {
    constructor(
      private readonly userRepository: UserRepository,
      private tokenService: TokenService,
      private readonly otpRepository: otpRepository,
    ) {}
  
    async createService(createUserDto: CreateUserDto, user: TUser): Promise<TUser> {
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
        role,
        createdBy:user.id
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

    async getProfile(id: string): Promise<TUser> {
      const user = await this.userRepository.findById(id);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    }
  
  
    async getUserName(id: string | Types.ObjectId): Promise<TUser | null > {
      return this.userRepository.findById(id);
    }


    // ================= Update User =================
async updateUser(
  id: string,
  updateUserDto: UpdateUserDto,
  user: TUser
): Promise<TUser> {
  const exist = await this.userRepository.findById(id);
  if (!exist ) {
    throw new NotFoundException('User not found');
  }

  if (updateUserDto.email) {
    const existing = await this.userRepository.findByEmail(updateUserDto.email) as TUser;
    if (existing && existing._id?.toString() !== id) {
      throw new ConflictException('Email already in use');
    }
  }

  const updatePayload = {
  ...updateUserDto,
  updatedBy: user._id as Types.ObjectId,
};

const updatedUser = await this.userRepository.updateById(id, updatePayload);

  return updatedUser as TUser;
}

// ================= Soft Delete =================
async softDeleteUser(id: string, user: TUser) {
    const exist = await this.userRepository.findById(id);

  if (!exist) {
    throw new NotFoundException('User not found');
  }

  if (exist.isActive === false) {
    throw new ConflictException('User already deleted');
  }

  if (exist._id?.toString() === user._id?.toString()) {
    throw new ConflictException('You cannot delete yourself');
  }

  const deletedUser = await this.userRepository.softDelete(id, user.id);
  return deletedUser as TUser;
}

// ================= Get All =================
async getAllUsers(): Promise<TUser[]> {
  return this.userRepository.findAll();
}

async activateUser(id: string, user: TUser) {
    const exist = await this.userRepository.findById(id);

  if (!exist) {
    throw new NotFoundException('User not found');
  }

  if (exist.isActive === true) {
    throw new ConflictException('User already active');
  }

  const activatedUser = await this.userRepository.activateUser(id, user.id);
  return activatedUser as TUser;
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