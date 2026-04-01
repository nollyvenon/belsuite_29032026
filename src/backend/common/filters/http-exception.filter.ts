import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

/**
 * Global HTTP Exception Filter
 * Provides consistent error response format
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private logger = new Logger('HttpExceptionFilter');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const exceptionResponseObject =
      typeof exceptionResponse === 'object' && exceptionResponse !== null
        ? (exceptionResponse as { message?: string | string[] })
        : null;

    const message =
      exceptionResponseObject?.message
        ? exceptionResponseObject.message
        : exception.message;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message:
        typeof message === 'string'
          ? message
          : Array.isArray(message)
            ? message[0]
            : 'Internal Server Error',
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception.stack,
      }),
    };

    // Log errors
    if (status >= 500) {
      this.logger.error(JSON.stringify(errorResponse));
    } else if (status >= 400) {
      this.logger.warn(JSON.stringify(errorResponse));
    }

    response.status(status).json(errorResponse);
  }
}

/**
 * Global Catch-all Exception Filter
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error
        ? exception.message
        : 'An unexpected error occurred';

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: exception instanceof Error ? exception.stack : String(exception),
      }),
    };

    this.logger.error(JSON.stringify(errorResponse));
    response.status(status).json(errorResponse);
  }
}
