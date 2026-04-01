import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

/**
 * JWT Authentication Guard
 * Validates JWT tokens on protected routes
 */
@Injectable()
export class JwtAuthGuard extends PassportAuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest<TUser = any>(
    err: any,
    user: TUser,
    _info: any,
    _context: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or missing JWT token');
    }
    return user;
  }
}
