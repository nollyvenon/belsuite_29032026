import { ExecutionContext, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from './common/guards/jwt.guard';
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';
import { RankTrackerController } from './rank-tracker/rank-tracker.controller';
import { RankTrackerService } from './rank-tracker/rank-tracker.service';
import { CallCenterController } from './call-center/call-center.controller';
import { CallCenterService } from './call-center/call-center.service';
import { RevenueIntelligenceController } from './revenue-intelligence/revenue-intelligence.controller';
import { RevenueIntelligenceService } from './revenue-intelligence/revenue-intelligence.service';
import { ReferralEngineController } from './referral-engine/referral-engine.controller';
import { ReferralEngineService } from './referral-engine/referral-engine.service';

const authGuardMock = {
  canActivate: (context: ExecutionContext) => {
    const req = context.switchToHttp().getRequest();
    req.user = {
      organizationId: 'org_1',
      id: 'user_1',
      permissions: ['manage:organization'],
    };
    return true;
  },
};

describe('New Capabilities HTTP', () => {
  let app: INestApplication;

  const dealsService = {
    getDealStats: jest.fn().mockResolvedValue({ total: 0 }),
  };

  const rankTrackerService = {
    getStats: jest.fn().mockResolvedValue({ uniqueKeywords: 0 }),
  };

  const callCenterService = {
    getStats: jest.fn().mockResolvedValue({ totalCalls: 0 }),
  };

  const revenueService = {
    getMetrics: jest.fn().mockResolvedValue({ periodDays: 30 }),
  };

  const referralService = {
    getStats: jest.fn().mockResolvedValue({ totalLinks: 0 }),
    trackSignup: jest.fn().mockResolvedValue({ referralId: 'ref_1' }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [
        DealsController,
        RankTrackerController,
        CallCenterController,
        RevenueIntelligenceController,
        ReferralEngineController,
      ],
      providers: [
        { provide: DealsService, useValue: dealsService },
        { provide: RankTrackerService, useValue: rankTrackerService },
        { provide: CallCenterService, useValue: callCenterService },
        { provide: RevenueIntelligenceService, useValue: revenueService },
        { provide: ReferralEngineService, useValue: referralService },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(authGuardMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /deals/stats returns deal stats', async () => {
    const res = await request(app.getHttpServer()).get('/deals/stats');
    expect(res.status).toBe(200);
    expect(dealsService.getDealStats).toHaveBeenCalledWith('org_1');
  });

  it('GET /rank-tracker/stats returns rank tracker stats', async () => {
    const res = await request(app.getHttpServer()).get('/rank-tracker/stats');
    expect(res.status).toBe(200);
    expect(rankTrackerService.getStats).toHaveBeenCalledWith('org_1');
  });

  it('GET /call-center/stats returns call center stats', async () => {
    const res = await request(app.getHttpServer()).get('/call-center/stats');
    expect(res.status).toBe(200);
    expect(callCenterService.getStats).toHaveBeenCalledWith('org_1');
  });

  it('GET /revenue/metrics returns revenue metrics', async () => {
    const res = await request(app.getHttpServer()).get('/revenue/metrics');
    expect(res.status).toBe(200);
    expect(revenueService.getMetrics).toHaveBeenCalledWith('org_1', 30);
  });

  it('GET /referrals/stats returns referral stats', async () => {
    const res = await request(app.getHttpServer()).get('/referrals/stats');
    expect(res.status).toBe(200);
    expect(referralService.getStats).toHaveBeenCalledWith('org_1');
  });

  it('POST /referrals/signup is public and works without auth user', async () => {
    const publicGuard = {
      canActivate: (context: ExecutionContext) => {
        const req = context.switchToHttp().getRequest();
        if (req.path === '/referrals/signup') return true;
        req.user = { organizationId: 'org_1', id: 'user_1', permissions: ['manage:organization'] };
        return true;
      },
    };

    const moduleRef = await Test.createTestingModule({
      controllers: [ReferralEngineController],
      providers: [{ provide: ReferralEngineService, useValue: referralService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(publicGuard)
      .compile();

    const publicApp = moduleRef.createNestApplication();
    await publicApp.init();

    const res = await request(publicApp.getHttpServer())
      .post('/referrals/signup')
      .send({ code: 'ABC123', referredEmail: 'lead@demo.com' });

    expect(res.status).toBe(201);
    expect(referralService.trackSignup).toHaveBeenCalledWith({
      code: 'ABC123',
      referredEmail: 'lead@demo.com',
    });

    await publicApp.close();
  });
});
