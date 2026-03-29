import { NestFactory } from '@nestjs/core';
import { AppModule } from './backend/app.module';

// Main entry point for backend

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3001);
}

bootstrap();
