import { Body, Controller, Get, Post, Req, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {  CreateUserDto } from './dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('me')
  async getMyProfile(@Req() req) {
    return this.userService.getProfile(req.user._id);

  }
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

  @Get(':id')
  async getUser(@Req() req) {
    return this.userService.getUserName(req.params.id);
  }


  


 
}
