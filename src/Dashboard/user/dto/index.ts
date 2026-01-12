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
import { UserRoles } from 'src/Common/Enums';

  
export class CreateUserpDto {
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
  
 