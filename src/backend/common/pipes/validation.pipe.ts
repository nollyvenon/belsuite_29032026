/**
 * Global Validation Pipe
 * Automatically validates all request bodies, query params, and path params
 * Provides consistent error messages
 */

import {
  Injectable,
  BadRequestException,
  ValidationPipe,
  ValidationError,
} from '@nestjs/common';

/**
 * Custom validation error formatter
 * Transforms class-validator errors into user-friendly format
 */
function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((error) => {
      const constraints = error.constraints || {};
      const messages = Object.values(constraints).join(', ');
      const childErrors = error.children
        ? formatValidationErrors(error.children)
        : '';

      return `${error.property}: ${messages}${childErrors ? ` (${childErrors})` : ''}`;
    })
    .join('; ');
}

/**
 * Global validation pipe with custom error handling
 */
@Injectable()
export class GlobalValidationPipe extends ValidationPipe {
  constructor() {
    super({
      // Remove properties that are not in the DTO
      whitelist: true,

      // Fail if extra properties are provided
      forbidNonWhitelisted: true,

      // Transform plain objects to DTO instances
      transform: true,

      // Transform enable for nested objects
      transformOptions: {
        enableImplicitConversion: true,
      },

      // Custom error factory
      exceptionFactory: (errors: ValidationError[]) => {
        const message = formatValidationErrors(errors);
        return new BadRequestException({
          code: 'VALIDATION_ERROR',
          message,
          details: errors,
        });
      },
    });
  }
}
