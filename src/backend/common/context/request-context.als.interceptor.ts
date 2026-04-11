/**
 * Binds {@link RequestContext} to AsyncLocalStorage for the full HTTP handler lifecycle
 * (including awaits). Middleware only attaches context on `req.context`; this interceptor
 * activates ALS around `next.handle()` using `AsyncLocalStorage.run` + async continuation.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { from, defaultIfEmpty, type Observable } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import { Request } from 'express';
import { RequestContextService, RequestContext } from './request-context.service';

@Injectable()
export class RequestContextAlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestContextAlsInterceptor.name);

  constructor(private readonly requestContextService: RequestContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request & { context?: RequestContext }>();
    const store = req.context;

    if (!store?.tenantId) {
      return next.handle();
    }

    return from(
      this.requestContextService.runWithContextAsync(store, () =>
        lastValueFrom(next.handle().pipe(defaultIfEmpty(undefined))),
      ),
    );
  }
}
