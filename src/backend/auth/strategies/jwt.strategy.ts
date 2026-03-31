import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '../config/app.config';
import { JwtPayload } from '../services/jwt.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getJwtSecret(),
    });
  }

  async validate(payload: JwtPayload): Promise<{
    id: string;
    email: string;
    orgId: string;
    permissions: string[];
    sessionId: string | undefined;
  }> {
    return {
      id: payload.sub,
      email: payload.email,
      orgId: payload.orgId,
      permissions: payload.permissions ?? [],
      sessionId: payload.sessionId,
    };
  }
}
