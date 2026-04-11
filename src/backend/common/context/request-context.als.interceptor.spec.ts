import { from, of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { RequestContextAlsInterceptor } from './request-context.als.interceptor';
import { RequestContextService, RequestContext } from './request-context.service';

describe('RequestContextAlsInterceptor', () => {
  const makeCtx = (tenantId: string): RequestContext => ({
    correlationId: `c-${tenantId}`,
    tenantId,
    startTime: new Date(),
  });

  it('passes through when req.context is missing', (done) => {
    const als = new RequestContextService();
    const interceptor = new RequestContextAlsInterceptor(als);

    const req = {} as Express.Request;
    const http = { getRequest: () => req };
    const context = { switchToHttp: () => http } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: (v) => {
        expect(v).toBe('ok');
        expect(als.getContext()).toBeUndefined();
        done();
      },
      error: done.fail,
    });
  });

  it('passes through when tenantId is absent on store', (done) => {
    const als = new RequestContextService();
    const interceptor = new RequestContextAlsInterceptor(als);

    const req = { context: { correlationId: 'x', startTime: new Date() } } as any;
    const http = { getRequest: () => req };
    const context = { switchToHttp: () => http } as unknown as ExecutionContext;
    const next: CallHandler = { handle: () => of(1) };

    interceptor.intercept(context, next).subscribe({
      next: (v) => {
        expect(v).toBe(1);
        expect(als.getContext()).toBeUndefined();
        done();
      },
      error: done.fail,
    });
  });

  it('wraps handler in ALS.run so async continuation sees tenant', (done) => {
    const als = new RequestContextService();
    const interceptor = new RequestContextAlsInterceptor(als);

    const store = makeCtx('org-99');
    const req = { context: store } as any;
    const http = { getRequest: () => req };
    const context = { switchToHttp: () => http } as unknown as ExecutionContext;

    const next: CallHandler = {
      handle: () =>
        from(
          (async () => {
            await Promise.resolve();
            expect(als.getTenantId()).toBe('org-99');
            return 'done';
          })(),
        ),
    };

    interceptor.intercept(context, next).subscribe({
      next: (v) => {
        expect(v).toBe('done');
        expect(als.getContext()).toBeUndefined();
        done();
      },
      error: done.fail,
    });
  });
});
