import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import {  CreateUserDto, UpdateUserDto } from './dto';
import { Auth } from '../../Common';
import { Request } from 'express';

@Auth('admin')
@Controller('admin')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Auth('admin', 'accountant', 'manager')
  @Get('me')
  async getMyProfile(@Req() req) {
    return this.userService.getProfile(req.user._id);

  }
  @Auth('admin')
  @Post('create')
  async signup(@Body() createUserDto: CreateUserDto, @Req() req: Request) {
    const result = await this.userService.createService(createUserDto, req['user']);
    return {
      message: {
        result,
        message: 'user created successfully'
      },
    };


  }

   @Auth('admin', 'accountant', 'manager')
   @Get('user/:id')
  async getUser(@Param('id') id: string) {
    return this.userService.getUserName(id);
  }

  
  // ============ Update User ============
  @Auth('admin', 'accountant', 'manager')
  @Get('users')
  async getAllUsers() {
    return this.userService.getAllUsers();
  }
@Auth('admin')
@Patch('user/:id')
async updateUser(
  @Param('id') id: string,
  @Body() updateUserDto: UpdateUserDto,
  @Req() req: Request
) {
  const result = await this.userService.updateUser(
    id,
    updateUserDto,
    req['user']
  );

  return {
    message: 'User updated successfully',
    result,
  };
}

// ============ Activate User ============
@Auth('admin')
@Patch('user/activate/:id')
async activateUser(
  @Param('id') id: string,
  @Req() req: Request
) {
  const result = await this.userService.activateUser(
    id,
    req['user']
  );

  return {
    message: 'User activated successfully',
    result,
  };    
}
// ============ Soft Delete User ============
@Auth('admin')
@Delete('user/:id')
async deleteUser(
  @Param('id') id: string,
  @Req() req: Request
) {
  const result = await this.userService.softDeleteUser(
    id,
    req['user']
  );

  return {
    message: 'User deleted successfully',
  };
}




 
}
