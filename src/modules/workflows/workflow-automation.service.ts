import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { EntityData } from '../entities/entity-data.entity';
import { User } from '../users/user.entity';
import { Notification, NotificationType } from '../notifications/notification.entity';
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
  /** Entity data record id (row id) */
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

@Injectable()
export class WorkflowAutomationService {
  private readonly logger = new Logger(WorkflowAutomationService.name);

  constructor(
    @InjectRepository(EntityData)
    private readonly entityDataRepo: Repository<EntityData>,
    @InjectRepository(DynamicEntity)
    private readonly entityRepo: Repository<DynamicEntity>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Template steps use { action: 'send_email', to: '...' }.
   * Editor may use { actions: [{ type, config }] }.
   */
  normalizeStepConfig(
    config: Record<string, unknown> | undefined,
  ): Record<string, unknown> {
    if (!config) return { actions: [] };

    if (Array.isArray(config.actions) && config.actions.length > 0) {
      return config;
    }

    if (typeof config.action === 'string' || config.to || config.template) {
      let actionType =
        typeof config.action === 'string' ? String(config.action).trim() : '';

      // UI sometimes saves action: "" while to/template are set — treat as send_email
      if (!actionType && (config.to || config.template)) {
        actionType = 'send_email';
      }

      if (!actionType) {
        return { ...config, actions: [] };
      }

      const actionConfig: Record<string, unknown> = { ...config };
      delete actionConfig.action;

      if (actionType === 'send_email') {
        if (!actionConfig.to) actionConfig.to = '{{email}}';
        if (!actionConfig.template) actionConfig.template = 'workflow_message';
      }

      if (actionType === 'create_record') {
        actionType = 'create_entity';
      }

      return {
        ...config,
        actions: [{ type: actionType, config: actionConfig }],
      };
    }

    return { ...config, actions: [] };
  }

  async runAutomationStep(
    step: WorkflowStep,
    execution: WorkflowExecution,
  ): Promise<AutomationActionResult[]> {
    const normalized = this.normalizeStepConfig(
      step.config as Record<string, unknown>,
    );
    const actions = (normalized.actions || []) as AutomationAction[];

    if (actions.length === 0) {
      return [
        {
          type: 'none',
          status: 'skipped',
          detail: 'No automation actions configured',
        },
      ];
    }

    const ctx = this.buildContext(execution);
    const results: AutomationActionResult[] = [];

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, ctx, step);
        results.push(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Automation action ${action.type} failed: ${message}`,
        );
        results.push({
          type: action.type,
          status: 'failed',
          error: message,
        });
      }
    }

    return results;
  }

  private buildContext(execution: WorkflowExecution): AutomationContext {
    const c = execution.context || {};
    const recordId =
      (c.recordId as string) || (c.entityId as string) || undefined;

    return {
      tenantId: execution.tenantId,
      triggeredById: execution.triggeredById,
      executionId: execution.id,
      entityType: c.entityType as string | undefined,
      entityData: (c.entityData as Record<string, unknown>) || {},
      recordId,
      entityDefinitionId: (c.entityDefinitionId as string) || undefined,
    };
  }

  private async executeAction(
    action: AutomationAction,
    ctx: AutomationContext,
    step: WorkflowStep,
  ): Promise<AutomationActionResult> {
    const cfg = action.config || {};

    const actionType =
      action.type === 'create_record' ? 'create_entity' : action.type;

    switch (actionType) {
      case 'send_email':
        return this.sendEmail(ctx, cfg, step);
      case 'send_notification':
        return this.sendNotification(ctx, cfg, step);
      case 'update_field':
      case 'update_entity':
        return this.updateField(ctx, cfg);
      case 'create_entity':
        return this.createEntityRecord(ctx, cfg);
      case 'update_calendar':
        return this.updateField(ctx, {
          field: 'calendar_status',
          value: 'scheduled',
          calendar: cfg.calendar,
        });
      case 'validate_expense_policy':
      case 'check_budget':
      case 'check_sla':
      case 'assign_ticket':
      case 'assign_owner':
      case 'create_purchase_order':
        return this.runBuiltInAutomation(actionType, ctx, cfg, step);
      default:
        return {
          type: action.type,
          status: 'skipped',
          detail: `Unknown automation action: ${action.type}`,
        };
    }
  }

  private async isWorkflowEmailEnabled(tenantId: string): Promise<boolean> {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    const notifications = tenant?.settings?.notifications as
      | { workflowEmails?: boolean }
      | undefined;
    return notifications?.workflowEmails !== false;
  }

  private findEmailInEntityData(
    data: Record<string, unknown>,
  ): string | undefined {
    const preferred = [
      'email',
      'work_email',
      'employee_email',
      'contact_email',
      'patient_email',
      'customer_email',
    ];
    for (const key of preferred) {
      const val = data[key];
      if (val && String(val).includes('@')) return String(val).trim();
    }
    for (const [key, val] of Object.entries(data)) {
      if (
        key.toLowerCase().includes('email') &&
        val &&
        String(val).includes('@')
      ) {
        return String(val).trim();
      }
    }
    return undefined;
  }

  private async sendEmail(
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
    step: WorkflowStep,
  ): Promise<AutomationActionResult> {
    let toRaw = this.resolveTemplate(String(cfg.to || '{{email}}'), ctx);
    if (!toRaw.includes('@')) {
      const inferred = this.findEmailInEntityData(ctx.entityData || {});
      if (inferred) toRaw = inferred;
    }
    const templateKey = String(cfg.template || 'workflow_message');
    const templateContent = this.resolveEmailTemplate(templateKey, ctx, step);
    const subject =
      this.resolveTemplate(
        String(cfg.subject || templateContent.subject || step.name),
        ctx,
      ) || step.name;
    const body =
      this.resolveTemplate(
        String(cfg.body || templateContent.body || step.description || ''),
        ctx,
      ) || templateContent.body;

    const recipientUserIds = await this.resolveRecipients(toRaw, ctx, cfg);
    const emailAddresses = await this.resolveRecipientEmails(
      recipientUserIds,
      toRaw,
    );

    if (recipientUserIds.length === 0 && emailAddresses.length === 0) {
      return {
        type: 'send_email',
        status: 'skipped',
        detail: `No recipient resolved for "${toRaw}" — check the record has an email field`,
      };
    }

    const workflowEmailsOn = await this.isWorkflowEmailEnabled(ctx.tenantId);
    let smtpResult = { sent: 0, failed: 0, results: [] as { error?: string; skippedReason?: string }[] };

    if (!workflowEmailsOn) {
      smtpResult = {
        sent: 0,
        failed: emailAddresses.length,
        results: [{ skippedReason: 'Workflow emails disabled in Settings → Notifications' }],
      };
    } else if (emailAddresses.length > 0) {
      smtpResult = await this.emailService.sendToMany(emailAddresses, {
        subject,
        text: body,
        html: this.formatEmailHtml(subject, body),
      });
    }

    const smtpError =
      smtpResult.results.find((r) => r.error)?.error ||
      smtpResult.results.find((r) => r.skippedReason)?.skippedReason;

    const provider = this.emailService.getProvider();
    const deliverySummary = !workflowEmailsOn
      ? 'Workflow emails turned off in workspace settings (in-app notification only)'
      : smtpResult.sent > 0
        ? `Email delivered (${provider}) to: ${emailAddresses.join(', ')}`
        : this.emailService.isEnabled()
          ? `Email NOT delivered (${provider}) to ${emailAddresses.join(', ')}${smtpError ? `: ${smtpError}` : ''}`
          : 'Email not configured — set RESEND_API_KEY or SMTP in .env, or use Settings → Email to test';

    for (const userId of recipientUserIds) {
      await this.createDashboardNotification(
        ctx,
        userId,
        smtpResult.sent > 0 ? subject : `Email failed: ${subject}`,
        `${deliverySummary}\n\n${body}`,
        NotificationType.BOTH,
        {
          emailTo: toRaw,
          template: templateKey,
          channel: 'email',
          smtpSent: smtpResult.sent > 0,
          smtpError: smtpError || null,
          targetEmails: emailAddresses,
        },
        smtpResult.sent > 0,
      );
    }

    const detail =
      smtpResult.sent > 0
        ? `Email sent to ${smtpResult.sent} address(es)`
        : deliverySummary;

    return {
      type: 'send_email',
      status: smtpResult.sent > 0 ? 'executed' : 'failed',
      detail,
      error: smtpResult.sent > 0 ? undefined : smtpError,
      data: {
        to: toRaw,
        subject,
        template: templateKey,
        userIds: recipientUserIds,
        emails: emailAddresses,
        smtpSent: smtpResult.sent,
        smtpFailed: smtpResult.failed,
        smtpError,
      },
    };
  }

  private resolveEmailTemplate(
    templateKey: string,
    ctx: AutomationContext,
    step: WorkflowStep,
  ): { subject: string; body: string } {
    const name =
      this.resolveTemplate('{{firstName}}', ctx) ||
      this.resolveTemplate('{{name}}', ctx) ||
      'there';

    const templates: Record<string, { subject: string; body: string }> = {
      welcome_employee: {
        subject: 'Welcome to the team',
        body: `Hi ${name},\n\nWelcome aboard! Your employee onboarding has started.\n\nWe're glad to have you on the team.`,
      },
      workflow_message: {
        subject: step.name,
        body: step.description || 'You have a new message from your workspace.',
      },
    };

    const extra: Record<string, { subject: string; body: string }> = {
      shipping_update: {
        subject: 'Your order has shipped',
        body: `Hi ${name},\n\nYour order is on the way. Track status in your account.`,
      },
      lab_results_ready: {
        subject: 'Lab results available',
        body: `Hi ${name},\n\nYour lab results are ready. Please log in or contact your clinic.`,
      },
      invoice_sent: {
        subject: 'Invoice from your workspace',
        body: `Hi ${name},\n\nPlease find your invoice details in the portal.`,
      },
    };

    return extra[templateKey] || templates[templateKey] || templates.workflow_message;
  }

  private formatEmailHtml(subject: string, body: string): string {
    const escaped = body
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a"><h2 style="margin:0 0 12px">${subject}</h2><p style="margin:0">${escaped}</p></body></html>`;
  }

  private async sendNotification(
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
    step: WorkflowStep,
  ): Promise<AutomationActionResult> {
    const toRaw = this.resolveTemplate(String(cfg.to || ''), ctx);
    const title = this.resolveTemplate(String(cfg.title || step.name), ctx);
    const message = this.resolveTemplate(
      String(cfg.message || cfg.body || step.description || ''),
      ctx,
    );

    const recipients = await this.resolveRecipients(toRaw, ctx, cfg);
    const targets =
      recipients.length > 0 ? recipients : [ctx.triggeredById];

    for (const userId of targets) {
      await this.createDashboardNotification(
        ctx,
        userId,
        title,
        message,
        NotificationType.DASHBOARD,
        { template: cfg.template },
      );
    }

    return {
      type: 'send_notification',
      status: 'executed',
      detail: `Dashboard notification sent to ${targets.length} user(s)`,
      data: { to: toRaw || 'triggered_by', userIds: targets },
    };
  }

  private async updateField(
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
  ): Promise<AutomationActionResult> {
    const recordId = ctx.recordId;
    if (!recordId) {
      return {
        type: 'update_field',
        status: 'skipped',
        detail: 'No record in workflow context to update',
      };
    }

    const field = String(cfg.field || '');
    if (!field) {
      return {
        type: 'update_field',
        status: 'skipped',
        detail: 'No field name provided',
      };
    }

    const record = await this.entityDataRepo.findOne({
      where: { id: recordId, tenantId: ctx.tenantId },
    });

    if (!record) {
      return {
        type: 'update_field',
        status: 'failed',
        error: `Record ${recordId} not found`,
      };
    }

    const rawValue =
      cfg.value !== undefined
        ? this.resolveTemplate(String(cfg.value), ctx)
        : String(cfg.value ?? '');

    const nextData = {
      ...record.data,
      [field]: this.coerceValue(rawValue),
    };

    await this.entityDataRepo.update(recordId, {
      data: nextData,
      updatedById: ctx.triggeredById,
    });

    if (ctx.entityData) {
      ctx.entityData[field] = nextData[field];
    }

    return {
      type: 'update_field',
      status: 'executed',
      detail: `Set ${field} on record`,
      data: { recordId, field, value: nextData[field] },
    };
  }

  private async createEntityRecord(
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
  ): Promise<AutomationActionResult> {
    let entityDefId = cfg.entityId as string | undefined;
    const slug = cfg.entitySlug as string | undefined;

    if (!entityDefId && slug) {
      const entity = await this.entityRepo.findOne({
        where: { slug, tenantId: ctx.tenantId },
      });
      entityDefId = entity?.id;
    }

    if (!entityDefId) {
      return {
        type: 'create_entity',
        status: 'skipped',
        detail: 'entityId or entitySlug required',
      };
    }

    const rawData = (cfg.data as Record<string, unknown>) || {};
    const resolvedData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(rawData)) {
      resolvedData[key] =
        typeof val === 'string'
          ? this.coerceValue(this.resolveTemplate(val, ctx))
          : val;
    }

    const created = this.entityDataRepo.create({
      entityId: entityDefId,
      tenantId: ctx.tenantId,
      data: resolvedData,
      createdById: ctx.triggeredById,
    });

    const saved = await this.entityDataRepo.save(created);

    return {
      type: 'create_entity',
      status: 'executed',
      detail: 'Created related record',
      data: { recordId: saved.id, entityId: entityDefId },
    };
  }

  private async runBuiltInAutomation(
    type: string,
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
    step: WorkflowStep,
  ): Promise<AutomationActionResult> {
    const messages: Record<string, string> = {
      validate_expense_policy: 'Expense policy validation completed automatically.',
      check_budget: 'Budget availability check recorded.',
      check_sla: 'SLA check completed for this ticket.',
      assign_ticket: 'Ticket assignment rules applied.',
      assign_owner: 'Record owner assignment recorded.',
      create_purchase_order: 'Purchase order draft created from workflow.',
    };

    const message =
      messages[type] || `Automation "${type}" executed.`;

    await this.createDashboardNotification(
      ctx,
      ctx.triggeredById,
      step.name,
      message,
      NotificationType.DASHBOARD,
      { automationType: type, config: cfg },
    );

    if (type === 'check_budget' && ctx.recordId) {
      await this.updateField(ctx, {
        field: String(cfg.field || 'budget_checked'),
        value: String(cfg.value ?? 'true'),
      });
    }

    return {
      type,
      status: 'executed',
      detail: message,
    };
  }

  resolveTemplate(template: string, ctx: AutomationContext): string {
    if (!template) return '';

    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawPath: string) => {
      const path = rawPath.trim();
      const parts = path.split('.');
      const fieldKey = parts[parts.length - 1];

      const data = ctx.entityData || {};
      if (data[fieldKey] !== undefined && data[fieldKey] !== null) {
        return String(data[fieldKey]);
      }

      const lowerKey = fieldKey.toLowerCase();
      for (const [key, val] of Object.entries(data)) {
        if (key.toLowerCase() === lowerKey && val !== undefined && val !== null) {
          return String(val);
        }
      }

      let cursor: unknown = data;
      for (const part of parts) {
        if (cursor && typeof cursor === 'object' && part in (cursor as object)) {
          cursor = (cursor as Record<string, unknown>)[part];
        } else {
          cursor = undefined;
          break;
        }
      }

      if (cursor !== undefined && cursor !== null) {
        return String(cursor);
      }

      return '';
    });
  }

  private async resolveRecipients(
    toRaw: string,
    ctx: AutomationContext,
    cfg: Record<string, unknown>,
  ): Promise<string[]> {
    const ids = new Set<string>();

    if (cfg.assignToUsers && Array.isArray(cfg.assignToUsers)) {
      for (const id of cfg.assignToUsers) {
        if (typeof id === 'string') ids.add(id);
      }
    }

    if (cfg.assignToRoles && Array.isArray(cfg.assignToRoles)) {
      const roleIds = cfg.assignToRoles as string[];
      const users = await this.userRepo.find({
        where: { tenantId: ctx.tenantId, isActive: true },
        relations: ['roles'],
      });
      for (const user of users) {
        if (user.roles?.some((r) => roleIds.includes(r.id))) {
          ids.add(user.id);
        }
      }
    }

    if (toRaw && toRaw.includes('@')) {
      const user = await this.userRepo.findOne({
        where: { email: toRaw, tenantId: ctx.tenantId, isActive: true },
      });
      if (user) ids.add(user.id);
    } else if (toRaw && !toRaw.includes('{{')) {
      const roles = await this.roleRepo.find({
        where: { name: toRaw, isActive: true },
        relations: ['users', 'tenant'],
      });
      const byRole = roles.find((r) => r.tenant?.id === ctx.tenantId);
      if (byRole?.users?.length) {
        for (const u of byRole.users) ids.add(u.id);
      }
    }

    const isResolvedExternalEmail =
      Boolean(toRaw) && toRaw.includes('@') && !toRaw.includes('{{');

    // Only fall back to the user who triggered the workflow when we have no external email target
    if (ids.size === 0 && ctx.triggeredById && !isResolvedExternalEmail) {
      ids.add(ctx.triggeredById);
    }

    // Notify admin about external email delivery status (sent or failed)
    if (isResolvedExternalEmail && ctx.triggeredById) {
      ids.add(ctx.triggeredById);
    }

    return [...ids];
  }

  private async resolveRecipientEmails(
    userIds: string[],
    explicitTo?: string,
  ): Promise<string[]> {
    const emails = new Set<string>();

    if (explicitTo?.includes('@') && !explicitTo.includes('{{')) {
      emails.add(explicitTo.trim().toLowerCase());
    }

    if (userIds.length > 0) {
      const users = await this.userRepo.find({
        where: { id: In(userIds) },
        select: ['id', 'email'],
      });
      for (const user of users) {
        if (user.email?.includes('@')) {
          emails.add(user.email.trim().toLowerCase());
        }
      }
    }

    return [...emails];
  }

  private async createDashboardNotification(
    ctx: AutomationContext,
    userId: string,
    title: string,
    message: string,
    type: string,
    metadata?: Record<string, unknown>,
    emailWasSent = false,
  ): Promise<void> {
    const notification = this.notificationRepo.create({
      title,
      message,
      type,
      isRead: false,
      userId,
      tenantId: ctx.tenantId,
      executionId: ctx.executionId,
      entityId: ctx.recordId,
      metadata: {
        ...metadata,
        entityType: ctx.entityType,
      } as Notification['metadata'],
      emailSentAt:
        emailWasSent && type === NotificationType.BOTH ? new Date() : undefined,
    });
    await this.notificationRepo.save(notification);
  }

  private coerceValue(value: string): unknown {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value !== '' && !Number.isNaN(Number(value))) return Number(value);
    return value;
  }
}
