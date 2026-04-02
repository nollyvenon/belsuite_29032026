import { DealsController } from './deals/deals.controller';
import { RankTrackerController } from './rank-tracker/rank-tracker.controller';
import { CallCenterController } from './call-center/call-center.controller';
import { RevenueIntelligenceController } from './revenue-intelligence/revenue-intelligence.controller';
import { ReferralEngineController } from './referral-engine/referral-engine.controller';

describe('New Capabilities Controllers', () => {
  const req = { user: { organizationId: 'org_1', id: 'user_1' } } as any;

  it('DealsController delegates create/list to service', async () => {
    const svc = {
      createDeal: jest.fn().mockResolvedValue({ id: 'deal_1' }),
      listDeals: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    } as any;

    const ctrl = new DealsController(svc);
    await ctrl.create(req, { title: 'New' } as any);
    await ctrl.list(req, {} as any);

    expect(svc.createDeal).toHaveBeenCalledWith('org_1', 'user_1', { title: 'New' });
    expect(svc.listDeals).toHaveBeenCalledWith('org_1', {});
  });

  it('RankTrackerController delegates track/research to service', async () => {
    const svc = {
      trackKeyword: jest.fn().mockResolvedValue({ id: 'rank_1' }),
      aiResearch: jest.fn().mockResolvedValue({ suggestions: [] }),
    } as any;

    const ctrl = new RankTrackerController(svc);
    await ctrl.track(req, { keyword: 'crm software', domain: 'example.com' } as any);
    await ctrl.research(req, { seedKeyword: 'crm software' } as any);

    expect(svc.trackKeyword).toHaveBeenCalledWith('org_1', { keyword: 'crm software', domain: 'example.com' });
    expect(svc.aiResearch).toHaveBeenCalledWith('org_1', 'user_1', { seedKeyword: 'crm software' });
  });

  it('CallCenterController delegates log/summarize to service', async () => {
    const svc = {
      logCall: jest.fn().mockResolvedValue({ id: 'call_1' }),
      transcribeAndSummarize: jest.fn().mockResolvedValue({ summary: 'ok' }),
    } as any;

    const ctrl = new CallCenterController(svc);
    await ctrl.log(req, { fromNumber: '+1000', toNumber: '+2000' } as any);
    await ctrl.summarize(req, 'call_1');

    expect(svc.logCall).toHaveBeenCalledWith('org_1', { fromNumber: '+1000', toNumber: '+2000' });
    expect(svc.transcribeAndSummarize).toHaveBeenCalledWith('org_1', 'user_1', 'call_1');
  });

  it('RevenueIntelligenceController delegates metrics request with default days', async () => {
    const svc = {
      getMetrics: jest.fn().mockResolvedValue({}),
    } as any;

    const ctrl = new RevenueIntelligenceController(svc);
    await ctrl.metrics(req, {} as any);

    expect(svc.getMetrics).toHaveBeenCalledWith('org_1', 30);
  });

  it('ReferralEngineController keeps signup public and delegates secured operations', async () => {
    const svc = {
      createLink: jest.fn().mockResolvedValue({ id: 'link_1' }),
      trackSignup: jest.fn().mockResolvedValue({ referralId: 'ref_1' }),
      markConverted: jest.fn().mockResolvedValue({ status: 'CONVERTED' }),
    } as any;

    const ctrl = new ReferralEngineController(svc);
    await ctrl.create(req, { campaignName: 'Q2' } as any);
    await ctrl.trackSignup({ code: 'ABC123' } as any);
    await ctrl.convert(req, 'ref_1');

    expect(svc.createLink).toHaveBeenCalledWith('org_1', 'user_1', { campaignName: 'Q2' });
    expect(svc.trackSignup).toHaveBeenCalledWith({ code: 'ABC123' });
    expect(svc.markConverted).toHaveBeenCalledWith('org_1', 'ref_1');
  });
});
