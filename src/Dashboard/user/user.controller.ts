import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {  CreateUserpDto } from './dto';
import { Auth } from 'src/Common';

@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth('admin')
  @Post('create-user')
  async signup(@Body() CreateUserpDto: CreateUserpDto) {
    const result = await this.userService.createService(CreateUserpDto);
    return {
      message: {
        result,
        message: 'user created successfully'
      },
    };
  }

  


 
}
