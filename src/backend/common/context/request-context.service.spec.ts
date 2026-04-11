import { RequestContextService, RequestContext } from './request-context.service';

describe('RequestContextService', () => {
  let service: RequestContextService;

  beforeEach(() => {
    service = new RequestContextService();
  });

  it('runWithContextAsync keeps store across await and setImmediate', async () => {
    const ctx: RequestContext = {
      correlationId: 'corr-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      startTime: new Date(),
    };

    await service.runWithContextAsync(ctx, async () => {
      expect(service.getTenantId()).toBe('tenant-1');
      expect(service.getCorrelationId()).toBe('corr-1');

      await Promise.resolve();
      expect(service.getTenantId()).toBe('tenant-1');

      await new Promise<void>((resolve) => setImmediate(resolve));
      expect(service.getTenantId()).toBe('tenant-1');
    });

    expect(service.getContext()).toBeUndefined();
  });

  it('runWithContextAsync isolates concurrent stores (no enterWith bleed)', async () => {
    const ctxA: RequestContext = {
      correlationId: 'a',
      tenantId: 'tenant-A',
      startTime: new Date(),
    };
    const ctxB: RequestContext = {
      correlationId: 'b',
      tenantId: 'tenant-B',
      startTime: new Date(),
    };

    const pA = service.runWithContextAsync(ctxA, async () => {
      await Promise.resolve();
      await new Promise<void>((r) => setTimeout(r, 5));
      return service.getTenantId();
    });
    const pB = service.runWithContextAsync(ctxB, async () => {
      await Promise.resolve();
      await new Promise<void>((r) => setTimeout(r, 3));
      return service.getTenantId();
    });

    const [a, b] = await Promise.all([pA, pB]);
    expect(a).toBe('tenant-A');
    expect(b).toBe('tenant-B');
    expect(service.getContext()).toBeUndefined();
  });

  it('runWithContextSync nests without leaking outer tenant', () => {
    const outer: RequestContext = {
      correlationId: 'o',
      tenantId: 'outer',
      startTime: new Date(),
    };
    const inner: RequestContext = {
      correlationId: 'i',
      tenantId: 'inner',
      startTime: new Date(),
    };

    service.runWithContextSync(outer, () => {
      expect(service.getTenantId()).toBe('outer');
      service.runWithContextSync(inner, () => {
        expect(service.getTenantId()).toBe('inner');
      });
      expect(service.getTenantId()).toBe('outer');
    });
    expect(service.getContext()).toBeUndefined();
  });
});
