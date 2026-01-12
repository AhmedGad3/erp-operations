import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  // canActivate(context: ExecutionContext): boolean {
  //   const roles = this.reflector.get('roles', context.getClass());
  //   const publicVal = this.reflector.getAllAndMerge('public', [
  //     context.getHandler(),
  //     context.getClass(),
  //   ]);
  //   if (publicVal.length) return true;
  //   const request = context.switchToHttp().getRequest();
  //   if (!roles.includes(request.user.role))
  //     throw new UnauthorizedException(
  //       'You are not authorized to access this resource',
  //     );

  //   return roles.includes(request.user.role);
  // }
  canActivate(context: ExecutionContext): boolean {
    // 1. تحقق من Public routes
    const isPublic = this.reflector.getAllAndOverride<boolean>('public', [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      return true;
    }

    // 2. جيب الـ roles المطلوبة
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 3. لو مفيش roles محددة، يعني الـ route مفتوح لأي authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // 4. جيب الـ user من الـ request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 5. لو مفيش user (مش مسجل دخول)
    if (!user) {
      throw new UnauthorizedException('You must be logged in');
    }

    // 6. تحقق من الـ role
    if (!requiredRoles.includes(user.role)) {
      throw new UnauthorizedException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
