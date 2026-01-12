import { applyDecorators, UseGuards } from '@nestjs/common';
import { Roles } from './role.decorator';
import { AuthGuard, RoleGuard } from '../Guards';

export function Auth(...roles: string[]) {
  return applyDecorators(Roles(...roles), UseGuards(AuthGuard, RoleGuard));
}
