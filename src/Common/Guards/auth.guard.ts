import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../Services';
import { UserRepository } from '../../DB';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private tokenService: TokenService,
    private userRepository: UserRepository,
    private readonly reflector: Reflector,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const publicVal = this.reflector.getAllAndMerge('public', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (publicVal.length) return true;

    const { authorization } = request.headers;
    if (!authorization || !authorization.startsWith('Bearer')) {
      throw new UnauthorizedException('Invalid or missing bearer token');
    }
    const token = authorization.split(' ')[1];
    const data = this.tokenService.verify(token, {
      secret: process.env.JWT_SECRET,
    });

    const user = await this.userRepository.findOne({ _id: data._id });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    request.user = user;

    return true;
  }
}
