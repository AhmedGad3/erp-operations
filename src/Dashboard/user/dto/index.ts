import { Transform } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsStrongPassword,
    MinLength,
  } from 'class-validator';
import { UserRoles } from '../../../Common/Enums';

  
export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    name: string;
  
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsStrongPassword({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      @IsNotEmpty()
    password: string

    @IsEnum(UserRoles, {
        message: `role must be one of: ${Object.values(UserRoles).join(', ')}`,
      })
      @IsOptional() 
      @Transform(({ value }) => value || UserRoles.USER) 
      role: UserRoles = UserRoles.USER;
    
  }
  


export class UpdateUserDto {
  @IsString()
  @MinLength(3)
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(UserRoles)
  @IsOptional()
  role?: UserRoles;

  
}
