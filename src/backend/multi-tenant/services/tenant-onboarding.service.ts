/**
 * Tenant Onboarding Service
 * Manages the onboarding flow for new tenants (state machine)
 */

import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { OnboardingStep } from '@prisma/client';

export interface OnboardingStepData {
  companyName?: string;
  website?: string;
  logo?: string;
  industry?: string;
  subdomainChosen?: string;
  customDomainChosen?: string;
  defaultLanguage?: string;
  defaultTimezone?: string;
  teamMembersEmails?: string[];
  paymentMethodId?: string;
  featurePreferences?: Record<string, boolean>;
}

export interface OnboardingStatus {
  step: string;
  completed: boolean;
  completionPercentage: number;
  remainingSteps: string[];
  currentStepData: any;
}

@Injectable()
export class TenantOnboardingService {
  private readonly logger = new Logger(TenantOnboardingService.name);

  // Define onboarding flow
  private readonly onboardingFlow = [
    OnboardingStep.WELCOME,
    OnboardingStep.COMPANY_INFO,
    OnboardingStep.DOMAIN_SETUP,
    OnboardingStep.TEAM_SETUP,
    OnboardingStep.PAYMENT_SETUP,
    OnboardingStep.FEATURE_SELECTION,
    OnboardingStep.COMPLETED,
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get onboarding status for tenant
   */
  async getOnboardingStatus(organizationId: string): Promise<OnboardingStatus> {
    const onboarding = await this.getOnboarding(organizationId);

    const currentStepIndex = this.onboardingFlow.indexOf(
      onboarding.step as OnboardingStep,
    );
    const completedSteps = currentStepIndex + (onboarding.completed ? 1 : 0);
    const completionPercentage = Math.round(
      (completedSteps / this.onboardingFlow.length) * 100,
    );

    return {
      step: onboarding.step,
      completed: onboarding.completed,
      completionPercentage,
      remainingSteps: this.onboardingFlow.slice(currentStepIndex + 1).map(s => s.toString()),
      currentStepData: {
        companyName: onboarding.companyName,
        website: onboarding.website,
        industry: onboarding.industry,
        subdomainChosen: onboarding.subdomainChosen,
        customDomainChosen: onboarding.customDomainChosen,
        defaultLanguage: onboarding.defaultLanguage,
        defaultTimezone: onboarding.defaultTimezone,
        invitedMembersCount: onboarding.invitedMembersCount,
        paymentMethodId: onboarding.paymentMethodId,
        featurePreferences: onboarding.featurePreferences,
      },
    };
  }

  /**
   * Complete current step and move to next
   */
  async completeStep(
    organizationId: string,
    currentStep: string,
    stepData: OnboardingStepData,
  ): Promise<OnboardingStatus> {
    const onboarding = await this.getOnboarding(organizationId);

    // Verify current step matches
    if (onboarding.step !== currentStep) {
      throw new BadRequestException(
        `Invalid step. Current step is ${onboarding.step}, not ${currentStep}`,
      );
    }

    try {
      // Update with step data and mark as completed
      await this.prisma.tenantOnboarding.update({
        where: { organizationId },
        data: {
          ...this.mapStepData(currentStep, stepData),
          completed: true,
          completedAt: new Date(),
        },
      });

      // Move to next step
      const nextStep = this.getNextStep(currentStep);
      const updated = await this.prisma.tenantOnboarding.update({
        where: { organizationId },
        data: {
          step: nextStep || OnboardingStep.COMPLETED,
          completed: false,
        },
      });

      this.logger.log(
        `Onboarding step completed: ${currentStep} → ${nextStep} for tenant ${organizationId}`,
      );

      // Return new status
      return this.getOnboardingStatus(organizationId);
    } catch (error) {
      this.logger.error(
        `Failed to complete onboarding step: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  /**
   * Skip optional step
   */
  async skipStep(organizationId: string, currentStep: string): Promise<OnboardingStatus> {
    const skippableSteps = [
      OnboardingStep.TEAM_SETUP,
      OnboardingStep.PAYMENT_SETUP,
      OnboardingStep.FEATURE_SELECTION,
    ];

    if (!skippableSteps.includes(currentStep as OnboardingStep)) {
      throw new BadRequestException(`Step "${currentStep}" cannot be skipped`);
    }

    const onboarding = await this.getOnboarding(organizationId);

    if (onboarding.step !== currentStep) {
      throw new BadRequestException(
        `Invalid step. Current step is ${onboarding.step}, not ${currentStep}`,
      );
    }

    // Move to next step
    const nextStep = this.getNextStep(currentStep);

    await this.prisma.tenantOnboarding.update({
      where: { organizationId },
      data: {
        step: nextStep || OnboardingStep.COMPLETED,
      },
    });

    this.logger.log(
      `Onboarding step skipped: ${currentStep} → ${nextStep} for tenant ${organizationId}`,
    );

    return this.getOnboardingStatus(organizationId);
  }

  /**
   * Complete entire onboarding
   */
  async completeOnboarding(organizationId: string): Promise<void> {
    await this.prisma.tenantOnboarding.update({
      where: { organizationId },
      data: {
        step: OnboardingStep.COMPLETED,
        completed: true,
        completedAt: new Date(),
      },
    });

    // Update organization
    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        onboardingCompletedAt: new Date(),
      },
    });

    this.logger.log(`Onboarding completed for tenant ${organizationId}`);
  }

  /**
   * Mark as abandoned
   */
  async markAbandoned(organizationId: string): Promise<void> {
    await this.prisma.tenantOnboarding.update({
      where: { organizationId },
      data: {
        abandonedAt: new Date(),
      },
    });

    this.logger.log(`Onboarding marked as abandoned for tenant ${organizationId}`);
  }

  /**
   * Reset onboarding to beginning
   */
  async resetOnboarding(organizationId: string): Promise<OnboardingStatus> {
    await this.prisma.tenantOnboarding.update({
      where: { organizationId },
      data: {
        step: OnboardingStep.WELCOME,
        completed: false,
        completedAt: null,
        abandonedAt: null,
      },
    });

    this.logger.log(`Onboarding reset for tenant ${organizationId}`);

    return this.getOnboardingStatus(organizationId);
  }

  /**
   * Get step description and requirements
   */
  getStepInfo(step: string): any {
    const stepInfo: Record<string, any> = {
      [OnboardingStep.WELCOME]: {
        title: 'Welcome to BelSuite',
        description: 'Welcome! Let\\'s get your account set up.',
        duration: '2 minutes',
        required: ['organizationCreated'],
        optional: [],
      },
      [OnboardingStep.COMPANY_INFO]: {
        title: 'Company Information',
        description: 'Tell us about your company',
        duration: '5 minutes',
        required: ['companyName', 'website'],
        optional: ['logo', 'industry'],
      },
      [OnboardingStep.DOMAIN_SETUP]: {
        title: 'Domain Setup',
        description: 'Choose your subdomain or custom domain',
        duration: '10 minutes',
        required: ['subdomain or customDomain'],
        optional: [],
      },
      [OnboardingStep.TEAM_SETUP]: {
        title: 'Invite Team Members',
        description: 'Invite your team to collaborate',
        duration: '5 minutes',
        required: [],
        optional: ['teamMembersEmails'],
        skippable: true,
      },
      [OnboardingStep.PAYMENT_SETUP]: {
        title: 'Payment Method',
        description: 'Add a payment method for your subscription',
        duration: '5 minutes',
        required: ['paymentMethodId'],
        optional: [],
        skippable: true,
      },
      [OnboardingStep.FEATURE_SELECTION]: {
        title: 'Feature Preferences',
        description: 'Choose which features to enable',
        duration: '3 minutes',
        required: [],
        optional: ['featurePreferences'],
        skippable: true,
      },
      [OnboardingStep.COMPLETED]: {
        title: 'All Set!',
        description: 'You\\'re ready to use BelSuite',
        duration: '0 minutes',
        required: [],
        optional: [],
      },
    };

    return stepInfo[step] || null;
  }

  /**
   * Get all onboarding analytics
   */
  async getOnboardingAnalytics(): Promise<any> {
    const onboardings = await this.prisma.tenantOnboarding.findMany({
      select: {
        step: true,
        completed: true,
        completedAt: true,
        abandonedAt: true,
        createdAt: true,
      },
    });

    const total = onboardings.length;
    const completed = onboardings.filter(o => o.completed).length;
    const abandoned = onboardings.filter(o => o.abandonedAt).length;
    const inProgress = total - completed - abandoned;

    // Group by last step
    const byStep = this.onboardingFlow.reduce(
      (acc, step) => {
        acc[step] = onboardings.filter(o => o.step === step).length;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Average time to complete
    const completedWithTime = onboardings.filter(
      o => o.completed && o.completedAt && o.createdAt,
    );
    const avgCompletionTime =
      completedWithTime.length > 0
        ? completedWithTime.reduce(
            (acc, o) =>
              acc + (o.completedAt!.getTime() - o.createdAt.getTime()),
            0,
          ) / completedWithTime.length
        : 0;

    return {
      total,
      completed,
      inProgress,
      abandoned,
      completionRate: `${Math.round((completed / total) * 100)}%`,
      abandonmentRate: `${Math.round((abandoned / total) * 100)}%`,
      avgCompletionTimeMinutes: Math.round(avgCompletionTime / 60000),
      byStep,
    };
  }

  /**
   * Helper: Get onboarding record
   */
  private async getOnboarding(organizationId: string): Promise<any> {
    const onboarding = await this.prisma.tenantOnboarding.findUnique({
      where: { organizationId },
    });

    if (!onboarding) {
      throw new NotFoundException(
        `Onboarding not found for tenant: ${organizationId}`,
      );
    }

    return onboarding;
  }

  /**
   * Helper: Get next step in flow
   */
  private getNextStep(currentStep: string): string | null {
    const currentIndex = this.onboardingFlow.findIndex(s => s === currentStep);

    if (currentIndex === -1 || currentIndex === this.onboardingFlow.length - 1) {
      return null;
    }

    return this.onboardingFlow[currentIndex + 1];
  }

  /**
   * Helper: Map step data to database fields
   */
  private mapStepData(step: string, data: OnboardingStepData): Record<string, any> {
    switch (step) {
      case OnboardingStep.COMPANY_INFO:
        return {
          companyName: data.companyName,
          companyWebsite: data.website,
          industry: data.industry,
        };

      case OnboardingStep.DOMAIN_SETUP:
        return {
          subdomainChosen: data.subdomainChosen,
          customDomainChosen: data.customDomainChosen,
        };

      case OnboardingStep.TEAM_SETUP:
        return {
          teamMembersInvited: (data.teamMembersEmails || []).length > 0,
          invitedMembersCount: data.teamMembersEmails?.length || 0,
        };

      case OnboardingStep.PAYMENT_SETUP:
        return {
          billingMethodAdded: !!data.paymentMethodId,
          paymentMethodId: data.paymentMethodId,
        };

      case OnboardingStep.FEATURE_SELECTION:
        return {
          featurePreferences: data.featurePreferences,
        };

      default:
        return {};
    }
  }
}
