import { Module } from '@nestjs/common';
import { UserModel, UserRepository } from '../../DB';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [UserModel],
  controllers: [UserController],
  providers: [UserRepository, UserService],
})
export class UserModule {}
