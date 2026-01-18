import { Body, Controller, Get, Param, Post, Req, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import {  CreateUserDto } from './dto';
import { Auth } from '../../Common';

@Auth('admin')
@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

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

  @Get('me')
  async getMyProfile(@Req() req) {
    return this.userService.getProfile(req.user._id);

  }

  @Get('/:id')
  async getProfile(@Param('id') id: string) {
    return this.userService.getProfile(id);
  }
  


 
}
