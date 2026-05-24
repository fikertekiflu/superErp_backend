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
var ResendPasswordResetService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendPasswordResetService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const resend_1 = require("resend");
let ResendPasswordResetService = ResendPasswordResetService_1 = class ResendPasswordResetService {
    configService;
    logger = new common_1.Logger(ResendPasswordResetService_1.name);
    client;
    fromAddress;
    fromName;
    emailDisabled;
    nodeEnv;
    devInbox;
    constructor(configService) {
        this.configService = configService;
        this.emailDisabled =
            this.configService.get('EMAIL_DISABLED', 'false') === 'true';
        this.nodeEnv =
            this.configService.get('NODE_ENV', 'development') ||
                'development';
        const apiKey = this.configService.get('RESEND_API_KEY')?.trim();
        this.client = apiKey ? new resend_1.Resend(apiKey) : null;
        this.fromAddress =
            this.configService.get('RESEND_FROM')?.trim() ||
                'onboarding@resend.dev';
        this.fromName =
            this.configService.get('SMTP_FROM_NAME')?.trim() || 'SuperERP';
        this.devInbox = this.configService
            .get('RESEND_DEV_INBOX')
            ?.trim()
            .toLowerCase();
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY is not set — password reset emails will not be sent');
        }
        else {
            this.logger.log(`Resend password-reset ready (from ${this.fromAddress}, env=${this.nodeEnv})`);
        }
    }
    async sendPasswordResetEmail(to, resetUrl, context = {}) {
        const recipient = to?.trim().toLowerCase();
        if (!recipient || !recipient.includes('@')) {
            return { sent: false, skippedReason: 'Invalid recipient email' };
        }
        if (!resetUrl?.trim()) {
            return { sent: false, skippedReason: 'Missing reset URL' };
        }
        if (this.emailDisabled) {
            this.logger.warn(`[Email disabled] Skipped password reset email to ${recipient}`);
            return {
                sent: false,
                skippedReason: 'EMAIL_DISABLED=true',
            };
        }
        if (!this.client) {
            this.logger.warn(`Cannot send password reset to ${recipient}: RESEND_API_KEY missing`);
            return {
                sent: false,
                skippedReason: 'RESEND_API_KEY not configured',
            };
        }
        const expiresMinutes = context.expiresMinutes ?? 60;
        const greetingName = context.userName?.trim() || 'there';
        const companyLine = context.companyName?.trim()
            ? ` for ${context.companyName.trim()}`
            : '';
        const subject = `Reset your${companyLine || ''} SuperERP password`;
        const result = await this.deliver(recipient, subject, greetingName, context.companyName, resetUrl.trim(), expiresMinutes);
        if (result.sent) {
            return result;
        }
        const sandboxBlocked = this.nodeEnv !== 'production' &&
            result.error?.includes('only send testing') &&
            this.devInbox &&
            recipient !== this.devInbox;
        if (sandboxBlocked) {
            this.logger.warn(`Resend test mode: forwarding password reset for ${recipient} → ${this.devInbox}`);
            return this.deliver(this.devInbox, subject, greetingName, context.companyName, resetUrl.trim(), expiresMinutes, recipient);
        }
        if (result.error) {
            this.logger.error(`Resend password reset failed for ${recipient}: ${result.error}`);
        }
        return result;
    }
    async deliver(deliverTo, subject, greetingName, companyName, resetUrl, expiresMinutes, intendedRecipient) {
        const devBanner = intendedRecipient
            ? `Requested for SuperERP account: ${intendedRecipient}. The reset link below still works for that login.`
            : undefined;
        const html = this.buildHtml({
            greetingName,
            companyName,
            resetUrl,
            expiresMinutes,
            devBanner,
        });
        const text = this.buildText({
            greetingName,
            companyName,
            resetUrl,
            expiresMinutes,
            devBanner,
        });
        try {
            const { data, error } = await this.client.emails.send({
                from: `${this.fromName} <${this.fromAddress}>`,
                to: [deliverTo],
                subject: intendedRecipient
                    ? `${subject} (dev forward)`
                    : subject,
                html,
                text,
            });
            if (error) {
                const message = error.message || JSON.stringify(error);
                return { sent: false, error: message };
            }
            this.logger.log(`Password reset email sent to ${deliverTo}` +
                (intendedRecipient ? ` (for account ${intendedRecipient})` : '') +
                ` (id=${data?.id ?? 'ok'})`);
            return { sent: true, messageId: data?.id };
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            return { sent: false, error: message };
        }
    }
    buildText(options) {
        const company = options.companyName
            ? `\nCompany: ${options.companyName}`
            : '';
        const dev = options.devBanner ? `\n[Development] ${options.devBanner}\n` : '';
        return [
            `Hi ${options.greetingName},`,
            '',
            'We received a request to reset your SuperERP password.',
            company,
            dev,
            '',
            `Reset your password (expires in ${options.expiresMinutes} minutes):`,
            options.resetUrl,
            '',
            'If you did not request this, ignore this email.',
            '',
            `— ${this.fromName}`,
        ]
            .filter((line) => line !== undefined)
            .join('\n');
    }
    buildHtml(options) {
        const safeName = this.escapeHtml(options.greetingName);
        const safeUrl = this.escapeHtml(options.resetUrl);
        const companyBlock = options.companyName
            ? `<p style="margin:0 0 16px;color:#475569;font-size:14px;">Workspace: <strong>${this.escapeHtml(options.companyName)}</strong></p>`
            : '';
        const devBlock = options.devBanner
            ? `<p style="margin:0 0 16px;padding:12px;background:#fef3c7;border-radius:8px;font-size:13px;color:#92400e;"><strong>Development:</strong> ${this.escapeHtml(options.devBanner)}</p>`
            : '';
        return `<!DOCTYPE html>
<html>
<body style="font-family:system-ui,sans-serif;line-height:1.5;color:#0f172a;max-width:560px;margin:0 auto;padding:24px;">
  <div style="background:#0f172a;color:#D7FF53;padding:16px 20px;border-radius:12px 12px 0 0;font-weight:800;">${this.escapeHtml(this.fromName)}</div>
  <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 12px 12px;">
    <h2 style="margin:0 0 12px;font-size:20px;">Reset your password</h2>
    <p style="margin:0 0 16px;color:#475569;">Hi ${safeName}, we received a request to reset your password.</p>
    ${devBlock}
    ${companyBlock}
    <p style="margin:0 0 20px;color:#475569;">This link expires in <strong>${options.expiresMinutes} minutes</strong>.</p>
    <p style="margin:0 0 24px;">
      <a href="${safeUrl}" style="display:inline-block;background:#0f172a;color:#D7FF53;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:700;">Reset password</a>
    </p>
    <p style="margin:0 0 8px;font-size:13px;color:#64748b;">Or copy this link:</p>
    <p style="margin:0 0 20px;font-size:12px;word-break:break-all;color:#334155;">${safeUrl}</p>
    <p style="margin:0;font-size:12px;color:#94a3b8;">If you did not request a password reset, you can ignore this email.</p>
  </div>
</body>
</html>`;
    }
    escapeHtml(value) {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
};
exports.ResendPasswordResetService = ResendPasswordResetService;
exports.ResendPasswordResetService = ResendPasswordResetService = ResendPasswordResetService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ResendPasswordResetService);
//# sourceMappingURL=resend-password-reset.service.js.map