import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  PasswordResetEmailContext,
  ResendPasswordResetService,
} from './resend-password-reset.service';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface SendEmailResult {
  sent: boolean;
  messageId?: string;
  error?: string;
  skippedReason?: string;
}

export interface EmailPublicStatus {
  enabled: boolean;
  provider: 'gmail' | 'smtp' | 'resend' | 'none';
  deliveryMethod?: 'gmail_api' | 'gmail_smtp' | 'resend' | 'smtp';
  fromAddress: string;
  fromName: string;
  replyTo?: string;
  environment: string;
  verified: boolean;
  verificationMessage?: string;
  smtpBlocked?: boolean;
  productionReady: boolean;
  setupHint: string;
  warnings: string[];
}

type EmailProvider = 'gmail' | 'smtp' | 'resend';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private fallbackTransporter: Transporter | null = null;
  private readonly provider: EmailProvider | 'none';
  private readonly isGmail: boolean;
  private readonly useGmailApi: boolean;
  private readonly gmailClientId?: string;
  private readonly gmailClientSecret?: string;
  private readonly gmailRefreshToken?: string;
  private readonly enabled: boolean;
  private readonly fromAddress: string;
  private readonly fromName: string;
  private readonly replyTo?: string;
  private readonly appPublicUrl?: string;
  private readonly smtpHost: string;
  private readonly smtpPort: number;
  private readonly smtpSecure: boolean;
  private readonly resendApiKey: string | undefined;
  private readonly nodeEnv: string;
  private verificationMessage?: string;
  private verified = false;
  private readonly warnings: string[] = [];
  /** When true, workflow/automation emails are skipped (in-app notifications still work). */
  private readonly workflowEmailSuspended: boolean;
  /** When true with EMAIL_DISABLED, password-reset and other auth emails still send. */
  private readonly authEmailEnabled: boolean;
  constructor(
    private readonly configService: ConfigService,
    private readonly resendPasswordReset: ResendPasswordResetService,
  ) {
    this.workflowEmailSuspended =
      this.configService.get<string>('EMAIL_DISABLED', 'false') === 'true';
    this.authEmailEnabled =
      this.configService.get<string>('AUTH_EMAIL_ENABLED', 'false') === 'true';

    if (this.workflowEmailSuspended && !this.authEmailEnabled) {
      this.nodeEnv =
        this.configService.get<string>('NODE_ENV', 'development') ||
        'development';
      this.provider = 'none';
      this.isGmail = false;
      this.useGmailApi = false;
      this.enabled = false;
      this.fromAddress = 'disabled@local';
      this.fromName = 'SuperERP';
      this.smtpHost = '';
      this.smtpPort = 587;
      this.smtpSecure = false;
      this.warnings.push(
        'Email is suspended (EMAIL_DISABLED=true). In-app notifications still work.',
      );
      this.logger.log('Email suspended via EMAIL_DISABLED=true');
      return;
    }

    if (this.workflowEmailSuspended && this.authEmailEnabled) {
      this.warnings.push(
        'Workflow emails suspended; auth emails (password reset) are enabled via AUTH_EMAIL_ENABLED=true.',
      );
    }

    this.nodeEnv =
      this.configService.get<string>('NODE_ENV', 'development') || 'development';
    const explicitProvider = this.configService
      .get<string>('EMAIL_PROVIDER')
      ?.trim()
      .toLowerCase();
    const resendKey = this.configService.get<string>('RESEND_API_KEY')?.trim();
    const smtpOn =
      this.configService.get<string>('SMTP_ENABLED', 'false') === 'true';
    const smtpUser = this.configService.get<string>('SMTP_USER')?.trim();
    const smtpPass = this.configService
      .get<string>('SMTP_PASS')
      ?.replace(/\s+/g, '');

    const gmailClientId = this.configService.get<string>('GMAIL_CLIENT_ID')?.trim();
    const gmailClientSecret = this.configService
      .get<string>('GMAIL_CLIENT_SECRET')
      ?.trim();
    const gmailRefreshToken = this.configService
      .get<string>('GMAIL_REFRESH_TOKEN')
      ?.trim();
    const gmailApiReady = Boolean(
      gmailClientId && gmailClientSecret && gmailRefreshToken,
    );

    const isGmailAddress = Boolean(
      smtpUser?.toLowerCase().endsWith('@gmail.com'),
    );
    const wantsGmail =
      explicitProvider === 'gmail' ||
      explicitProvider === 'google' ||
      explicitProvider === 'gmail_api' ||
      (explicitProvider === 'smtp' &&
        ((this.configService.get<string>('SMTP_HOST') || '').includes('gmail') ||
          isGmailAddress));

    this.gmailClientId = gmailClientId;
    this.gmailClientSecret = gmailClientSecret;
    this.gmailRefreshToken = gmailRefreshToken;

    if (
      explicitProvider === 'resend' ||
      (!explicitProvider && resendKey && !smtpOn && !smtpUser)
    ) {
      this.provider = 'resend';
      this.isGmail = false;
      this.useGmailApi = false;
      this.enabled = Boolean(resendKey);
      this.resendApiKey = resendKey;
    } else if (wantsGmail) {
      this.provider = 'gmail';
      this.isGmail = true;
      this.useGmailApi =
        gmailApiReady &&
        (explicitProvider === 'gmail_api' ||
          explicitProvider === 'gmail' ||
          wantsGmail);
      this.enabled = this.useGmailApi || Boolean(smtpUser && smtpPass);
      this.resendApiKey = undefined;
    } else if (
      explicitProvider === 'smtp' ||
      smtpOn ||
      (smtpUser && smtpPass && explicitProvider !== 'resend')
    ) {
      this.provider = isGmailAddress ? 'gmail' : 'smtp';
      this.isGmail = isGmailAddress;
      this.useGmailApi = false;
      this.enabled = smtpOn || Boolean(smtpUser && smtpPass);
      this.resendApiKey = undefined;
    } else {
      this.provider = 'none';
      this.isGmail = false;
      this.useGmailApi = false;
      this.enabled = false;
      this.resendApiKey = undefined;
    }

    this.fromAddress =
      this.configService.get<string>('SMTP_FROM')?.trim() ||
      this.configService.get<string>('RESEND_FROM')?.trim() ||
      smtpUser ||
      'onboarding@resend.dev';
    this.fromName =
      this.configService.get<string>('SMTP_FROM_NAME')?.trim() || 'SuperERP';
    this.replyTo = this.configService.get<string>('EMAIL_REPLY_TO')?.trim();
    this.appPublicUrl = this.configService
      .get<string>('APP_PUBLIC_URL')
      ?.trim()
      ?.replace(/\/$/, '');

    if (this.isGmail) {
      this.smtpHost = 'smtp.gmail.com';
      this.smtpPort = parseInt(
        this.configService.get<string>('SMTP_PORT', '587'),
        10,
      );
      let secure =
        this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
      if (this.smtpPort === 465 && !secure) {
        secure = true;
        this.warnings.push(
          'SMTP_PORT=465 requires SMTP_SECURE=true — auto-corrected. Or use SMTP_PORT=587 with SMTP_SECURE=false.',
        );
      }
      if (this.smtpPort === 587 && secure) {
        this.warnings.push(
          'SMTP_PORT=587 usually uses SMTP_SECURE=false (STARTTLS).',
        );
      }
      this.smtpSecure = secure;
    } else {
      this.smtpHost = this.configService.get<string>('SMTP_HOST', 'localhost');
      this.smtpPort = parseInt(
        this.configService.get<string>('SMTP_PORT', '587'),
        10,
      );
      this.smtpSecure =
        this.configService.get<string>('SMTP_SECURE', 'false') === 'true';
    }

    if (this.provider === 'resend') {
      if (this.enabled) {
        this.logger.log(
          `Email: Resend API (from ${this.fromAddress}) — HTTPS, suitable for production`,
        );
        if (this.fromAddress.includes('resend.dev')) {
          this.warnings.push(
            'Using Resend sandbox sender (onboarding@resend.dev). For production, verify a domain at resend.com and set RESEND_FROM=notifications@yourdomain.com',
          );
        }
      } else {
        this.logger.warn('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing');
      }
      return;
    }

    if ((this.provider === 'smtp' || this.provider === 'gmail') && this.enabled) {
      if (this.useGmailApi) {
        this.logger.log(
          `Email: Gmail API (HTTPS) as ${smtpUser} — works when SMTP ports are blocked`,
        );
        return;
      }

      const auth = this.buildAuth();
      if (!auth) {
        this.logger.error(
          'Gmail/SMTP enabled but SMTP_USER/SMTP_PASS missing — emails will not send. Or set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN for Gmail API.',
        );
        return;
      }

      if (this.isGmail) {
        this.transporter = this.createSmtpTransporter(
          auth,
          this.smtpPort,
          this.smtpSecure,
        );
        const altPort = this.smtpPort === 587 ? 465 : 587;
        const altSecure = altPort === 465;
        this.fallbackTransporter = this.createSmtpTransporter(
          auth,
          altPort,
          altSecure,
        );
        this.logger.log(
          `Email: Gmail (${smtpUser}) via smtp.gmail.com:${this.smtpPort}` +
            ` (fallback port ${altPort} if blocked)`,
        );
        this.warnings.push(
          'Use a Google App Password (16 chars, no spaces), not your normal Gmail password. Enable 2-Step Verification first: myaccount.google.com/apppasswords',
        );
      } else {
        this.transporter = this.createSmtpTransporter(
          auth,
          this.smtpPort,
          this.smtpSecure,
        );
        this.logger.log(
          `Email: SMTP (${this.smtpHost}:${this.smtpPort}, secure=${this.smtpSecure})`,
        );
      }
      return;
    }

    this.logger.warn(
      'Email disabled. For Gmail: EMAIL_PROVIDER=gmail, SMTP_USER, SMTP_PASS (app password)',
    );
  }

  private createSmtpTransporter(
    auth: { user: string; pass: string },
    port: number,
    secure: boolean,
  ): Transporter {
    const host = this.isGmail ? 'smtp.gmail.com' : this.smtpHost;
    return nodemailer.createTransport({
      host,
      port,
      secure,
      auth,
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 25_000,
      ...(secure
        ? {}
        : {
            requireTLS: true,
            tls: { minVersion: 'TLSv1.2' },
          }),
    });
  }

  async onModuleInit(): Promise<void> {
    if (!this.isTransportReady()) {
      this.verified = false;
      this.verificationMessage = 'Email not configured';
      return;
    }

    if (this.provider === 'resend') {
      await this.verifyResend();
      return;
    }

    if (this.useGmailApi) {
      await this.verifyGmailApi();
      return;
    }

    if (this.transporter) {
      try {
        await this.transporter.verify();
        this.verified = true;
        this.verificationMessage = 'SMTP connection verified';
        this.logger.log('SMTP connection verified successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.verified = false;
        this.verificationMessage = message;
        if (this.isGmail && this.fallbackTransporter) {
          try {
            await this.fallbackTransporter.verify();
            this.verified = true;
            this.verificationMessage =
              `Primary port ${this.smtpPort} failed; fallback port works`;
            this.logger.warn(this.verificationMessage);
            return;
          } catch {
            /* both failed */
          }
        }
        if (this.isGmail && this.gmailRefreshToken) {
          this.warnings.push(
            'SMTP ports blocked on this network. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN to use Gmail over HTTPS (see .env.example).',
          );
        }
        this.logger.error(
          `SMTP connection failed (${this.smtpHost}:${this.smtpPort}): ${message}. ` +
            (this.isGmail
              ? 'ECONNREFUSED = your network blocks Gmail SMTP. Use Gmail API (HTTPS) or EMAIL_PROVIDER=resend.'
              : 'Consider EMAIL_PROVIDER=resend if SMTP ports are blocked.'),
        );
      }
    }
  }

  private async getGmailAccessToken(): Promise<string> {
    if (
      !this.gmailClientId ||
      !this.gmailClientSecret ||
      !this.gmailRefreshToken
    ) {
      throw new Error('Gmail API credentials incomplete');
    }

    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      new URLSearchParams({
        client_id: this.gmailClientId,
        client_secret: this.gmailClientSecret,
        refresh_token: this.gmailRefreshToken,
        grant_type: 'refresh_token',
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    const token = response.data?.access_token as string | undefined;
    if (!token) throw new Error('No access_token from Google');
    return token;
  }

  private async verifyGmailApi(): Promise<void> {
    try {
      await this.getGmailAccessToken();
      this.verified = true;
      this.verificationMessage = 'Gmail API (HTTPS) ready — SMTP not required';
      this.logger.log('Gmail API credentials verified');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.verified = false;
      this.verificationMessage = message;
      this.logger.error(`Gmail API verification failed: ${message}`);
    }
  }

  private buildRawEmailMessage(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): string {
    const from = `${this.fromName} <${this.fromAddress}>`;
    const lines = [
      `From: ${from}`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
    ];
    if (this.replyTo) {
      lines.push(`Reply-To: ${this.replyTo}`);
    }
    const body = html || text;
    const raw = `${lines.join('\r\n')}\r\n\r\n${body}`;
    return Buffer.from(raw)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private async sendViaGmailApi(
    to: string,
    subject: string,
    text: string | undefined,
    html: string,
  ): Promise<SendEmailResult> {
    try {
      const accessToken = await this.getGmailAccessToken();
      const raw = this.buildRawEmailMessage(
        to,
        subject,
        text || subject,
        html,
      );

      const response = await axios.post(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        { raw },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 25_000,
        },
      );

      const messageId = response.data?.id as string | undefined;
      this.logger.log(`Email sent via Gmail API to ${to} (${messageId || 'ok'})`);
      return { sent: true, messageId };
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? JSON.stringify(err.response?.data) || err.message
        : err instanceof Error
          ? err.message
          : String(err);
      this.logger.error(`Gmail API failed for ${to}: ${message}`);
      return { sent: false, error: message };
    }
  }

  private async verifyResend(): Promise<void> {
    try {
      await axios.get('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${this.resendApiKey}` },
        timeout: 10_000,
      });
      this.verified = true;
      this.verificationMessage = 'Resend API key valid';
      this.logger.log('Resend API key verified');
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.status === 401
          ? 'Invalid RESEND_API_KEY'
          : err.message
        : err instanceof Error
          ? err.message
          : String(err);
      this.verified = false;
      this.verificationMessage = message;
      this.logger.warn(`Resend verification: ${message} (sends may still work)`);
    }
  }

  /** Workflow / automation emails (respects EMAIL_DISABLED). */
  isEnabled(): boolean {
    if (this.workflowEmailSuspended) return false;
    return this.isTransportReady();
  }

  /** Password reset and other auth transactional emails. */
  isAuthEmailEnabled(): boolean {
    if (this.workflowEmailSuspended && !this.authEmailEnabled) return false;
    return this.isTransportReady();
  }

  private isTransportReady(): boolean {
    if (!this.enabled) return false;
    if (this.provider === 'resend') return Boolean(this.resendApiKey);
    if (this.useGmailApi) return true;
    if (this.provider === 'smtp' || this.provider === 'gmail') {
      return this.transporter !== null;
    }
    return false;
  }

  getProvider(): EmailProvider | 'none' {
    return this.provider;
  }

  getPublicStatus(): EmailPublicStatus {
    const smtpBlocked = Boolean(
      this.verificationMessage?.includes('ECONNREFUSED'),
    );

    const deliveryMethod: EmailPublicStatus['deliveryMethod'] =
      this.provider === 'resend'
        ? 'resend'
        : this.useGmailApi
          ? 'gmail_api'
          : this.isGmail
            ? 'gmail_smtp'
            : this.provider === 'smtp'
              ? 'smtp'
              : undefined;

    const productionReady =
      this.isAuthEmailEnabled() &&
      this.verified &&
      (this.provider === 'resend'
        ? !this.fromAddress.includes('resend.dev')
        : true);

    if (
      !this.isAuthEmailEnabled() &&
      this.warnings.some((w) => w.includes('suspended'))
    ) {
      return {
        enabled: false,
        provider: 'none',
        deliveryMethod: undefined,
        fromAddress: this.fromAddress,
        fromName: this.fromName,
        replyTo: this.replyTo,
        environment: this.nodeEnv,
        verified: true,
        verificationMessage: 'Email suspended — enable later with EMAIL_DISABLED=false',
        smtpBlocked: false,
        productionReady: false,
        setupHint:
          'Email is turned off for now. Workflows and Tasks still work with in-app notifications. Set EMAIL_DISABLED=false when ready to configure Gmail or Resend.',
        warnings: this.warnings,
      };
    }

    let setupHint =
      'Gmail: set EMAIL_PROVIDER=gmail, SMTP_USER=you@gmail.com, SMTP_PASS=16-char app password, restart server.';
    if (smtpBlocked && this.isGmail && !this.useGmailApi) {
      setupHint =
        'Your network blocks Gmail SMTP (ECONNREFUSED). Fix: add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN for Gmail API (HTTPS), OR use EMAIL_PROVIDER=resend, OR run the backend on a cloud server.';
    } else if (this.provider === 'resend') {
      setupHint =
        'Set EMAIL_PROVIDER=resend, RESEND_API_KEY, and RESEND_FROM=you@your-verified-domain.com in .env, then restart the server.';
    } else if (this.provider === 'smtp' && !this.isGmail) {
      setupHint =
        'For Gmail use EMAIL_PROVIDER=gmail (not smtp). Or set SMTP_HOST=smtp.gmail.com with app password.';
    } else if (this.isEnabled() && this.fromAddress.includes('resend.dev')) {
      setupHint =
        'Resend works in test mode. For production: verify your domain at resend.com, then set RESEND_FROM=notifications@yourdomain.com';
    } else if (this.isEnabled() && this.verified) {
      setupHint = 'Email is configured. Use POST /email/test to send a test message.';
    }

    const authOnly =
      this.workflowEmailSuspended &&
      this.authEmailEnabled &&
      this.isAuthEmailEnabled();

    return {
      enabled: this.isAuthEmailEnabled(),
      provider: this.isGmail ? 'gmail' : this.provider,
      deliveryMethod,
      fromAddress: this.fromAddress,
      fromName: this.fromName,
      replyTo: this.replyTo,
      environment: this.nodeEnv,
      verified: this.verified,
      verificationMessage: authOnly
        ? 'Auth email only (password reset). Workflow emails remain off.'
        : this.verificationMessage,
      smtpBlocked,
      productionReady,
      setupHint: authOnly
        ? 'Password reset emails are enabled. Set EMAIL_DISABLED=false to also send workflow emails.'
        : setupHint,
      warnings: this.warnings,
    };
  }

  /**
   * Forgot-password delivery via Resend SDK (see ResendPasswordResetService).
   */
  async sendPasswordResetEmail(
    to: string,
    resetUrl: string,
    context: PasswordResetEmailContext = {},
  ): Promise<SendEmailResult> {
    return this.resendPasswordReset.sendPasswordResetEmail(to, resetUrl, context);
  }

  /** Legacy transactional path for non–password-reset mail. */
  private async sendTransactional(
    to: string,
    subject: string,
    text: string,
    html: string,
  ): Promise<SendEmailResult> {
    if (this.provider === 'resend') {
      return this.sendViaResend(to, subject, text, html);
    }
    if (this.useGmailApi) {
      return this.sendViaGmailApi(to, subject, text, html);
    }
    if (this.provider === 'smtp' || this.provider === 'gmail') {
      const smtpResult = await this.sendViaSmtp(to, subject, text, html);
      if (
        !smtpResult.sent &&
        smtpResult.error?.includes('ECONNREFUSED') &&
        this.gmailRefreshToken
      ) {
        this.logger.warn('SMTP blocked — retrying password reset via Gmail API');
        return this.sendViaGmailApi(to, subject, text, html);
      }
      return smtpResult;
    }
    return { sent: false, skippedReason: 'Email transport not available' };
  }

  async sendTestEmail(to: string): Promise<SendEmailResult> {
    const status = this.getPublicStatus();
    const dashboardLink = this.appPublicUrl
      ? `${this.appPublicUrl}/dashboard`
      : undefined;

    const text = [
      'This is a test email from SuperERP.',
      '',
      `Provider: ${status.provider}`,
      `From: ${status.fromName} <${status.fromAddress}>`,
      `Environment: ${status.environment}`,
      `Verified: ${status.verified ? 'yes' : 'no'}`,
      dashboardLink ? `\nOpen dashboard: ${dashboardLink}` : '',
      '',
      'If you received this, workflow notification emails should work too.',
    ]
      .filter(Boolean)
      .join('\n');

    return this.send({
      to,
      subject: `SuperERP test email (${new Date().toISOString().slice(0, 10)})`,
      text,
    });
  }

  async send(options: SendEmailOptions): Promise<SendEmailResult> {
    const to = options.to?.trim();
    if (!to || !to.includes('@')) {
      return { sent: false, skippedReason: 'Invalid recipient email' };
    }

    if (!this.isEnabled()) {
      this.logger.debug(`[Email off] Would send to ${to}: ${options.subject}`);
      return { sent: false, skippedReason: 'Email not configured' };
    }

    const html =
      options.html ||
      this.wrapHtmlBody(options.text || options.subject, options.subject);

    if (this.provider === 'resend') {
      return this.sendViaResend(to, options.subject, options.text, html);
    }

    if (this.useGmailApi) {
      return this.sendViaGmailApi(to, options.subject, options.text, html);
    }

    if (this.provider === 'smtp' || this.provider === 'gmail') {
      const smtpResult = await this.sendViaSmtp(
        to,
        options.subject,
        options.text,
        html,
      );
      if (
        !smtpResult.sent &&
        smtpResult.error?.includes('ECONNREFUSED') &&
        this.gmailRefreshToken
      ) {
        this.logger.warn('SMTP blocked — retrying via Gmail API');
        return this.sendViaGmailApi(to, options.subject, options.text, html);
      }
      return smtpResult;
    }

    return { sent: false, skippedReason: 'Email not configured' };
  }

  private async sendViaResend(
    to: string,
    subject: string,
    text: string | undefined,
    html: string,
  ): Promise<SendEmailResult> {
    const payload: Record<string, unknown> = {
      from: `${this.fromName} <${this.fromAddress}>`,
      to: [to],
      subject,
      html,
      text: text || subject,
    };
    if (this.replyTo) {
      payload.reply_to = this.replyTo;
    }

    const attempt = async (): Promise<SendEmailResult> => {
      try {
        const response = await axios.post(
          'https://api.resend.com/emails',
          payload,
          {
            headers: {
              Authorization: `Bearer ${this.resendApiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 20_000,
          },
        );

        const messageId = response.data?.id as string | undefined;
        this.logger.log(`Email sent via Resend to ${to} (${messageId || 'ok'})`);
        return { sent: true, messageId };
      } catch (err) {
        const message = this.formatResendError(err);
        return { sent: false, error: message };
      }
    };

    let result = await attempt();
    if (
      !result.sent &&
      result.error &&
      (result.error.includes('timeout') || result.error.includes('5'))
    ) {
      this.logger.warn(`Resend retry for ${to}`);
      result = await attempt();
    }

    if (!result.sent) {
      this.logger.error(`Resend failed for ${to}: ${result.error}`);
    }
    return result;
  }

  private formatResendError(err: unknown): string {
    if (axios.isAxiosError(err)) {
      const data = err.response?.data as
        | { message?: string; name?: string }
        | undefined;
      if (data?.message) return data.message;
      if (typeof err.response?.data === 'string') return err.response.data;
      return err.message;
    }
    return err instanceof Error ? err.message : String(err);
  }

  private async sendViaSmtp(
    to: string,
    subject: string,
    text: string | undefined,
    html: string,
  ): Promise<SendEmailResult> {
    if (!this.transporter) {
      return { sent: false, skippedReason: 'SMTP not configured' };
    }

    const mail = {
      from: `"${this.fromName}" <${this.fromAddress}>`,
      to,
      subject,
      text: text || subject,
      html,
      replyTo: this.replyTo,
    };

    const label = this.provider === 'gmail' ? 'Gmail' : 'SMTP';

    try {
      const info = await this.transporter.sendMail(mail);
      this.logger.log(`Email sent via ${label} to ${to} (${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const refused =
        message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT');

      if (refused && this.fallbackTransporter) {
        try {
          const info = await this.fallbackTransporter.sendMail(mail);
          this.logger.log(
            `Email sent via ${label} (fallback port) to ${to} (${info.messageId})`,
          );
          return { sent: true, messageId: info.messageId };
        } catch (fallbackErr) {
          const fbMsg =
            fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
          this.logger.error(`${label} failed (primary and fallback): ${fbMsg}`);
          return {
            sent: false,
            error: `${message}; fallback: ${fbMsg}`,
          };
        }
      }

      this.logger.error(`${label} failed for ${to}: ${message}`);
      return { sent: false, error: message };
    }
  }

  async sendToMany(
    recipients: string[],
    options: Omit<SendEmailOptions, 'to'>,
  ): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
    const unique = [
      ...new Set(recipients.map((e) => e.trim().toLowerCase())),
    ].filter((e) => e.includes('@'));

    const results: SendEmailResult[] = [];
    let sent = 0;
    let failed = 0;

    for (const to of unique) {
      const result = await this.send({ ...options, to });
      results.push(result);
      if (result.sent) sent++;
      else failed++;
    }

    return { sent, failed, results };
  }

  private buildAuth(): { user: string; pass: string } | undefined {
    const user = this.configService.get<string>('SMTP_USER')?.trim();
    const pass = this.configService
      .get<string>('SMTP_PASS')
      ?.replace(/\s+/g, '');
    if (user && pass) {
      return { user, pass };
    }
    return undefined;
  }

  private wrapHtmlBody(text: string, subject: string): string {
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const cta = this.appPublicUrl
      ? `<p style="margin-top:20px"><a href="${this.appPublicUrl}/dashboard" style="display:inline-block;background:#0f172a;color:#D7FF53;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:700">Open SuperERP</a></p>`
      : '';

    return `<!DOCTYPE html>
<html>
<body style="font-family: system-ui, sans-serif; line-height: 1.5; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <div style="background: #0f172a; color: #D7FF53; padding: 16px 20px; border-radius: 12px 12px 0 0; font-weight: 800;">${this.fromName}</div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
    <h2 style="margin: 0 0 16px; font-size: 18px;">${subject.replace(/</g, '&lt;')}</h2>
    <div>${escaped}</div>
    ${cta}
    <p style="margin-top: 24px; font-size: 12px; color: #94a3b8;">Automated message from your workspace.</p>
  </div>
</body>
</html>`;
  }
}
