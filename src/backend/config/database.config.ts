import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  constructor(private configService: ConfigService) {}

  getDatabaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL') || 
      'postgresql://user:password@localhost:5432/belsuite';
  }

  getRedisUrl(): string {
    return this.configService.get<string>('REDIS_URL') || 
      'redis://localhost:6379';
  }

  isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
