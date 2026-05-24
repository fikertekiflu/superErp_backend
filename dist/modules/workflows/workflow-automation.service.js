"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WorkflowAutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowAutomationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const entity_entity_1 = require("../entities/entity.entity");
const entity_data_entity_1 = require("../entities/entity-data.entity");
const user_entity_1 = require("../users/user.entity");
const notification_entity_1 = require("../notifications/notification.entity");
const role_entity_1 = require("../roles/role.entity");
const email_service_1 = require("../email/email.service");
const tenant_entity_1 = require("../tenants/tenant.entity");
let WorkflowAutomationService = WorkflowAutomationService_1 = class WorkflowAutomationService {
    entityDataRepo;
    entityRepo;
    userRepo;
    notificationRepo;
    roleRepo;
    tenantRepo;
    emailService;
    logger = new common_1.Logger(WorkflowAutomationService_1.name);
    constructor(entityDataRepo, entityRepo, userRepo, notificationRepo, roleRepo, tenantRepo, emailService) {
        this.entityDataRepo = entityDataRepo;
        this.entityRepo = entityRepo;
        this.userRepo = userRepo;
        this.notificationRepo = notificationRepo;
        this.roleRepo = roleRepo;
        this.tenantRepo = tenantRepo;
        this.emailService = emailService;
    }
    normalizeStepConfig(config) {
        if (!config)
            return { actions: [] };
        if (Array.isArray(config.actions) && config.actions.length > 0) {
            return config;
        }
        if (typeof config.action === 'string' || config.to || config.template) {
            let actionType = typeof config.action === 'string' ? String(config.action).trim() : '';
            if (!actionType && (config.to || config.template)) {
                actionType = 'send_email';
            }
            if (!actionType) {
                return { ...config, actions: [] };
            }
            const actionConfig = { ...config };
            delete actionConfig.action;
            if (actionType === 'send_email') {
                if (!actionConfig.to)
                    actionConfig.to = '{{email}}';
                if (!actionConfig.template)
                    actionConfig.template = 'workflow_message';
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
    async runAutomationStep(step, execution) {
        const normalized = this.normalizeStepConfig(step.config);
        const actions = (normalized.actions || []);
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
        const results = [];
        for (const action of actions) {
            try {
                const result = await this.executeAction(action, ctx, step);
                results.push(result);
            }
            catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                this.logger.warn(`Automation action ${action.type} failed: ${message}`);
                results.push({
                    type: action.type,
                    status: 'failed',
                    error: message,
                });
            }
        }
        return results;
    }
    buildContext(execution) {
        const c = execution.context || {};
        const recordId = c.recordId || c.entityId || undefined;
        return {
            tenantId: execution.tenantId,
            triggeredById: execution.triggeredById,
            executionId: execution.id,
            entityType: c.entityType,
            entityData: c.entityData || {},
            recordId,
            entityDefinitionId: c.entityDefinitionId || undefined,
        };
    }
    async executeAction(action, ctx, step) {
        const cfg = action.config || {};
        const actionType = action.type === 'create_record' ? 'create_entity' : action.type;
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
    async isWorkflowEmailEnabled(tenantId) {
        const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
        const notifications = tenant?.settings?.notifications;
        return notifications?.workflowEmails !== false;
    }
    findEmailInEntityData(data) {
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
            if (val && String(val).includes('@'))
                return String(val).trim();
        }
        for (const [key, val] of Object.entries(data)) {
            if (key.toLowerCase().includes('email') &&
                val &&
                String(val).includes('@')) {
                return String(val).trim();
            }
        }
        return undefined;
    }
    async sendEmail(ctx, cfg, step) {
        let toRaw = this.resolveTemplate(String(cfg.to || '{{email}}'), ctx);
        if (!toRaw.includes('@')) {
            const inferred = this.findEmailInEntityData(ctx.entityData || {});
            if (inferred)
                toRaw = inferred;
        }
        const templateKey = String(cfg.template || 'workflow_message');
        const templateContent = this.resolveEmailTemplate(templateKey, ctx, step);
        const subject = this.resolveTemplate(String(cfg.subject || templateContent.subject || step.name), ctx) || step.name;
        const body = this.resolveTemplate(String(cfg.body || templateContent.body || step.description || ''), ctx) || templateContent.body;
        const recipientUserIds = await this.resolveRecipients(toRaw, ctx, cfg);
        const emailAddresses = await this.resolveRecipientEmails(recipientUserIds, toRaw);
        if (recipientUserIds.length === 0 && emailAddresses.length === 0) {
            return {
                type: 'send_email',
                status: 'skipped',
                detail: `No recipient resolved for "${toRaw}" — check the record has an email field`,
            };
        }
        const workflowEmailsOn = await this.isWorkflowEmailEnabled(ctx.tenantId);
        let smtpResult = { sent: 0, failed: 0, results: [] };
        if (!workflowEmailsOn) {
            smtpResult = {
                sent: 0,
                failed: emailAddresses.length,
                results: [{ skippedReason: 'Workflow emails disabled in Settings → Notifications' }],
            };
        }
        else if (emailAddresses.length > 0) {
            smtpResult = await this.emailService.sendToMany(emailAddresses, {
                subject,
                text: body,
                html: this.formatEmailHtml(subject, body),
            });
        }
        const smtpError = smtpResult.results.find((r) => r.error)?.error ||
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
            await this.createDashboardNotification(ctx, userId, smtpResult.sent > 0 ? subject : `Email failed: ${subject}`, `${deliverySummary}\n\n${body}`, notification_entity_1.NotificationType.BOTH, {
                emailTo: toRaw,
                template: templateKey,
                channel: 'email',
                smtpSent: smtpResult.sent > 0,
                smtpError: smtpError || null,
                targetEmails: emailAddresses,
            }, smtpResult.sent > 0);
        }
        const detail = smtpResult.sent > 0
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
    resolveEmailTemplate(templateKey, ctx, step) {
        const name = this.resolveTemplate('{{firstName}}', ctx) ||
            this.resolveTemplate('{{name}}', ctx) ||
            'there';
        const templates = {
            welcome_employee: {
                subject: 'Welcome to the team',
                body: `Hi ${name},\n\nWelcome aboard! Your employee onboarding has started.\n\nWe're glad to have you on the team.`,
            },
            workflow_message: {
                subject: step.name,
                body: step.description || 'You have a new message from your workspace.',
            },
        };
        const extra = {
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
    formatEmailHtml(subject, body) {
        const escaped = body
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br/>');
        return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a"><h2 style="margin:0 0 12px">${subject}</h2><p style="margin:0">${escaped}</p></body></html>`;
    }
    async sendNotification(ctx, cfg, step) {
        const toRaw = this.resolveTemplate(String(cfg.to || ''), ctx);
        const title = this.resolveTemplate(String(cfg.title || step.name), ctx);
        const message = this.resolveTemplate(String(cfg.message || cfg.body || step.description || ''), ctx);
        const recipients = await this.resolveRecipients(toRaw, ctx, cfg);
        const targets = recipients.length > 0 ? recipients : [ctx.triggeredById];
        for (const userId of targets) {
            await this.createDashboardNotification(ctx, userId, title, message, notification_entity_1.NotificationType.DASHBOARD, { template: cfg.template });
        }
        return {
            type: 'send_notification',
            status: 'executed',
            detail: `Dashboard notification sent to ${targets.length} user(s)`,
            data: { to: toRaw || 'triggered_by', userIds: targets },
        };
    }
    async updateField(ctx, cfg) {
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
        const rawValue = cfg.value !== undefined
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
    async createEntityRecord(ctx, cfg) {
        let entityDefId = cfg.entityId;
        const slug = cfg.entitySlug;
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
        const rawData = cfg.data || {};
        const resolvedData = {};
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
    async runBuiltInAutomation(type, ctx, cfg, step) {
        const messages = {
            validate_expense_policy: 'Expense policy validation completed automatically.',
            check_budget: 'Budget availability check recorded.',
            check_sla: 'SLA check completed for this ticket.',
            assign_ticket: 'Ticket assignment rules applied.',
            assign_owner: 'Record owner assignment recorded.',
            create_purchase_order: 'Purchase order draft created from workflow.',
        };
        const message = messages[type] || `Automation "${type}" executed.`;
        await this.createDashboardNotification(ctx, ctx.triggeredById, step.name, message, notification_entity_1.NotificationType.DASHBOARD, { automationType: type, config: cfg });
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
    resolveTemplate(template, ctx) {
        if (!template)
            return '';
        return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, rawPath) => {
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
            let cursor = data;
            for (const part of parts) {
                if (cursor && typeof cursor === 'object' && part in cursor) {
                    cursor = cursor[part];
                }
                else {
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
    async resolveRecipients(toRaw, ctx, cfg) {
        const ids = new Set();
        if (cfg.assignToUsers && Array.isArray(cfg.assignToUsers)) {
            for (const id of cfg.assignToUsers) {
                if (typeof id === 'string')
                    ids.add(id);
            }
        }
        if (cfg.assignToRoles && Array.isArray(cfg.assignToRoles)) {
            const roleIds = cfg.assignToRoles;
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
            if (user)
                ids.add(user.id);
        }
        else if (toRaw && !toRaw.includes('{{')) {
            const roles = await this.roleRepo.find({
                where: { name: toRaw, isActive: true },
                relations: ['users', 'tenant'],
            });
            const byRole = roles.find((r) => r.tenant?.id === ctx.tenantId);
            if (byRole?.users?.length) {
                for (const u of byRole.users)
                    ids.add(u.id);
            }
        }
        const isResolvedExternalEmail = Boolean(toRaw) && toRaw.includes('@') && !toRaw.includes('{{');
        if (ids.size === 0 && ctx.triggeredById && !isResolvedExternalEmail) {
            ids.add(ctx.triggeredById);
        }
        if (isResolvedExternalEmail && ctx.triggeredById) {
            ids.add(ctx.triggeredById);
        }
        return [...ids];
    }
    async resolveRecipientEmails(userIds, explicitTo) {
        const emails = new Set();
        if (explicitTo?.includes('@') && !explicitTo.includes('{{')) {
            emails.add(explicitTo.trim().toLowerCase());
        }
        if (userIds.length > 0) {
            const users = await this.userRepo.find({
                where: { id: (0, typeorm_2.In)(userIds) },
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
    async createDashboardNotification(ctx, userId, title, message, type, metadata, emailWasSent = false) {
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
            },
            emailSentAt: emailWasSent && type === notification_entity_1.NotificationType.BOTH ? new Date() : undefined,
        });
        await this.notificationRepo.save(notification);
    }
    coerceValue(value) {
        if (value === 'true')
            return true;
        if (value === 'false')
            return false;
        if (value !== '' && !Number.isNaN(Number(value)))
            return Number(value);
        return value;
    }
};
exports.WorkflowAutomationService = WorkflowAutomationService;
exports.WorkflowAutomationService = WorkflowAutomationService = WorkflowAutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(entity_data_entity_1.EntityData)),
    __param(1, (0, typeorm_1.InjectRepository)(entity_entity_1.Entity)),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(notification_entity_1.Notification)),
    __param(4, (0, typeorm_1.InjectRepository)(role_entity_1.Role)),
    __param(5, (0, typeorm_1.InjectRepository)(tenant_entity_1.Tenant)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        email_service_1.EmailService])
], WorkflowAutomationService);
//# sourceMappingURL=workflow-automation.service.js.map