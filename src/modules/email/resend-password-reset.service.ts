import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailResult } from './email.service';

export interface PasswordResetEmailContext {
  userName?: string;
  companyName?: string;
  expiresMinutes?: number;
}

/**
 * Forgot-password delivery via Resend SDK (HTTPS).
 * Production: set RESEND_FROM=noreply@yourdomain.com after domain verification.
 * Development: onboarding@resend.dev — only delivers to Resend-verified addresses.
 */
@Injectable()
export class ResendPasswordResetService {
  private readonly logger = new Logger(ResendPasswordResetService.name);
  private readonly client: Resend | null;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly emailDisabled: boolean;
  private readonly nodeEnv: string;
  /** Resend test mode inbox (your Resend signup email). Used only when direct send is blocked. */
  private readonly devInbox?: string;

  constructor(private readonly configService: ConfigService) {
    this.emailDisabled =
      this.configService.get<string>('EMAIL_DISABLED', 'false') === 'true';
    this.nodeEnv =
      this.configService.get<string>('NODE_ENV', 'development') ||
      'development';

    const apiKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    this.client = apiKey ? new Resend(apiKey) : null;

    this.fromAddress =
      this.configService.get<string>('RESEND_FROM')?.trim() ||
      'onboarding@resend.dev';
    this.fromName =
      this.configService.get<string>('SMTP_FROM_NAME')?.trim() || 'SuperERP';
    this.devInbox = this.configService
      .get<string>('RESEND_DEV_INBOX')
      ?.trim()
      .toLowerCase();

    if (!apiKey) {
      this.logger.warn(
        'RESEND_API_KEY is not set — password reset emails will not be sent',
      );
    } else {
      this.logger.log(
        `Resend password-reset ready (from ${this.fromAddress}, env=${this.nodeEnv})`,
      );
    }
  }

  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    context: PasswordResetEmailContext = {},
  ): Promise<SendEmailResult> {
    const recipient = to?.trim().toLowerCase();
    if (!recipient || !recipient.includes('@')) {
      return { sent: false, skippedReason: 'Invalid recipient email' };
    }

    if (!resetUrl?.trim()) {
      return { sent: false, skippedReason: 'Missing reset URL' };
    }

    if (this.emailDisabled) {
      this.logger.warn(
        `[Email disabled] Skipped password reset email to ${recipient}`,
      );
      return {
        sent: false,
        skippedReason: 'EMAIL_DISABLED=true',
      };
    }

    if (!this.client) {
      this.logger.warn(
        `Cannot send password reset to ${recipient}: RESEND_API_KEY missing`,
      );
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

    const result = await this.deliver(
      recipient,
      subject,
      greetingName,
      context.companyName,
      resetUrl.trim(),
      expiresMinutes,
    );

    if (result.sent) {
      return result;
    }

    const sandboxBlocked =
      this.nodeEnv !== 'production' &&
      result.error?.includes('only send testing') &&
      this.devInbox &&
      recipient !== this.devInbox;

    if (sandboxBlocked) {
      this.logger.warn(
        `Resend test mode: forwarding password reset for ${recipient} → ${this.devInbox}`,
      );
      return this.deliver(
        this.devInbox,
        subject,
        greetingName,
        context.companyName,
        resetUrl.trim(),
        expiresMinutes,
        recipient,
      );
    }

    if (result.error) {
      this.logger.error(
        `Resend password reset failed for ${recipient}: ${result.error}`,
      );
    }

    return result;
  }

  private async deliver(
    deliverTo: string,
    subject: string,
    greetingName: string,
    companyName: string | undefined,
    resetUrl: string,
    expiresMinutes: number,
    intendedRecipient?: string,
  ): Promise<SendEmailResult> {
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
      const { data, error } = await this.client!.emails.send({
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

      this.logger.log(
        `Password reset email sent to ${deliverTo}` +
          (intendedRecipient ? ` (for account ${intendedRecipient})` : '') +
          ` (id=${data?.id ?? 'ok'})`,
      );
      return { sent: true, messageId: data?.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return { sent: false, error: message };
    }
  }

  private buildText(options: {
    greetingName: string;
    companyName?: string;
    resetUrl: string;
    expiresMinutes: number;
    devBanner?: string;
  }): string {
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

  private buildHtml(options: {
    greetingName: string;
    companyName?: string;
    resetUrl: string;
    expiresMinutes: number;
    devBanner?: string;
  }): string {
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

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
