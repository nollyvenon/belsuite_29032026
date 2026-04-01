import {
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { CanActivate } from '@nestjs/common';

/**
 * Admin Guard
 * Ensures user has admin role
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('No user found in request');
    }

    // Check if user has admin role
    const isAdmin = user.role?.name === 'ADMIN' || user.roles?.some((r: any) => r.name === 'ADMIN');

    if (!isAdmin) {
      throw new ForbiddenException('Only administrators can access this resource');
    }

    return true;
  }
}
