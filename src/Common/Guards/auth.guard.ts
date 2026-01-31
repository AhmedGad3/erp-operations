import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../Services';
import { UserRepository } from '../../DB';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // السماح بالـ public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization token');
    }

    const token = authHeader.split(' ')[1];

    try {
      // verify token
      const payload = this.tokenService.verify(token, {
        secret: process.env.JWT_SECRET,
      });

      // find user
      const user = await this.userRepository.findOne({ _id: payload._id });
      if (!user) {
        throw new UnauthorizedException('User no longer exists');
      }

      request.user = user;
      return true;
    } catch (err) {
      // أي خطأ JWT (expired / malformed / invalid)
      throw new UnauthorizedException('Invalid or expired token' + err.message);
    }
  }
}
