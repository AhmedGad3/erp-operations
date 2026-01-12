import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * Step 2: التحقق من OTP وإكمال التسجيل
 * (هنا المستخدم يدخل الـ OTP اللي جاله + الباسورد)
 */
export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'OTP must be 6 digits' })
  code: string;

  @IsStrongPassword({
    minLength: 8,
    minLowercase: 1,
    minUppercase: 1,
    minNumbers: 1,
    minSymbols: 1,
  })
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;
}

/**
 * Step 1: طلب OTP للدخول (بس الإيميل)
 */
export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

/**
 * Step 2: التحقق من OTP والدخول
 */
export class VerifyLoginOtpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6, { message: 'OTP must be 6 digits' })
  code: string;
}