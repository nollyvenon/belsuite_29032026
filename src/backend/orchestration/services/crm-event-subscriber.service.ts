import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus } from '../../common/events/event.bus';
import { WorkflowEngineService } from './workflow-engine.service';

@Injectable()
export class CrmEventSubscriberService implements OnModuleInit {
  private readonly logger = new Logger(CrmEventSubscriberService.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly workflowEngine: WorkflowEngineService,
  ) {}

  onModuleInit(): void {
    this.eventBus.subscribe('lead.scraped', {
      handle: async (event) => {
        await this.workflowEngine.start({
          organizationId: event.tenantId,
          userId: event.userId,
          channel: 'crm',
          message: `Lead captured: ${event.data?.['leadId'] ?? event.id}`,
          externalUserId: event.data?.['leadId'] ?? event.id,
          correlationId: event.correlationId,
        });
        this.logger.debug(`Lead event routed into workflow: ${event.id}`);
      },
    });

    this.eventBus.subscribe('crm.lead.imported', {
      handle: async (event) => {
        await this.workflowEngine.start({
          organizationId: event.tenantId,
          userId: event.userId,
          channel: 'crm',
          message: `CRM lead imported: ${event.data?.['crmLeadId'] ?? event.id}`,
          externalUserId: event.data?.['crmLeadId'] ?? event.id,
          correlationId: event.correlationId,
        });
        this.logger.debug(`CRM lead event routed into workflow: ${event.id}`);
      },
    });

    this.eventBus.subscribe('crm.conversion.marked', {
      handle: async (event) => {
        await this.workflowEngine.start({
          organizationId: event.tenantId,
          userId: event.userId,
          channel: 'crm',
          message: `Conversion marked: ${event.data?.['crmLeadId'] ?? event.id}`,
          externalUserId: event.data?.['crmLeadId'] ?? event.id,
          correlationId: event.correlationId,
        });
      },
    });
  }
}
