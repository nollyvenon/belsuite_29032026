import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppConfig {
  constructor(private configService: ConfigService) {}

  getNodeEnv(): string {
    return this.configService.get<string>('NODE_ENV') || 'development';
  }

  getPort(): number {
    return this.configService.get<number>('PORT') || 3001;
  }

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET') || 'your-secret-key-change-in-production';
  }

  getJwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION') || '15m';
  }

  getRefreshTokenExpiration(): string {
    return this.configService.get<string>('REFRESH_TOKEN_EXPIRATION') || '7d';
  }

  getStripeApiKey(): string {
    return this.configService.get<string>('STRIPE_API_KEY') || '';
  }

  getOpenAiApiKey(): string {
    return this.configService.get<string>('OPENAI_API_KEY') || '';
  }

  getAwsAccessKey(): string {
    return this.configService.get<string>('AWS_ACCESS_KEY_ID') || '';
  }

  getAwsSecretKey(): string {
    return this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '';
  }

  getAwsS3Bucket(): string {
    return this.configService.get<string>('AWS_S3_BUCKET') || 'belsuite-content';
  }

  getAwsRegion(): string {
    return this.configService.get<string>('AWS_REGION') || 'us-east-1';
  }

  getCorsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS');
    return origins ? origins.split(',') : ['http://localhost:3000'];
  }
}
