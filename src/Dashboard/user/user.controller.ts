import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {  CreateUserDto } from './dto';
import { Auth } from '../../Common';

@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth('admin')
  @Post('create-user')
  async signup(@Body() CreateUserDto: CreateUserDto) {
    const result = await this.userService.createService(CreateUserDto);
    return {
      message: {
        result,
        message: 'user created successfully'
      },
    };
  }

  


 
}
