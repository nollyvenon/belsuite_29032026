import 'reflect-metadata';
import { DealsController } from './deals/deals.controller';
import { RankTrackerController } from './rank-tracker/rank-tracker.controller';
import { CallCenterController } from './call-center/call-center.controller';
import { RevenueIntelligenceController } from './revenue-intelligence/revenue-intelligence.controller';
import { ReferralEngineController } from './referral-engine/referral-engine.controller';

function getPermissions(target: any, methodName: string): string[] | undefined {
  return Reflect.getMetadata('permissions', target[methodName]);
}

describe('New Capabilities Permission Metadata', () => {
  describe('DealsController', () => {
    const target = DealsController.prototype as any;

    it('requires manage permission for mutating endpoints', () => {
      expect(getPermissions(target, 'create')).toEqual(['manage:deals', 'manage:organization']);
      expect(getPermissions(target, 'update')).toEqual(['manage:deals', 'manage:organization']);
      expect(getPermissions(target, 'remove')).toEqual(['manage:deals', 'manage:organization']);
      expect(getPermissions(target, 'aiScore')).toEqual(['manage:deals', 'manage:organization']);
      expect(getPermissions(target, 'addActivity')).toEqual(['manage:deals', 'manage:organization']);
    });

    it('requires read permission for read endpoints', () => {
      expect(getPermissions(target, 'list')).toEqual(['read:deals', 'manage:organization']);
      expect(getPermissions(target, 'board')).toEqual(['read:deals', 'manage:organization']);
      expect(getPermissions(target, 'stats')).toEqual(['read:deals', 'manage:organization']);
      expect(getPermissions(target, 'timeline')).toEqual(['read:deals', 'manage:organization']);
      expect(getPermissions(target, 'getOne')).toEqual(['read:deals', 'manage:organization']);
    });
  });

  describe('RankTrackerController', () => {
    const target = RankTrackerController.prototype as any;

    it('requires manage permission for mutating endpoints', () => {
      expect(getPermissions(target, 'track')).toEqual(['manage:rank_tracker', 'manage:organization']);
      expect(getPermissions(target, 'bulkTrack')).toEqual(['manage:rank_tracker', 'manage:organization']);
      expect(getPermissions(target, 'research')).toEqual(['manage:rank_tracker', 'manage:organization']);
    });

    it('requires read permission for read endpoints', () => {
      expect(getPermissions(target, 'list')).toEqual(['read:rank_tracker', 'manage:organization']);
      expect(getPermissions(target, 'stats')).toEqual(['read:rank_tracker', 'manage:organization']);
      expect(getPermissions(target, 'history')).toEqual(['read:rank_tracker', 'manage:organization']);
    });
  });

  describe('CallCenterController', () => {
    const target = CallCenterController.prototype as any;

    it('requires manage permission for mutating endpoints', () => {
      expect(getPermissions(target, 'log')).toEqual(['manage:call_center', 'manage:organization']);
      expect(getPermissions(target, 'update')).toEqual(['manage:call_center', 'manage:organization']);
      expect(getPermissions(target, 'summarize')).toEqual(['manage:call_center', 'manage:organization']);
    });

    it('requires read permission for read endpoints', () => {
      expect(getPermissions(target, 'list')).toEqual(['read:call_center', 'manage:organization']);
      expect(getPermissions(target, 'queue')).toEqual(['read:call_center', 'manage:organization']);
      expect(getPermissions(target, 'stats')).toEqual(['read:call_center', 'manage:organization']);
    });
  });

  describe('RevenueIntelligenceController', () => {
    const target = RevenueIntelligenceController.prototype as any;

    it('requires read permission for metrics', () => {
      expect(getPermissions(target, 'metrics')).toEqual(['read:revenue', 'manage:organization']);
    });
  });

  describe('ReferralEngineController', () => {
    const target = ReferralEngineController.prototype as any;

    it('requires permission for secured endpoints', () => {
      expect(getPermissions(target, 'create')).toEqual(['manage:referrals', 'manage:organization']);
      expect(getPermissions(target, 'list')).toEqual(['read:referrals', 'manage:organization']);
      expect(getPermissions(target, 'stats')).toEqual(['read:referrals', 'manage:organization']);
      expect(getPermissions(target, 'convert')).toEqual(['manage:referrals', 'manage:organization']);
    });

    it('keeps public endpoints free of permission metadata', () => {
      expect(getPermissions(target, 'trackClick')).toBeUndefined();
      expect(getPermissions(target, 'trackSignup')).toBeUndefined();
    });
  });
});
