import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { hash, sendEmail } from '../../Common';
import { TUser, UserRepository } from '../../DB';
import { CreateUserDto, UpdateUserDto } from './dto/index';
import { Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  // ================= إنشاء مستخدم جديد =================
  async createService(createUserDto: CreateUserDto, user: TUser): Promise<TUser> {
    const { name, email, password, role } = createUserDto;

    // تحقق إذا الإيميل موجود مسبقاً
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const createdUser = await this.userRepository.create({
      name,
      email,
      password: hash(password),
      role,
      createdBy: user._id as Types.ObjectId,
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

    const sanitizedUser = await this.userRepository.findById(
      createdUser._id as Types.ObjectId,
    );

    return sanitizedUser as TUser;
  }

  // ================= جلب الملف الشخصي =================
  async getProfile(id: string): Promise<TUser> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  // ================= جلب مستخدم بالـ ID =================
  async getUserName(id: string | Types.ObjectId): Promise<TUser | null> {
    return this.userRepository.findById(id);
  }

  // ================= تعديل مستخدم =================
  async updateUser(id: string, updateUserDto: UpdateUserDto, user: TUser): Promise<TUser> {
    const exist = await this.userRepository.findById(id);
    if (!exist) {
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

  // ================= حذف ناعم =================
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

    const deletedUser = await this.userRepository.softDelete(id, user);
    return deletedUser as TUser;
  }

  // ================= جلب كل المستخدمين =================
  async getAllUsers(): Promise<TUser[]> {
    return this.userRepository.findAll();
  }

  // ================= تفعيل مستخدم =================
  async activateUser(id: string, user: TUser) {
    const exist = await this.userRepository.findById(id);

    if (!exist) {
      throw new NotFoundException('User not found');
    }

    if (exist.isActive === true) {
      throw new ConflictException('User already active');
    }

    const activatedUser = await this.userRepository.activateUser(id, user);
    return activatedUser as TUser;
  }
}
