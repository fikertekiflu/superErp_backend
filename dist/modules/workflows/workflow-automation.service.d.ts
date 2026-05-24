import { Repository } from 'typeorm';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';
import { User } from '../users/user.entity';
import { Notification } from '../notifications/notification.entity';
import { Role } from '../roles/role.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { WorkflowStep } from './workflow-step.entity';
import { EmailService } from '../email/email.service';
import { Tenant } from '../tenants/tenant.entity';
export interface AutomationAction {
    type: string;
    config?: Record<string, unknown>;
}
export interface AutomationContext {
    tenantId: string;
    triggeredById: string;
    executionId: string;
    entityType?: string;
    entityData?: Record<string, unknown>;
    recordId?: string;
    entityDefinitionId?: string;
}
export interface AutomationActionResult {
    type: string;
    status: 'executed' | 'skipped' | 'failed';
    detail?: string;
    data?: Record<string, unknown>;
    error?: string;
}
export declare class WorkflowAutomationService {
    private readonly entityDataRepo;
    private readonly entityRepo;
    private readonly userRepo;
    private readonly notificationRepo;
    private readonly roleRepo;
    private readonly tenantRepo;
    private readonly emailService;
    private readonly logger;
    constructor(entityDataRepo: Repository<EntityData>, entityRepo: Repository<DynamicEntity>, userRepo: Repository<User>, notificationRepo: Repository<Notification>, roleRepo: Repository<Role>, tenantRepo: Repository<Tenant>, emailService: EmailService);
    normalizeStepConfig(config: Record<string, unknown> | undefined): Record<string, unknown>;
    runAutomationStep(step: WorkflowStep, execution: WorkflowExecution): Promise<AutomationActionResult[]>;
    private buildContext;
    private executeAction;
    private isWorkflowEmailEnabled;
    private findEmailInEntityData;
    private sendEmail;
    private resolveEmailTemplate;
    private formatEmailHtml;
    private sendNotification;
    private updateField;
    private createEntityRecord;
    private runBuiltInAutomation;
    resolveTemplate(template: string, ctx: AutomationContext): string;
    private resolveRecipients;
    private resolveRecipientEmails;
    private createDashboardNotification;
    private coerceValue;
}
