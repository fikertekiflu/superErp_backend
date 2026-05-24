"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const nodemailer = __importStar(require("nodemailer"));
const resend_password_reset_service_1 = require("./resend-password-reset.service");
let EmailService = EmailService_1 = class EmailService {
    configService;
    resendPasswordReset;
    logger = new common_1.Logger(EmailService_1.name);
    transporter = null;
    fallbackTransporter = null;
    provider;
    isGmail;
    useGmailApi;
    gmailClientId;
    gmailClientSecret;
    gmailRefreshToken;
    enabled;
    fromAddress;
    fromName;
    replyTo;
    appPublicUrl;
    smtpHost;
    smtpPort;
    smtpSecure;
    resendApiKey;
    nodeEnv;
    verificationMessage;
    verified = false;
    warnings = [];
    workflowEmailSuspended;
    authEmailEnabled;
    constructor(configService, resendPasswordReset) {
        this.configService = configService;
        this.resendPasswordReset = resendPasswordReset;
        this.workflowEmailSuspended =
            this.configService.get('EMAIL_DISABLED', 'false') === 'true';
        this.authEmailEnabled =
            this.configService.get('AUTH_EMAIL_ENABLED', 'false') === 'true';
        if (this.workflowEmailSuspended && !this.authEmailEnabled) {
            this.nodeEnv =
                this.configService.get('NODE_ENV', 'development') ||
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
            this.warnings.push('Email is suspended (EMAIL_DISABLED=true). In-app notifications still work.');
            this.logger.log('Email suspended via EMAIL_DISABLED=true');
            return;
        }
        if (this.workflowEmailSuspended && this.authEmailEnabled) {
            this.warnings.push('Workflow emails suspended; auth emails (password reset) are enabled via AUTH_EMAIL_ENABLED=true.');
        }
        this.nodeEnv =
            this.configService.get('NODE_ENV', 'development') || 'development';
        const explicitProvider = this.configService
            .get('EMAIL_PROVIDER')
            ?.trim()
            .toLowerCase();
        const resendKey = this.configService.get('RESEND_API_KEY')?.trim();
        const smtpOn = this.configService.get('SMTP_ENABLED', 'false') === 'true';
        const smtpUser = this.configService.get('SMTP_USER')?.trim();
        const smtpPass = this.configService
            .get('SMTP_PASS')
            ?.replace(/\s+/g, '');
        const gmailClientId = this.configService.get('GMAIL_CLIENT_ID')?.trim();
        const gmailClientSecret = this.configService
            .get('GMAIL_CLIENT_SECRET')
            ?.trim();
        const gmailRefreshToken = this.configService
            .get('GMAIL_REFRESH_TOKEN')
            ?.trim();
        const gmailApiReady = Boolean(gmailClientId && gmailClientSecret && gmailRefreshToken);
        const isGmailAddress = Boolean(smtpUser?.toLowerCase().endsWith('@gmail.com'));
        const wantsGmail = explicitProvider === 'gmail' ||
            explicitProvider === 'google' ||
            explicitProvider === 'gmail_api' ||
            (explicitProvider === 'smtp' &&
                ((this.configService.get('SMTP_HOST') || '').includes('gmail') ||
                    isGmailAddress));
        this.gmailClientId = gmailClientId;
        this.gmailClientSecret = gmailClientSecret;
        this.gmailRefreshToken = gmailRefreshToken;
        if (explicitProvider === 'resend' ||
            (!explicitProvider && resendKey && !smtpOn && !smtpUser)) {
            this.provider = 'resend';
            this.isGmail = false;
            this.useGmailApi = false;
            this.enabled = Boolean(resendKey);
            this.resendApiKey = resendKey;
        }
        else if (wantsGmail) {
            this.provider = 'gmail';
            this.isGmail = true;
            this.useGmailApi =
                gmailApiReady &&
                    (explicitProvider === 'gmail_api' ||
                        explicitProvider === 'gmail' ||
                        wantsGmail);
            this.enabled = this.useGmailApi || Boolean(smtpUser && smtpPass);
            this.resendApiKey = undefined;
        }
        else if (explicitProvider === 'smtp' ||
            smtpOn ||
            (smtpUser && smtpPass && explicitProvider !== 'resend')) {
            this.provider = isGmailAddress ? 'gmail' : 'smtp';
            this.isGmail = isGmailAddress;
            this.useGmailApi = false;
            this.enabled = smtpOn || Boolean(smtpUser && smtpPass);
            this.resendApiKey = undefined;
        }
        else {
            this.provider = 'none';
            this.isGmail = false;
            this.useGmailApi = false;
            this.enabled = false;
            this.resendApiKey = undefined;
        }
        this.fromAddress =
            this.configService.get('SMTP_FROM')?.trim() ||
                this.configService.get('RESEND_FROM')?.trim() ||
                smtpUser ||
                'onboarding@resend.dev';
        this.fromName =
            this.configService.get('SMTP_FROM_NAME')?.trim() || 'SuperERP';
        this.replyTo = this.configService.get('EMAIL_REPLY_TO')?.trim();
        this.appPublicUrl = this.configService
            .get('APP_PUBLIC_URL')
            ?.trim()
            ?.replace(/\/$/, '');
        if (this.isGmail) {
            this.smtpHost = 'smtp.gmail.com';
            this.smtpPort = parseInt(this.configService.get('SMTP_PORT', '587'), 10);
            let secure = this.configService.get('SMTP_SECURE', 'false') === 'true';
            if (this.smtpPort === 465 && !secure) {
                secure = true;
                this.warnings.push('SMTP_PORT=465 requires SMTP_SECURE=true — auto-corrected. Or use SMTP_PORT=587 with SMTP_SECURE=false.');
            }
            if (this.smtpPort === 587 && secure) {
                this.warnings.push('SMTP_PORT=587 usually uses SMTP_SECURE=false (STARTTLS).');
            }
            this.smtpSecure = secure;
        }
        else {
            this.smtpHost = this.configService.get('SMTP_HOST', 'localhost');
            this.smtpPort = parseInt(this.configService.get('SMTP_PORT', '587'), 10);
            this.smtpSecure =
                this.configService.get('SMTP_SECURE', 'false') === 'true';
        }
        if (this.provider === 'resend') {
            if (this.enabled) {
                this.logger.log(`Email: Resend API (from ${this.fromAddress}) — HTTPS, suitable for production`);
                if (this.fromAddress.includes('resend.dev')) {
                    this.warnings.push('Using Resend sandbox sender (onboarding@resend.dev). For production, verify a domain at resend.com and set RESEND_FROM=notifications@yourdomain.com');
                }
            }
            else {
                this.logger.warn('EMAIL_PROVIDER=resend but RESEND_API_KEY is missing');
            }
            return;
        }
        if ((this.provider === 'smtp' || this.provider === 'gmail') && this.enabled) {
            if (this.useGmailApi) {
                this.logger.log(`Email: Gmail API (HTTPS) as ${smtpUser} — works when SMTP ports are blocked`);
                return;
            }
            const auth = this.buildAuth();
            if (!auth) {
                this.logger.error('Gmail/SMTP enabled but SMTP_USER/SMTP_PASS missing — emails will not send. Or set GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN for Gmail API.');
                return;
            }
            if (this.isGmail) {
                this.transporter = this.createSmtpTransporter(auth, this.smtpPort, this.smtpSecure);
                const altPort = this.smtpPort === 587 ? 465 : 587;
                const altSecure = altPort === 465;
                this.fallbackTransporter = this.createSmtpTransporter(auth, altPort, altSecure);
                this.logger.log(`Email: Gmail (${smtpUser}) via smtp.gmail.com:${this.smtpPort}` +
                    ` (fallback port ${altPort} if blocked)`);
                this.warnings.push('Use a Google App Password (16 chars, no spaces), not your normal Gmail password. Enable 2-Step Verification first: myaccount.google.com/apppasswords');
            }
            else {
                this.transporter = this.createSmtpTransporter(auth, this.smtpPort, this.smtpSecure);
                this.logger.log(`Email: SMTP (${this.smtpHost}:${this.smtpPort}, secure=${this.smtpSecure})`);
            }
            return;
        }
        this.logger.warn('Email disabled. For Gmail: EMAIL_PROVIDER=gmail, SMTP_USER, SMTP_PASS (app password)');
    }
    createSmtpTransporter(auth, port, secure) {
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
    async onModuleInit() {
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
            }
            catch (err) {
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
                    }
                    catch {
                    }
                }
                if (this.isGmail && this.gmailRefreshToken) {
                    this.warnings.push('SMTP ports blocked on this network. Add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN to use Gmail over HTTPS (see .env.example).');
                }
                this.logger.error(`SMTP connection failed (${this.smtpHost}:${this.smtpPort}): ${message}. ` +
                    (this.isGmail
                        ? 'ECONNREFUSED = your network blocks Gmail SMTP. Use Gmail API (HTTPS) or EMAIL_PROVIDER=resend.'
                        : 'Consider EMAIL_PROVIDER=resend if SMTP ports are blocked.'));
            }
        }
    }
    async getGmailAccessToken() {
        if (!this.gmailClientId ||
            !this.gmailClientSecret ||
            !this.gmailRefreshToken) {
            throw new Error('Gmail API credentials incomplete');
        }
        const response = await axios_1.default.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            client_id: this.gmailClientId,
            client_secret: this.gmailClientSecret,
            refresh_token: this.gmailRefreshToken,
            grant_type: 'refresh_token',
        }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const token = response.data?.access_token;
        if (!token)
            throw new Error('No access_token from Google');
        return token;
    }
    async verifyGmailApi() {
        try {
            await this.getGmailAccessToken();
            this.verified = true;
            this.verificationMessage = 'Gmail API (HTTPS) ready — SMTP not required';
            this.logger.log('Gmail API credentials verified');
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            this.verified = false;
            this.verificationMessage = message;
            this.logger.error(`Gmail API verification failed: ${message}`);
        }
    }
    buildRawEmailMessage(to, subject, text, html) {
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
    async sendViaGmailApi(to, subject, text, html) {
        try {
            const accessToken = await this.getGmailAccessToken();
            const raw = this.buildRawEmailMessage(to, subject, text || subject, html);
            const response = await axios_1.default.post('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', { raw }, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                timeout: 25_000,
            });
            const messageId = response.data?.id;
            this.logger.log(`Email sent via Gmail API to ${to} (${messageId || 'ok'})`);
            return { sent: true, messageId };
        }
        catch (err) {
            const message = axios_1.default.isAxiosError(err)
                ? JSON.stringify(err.response?.data) || err.message
                : err instanceof Error
                    ? err.message
                    : String(err);
            this.logger.error(`Gmail API failed for ${to}: ${message}`);
            return { sent: false, error: message };
        }
    }
    async verifyResend() {
        try {
            await axios_1.default.get('https://api.resend.com/domains', {
                headers: { Authorization: `Bearer ${this.resendApiKey}` },
                timeout: 10_000,
            });
            this.verified = true;
            this.verificationMessage = 'Resend API key valid';
            this.logger.log('Resend API key verified');
        }
        catch (err) {
            const message = axios_1.default.isAxiosError(err)
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
    isEnabled() {
        if (this.workflowEmailSuspended)
            return false;
        return this.isTransportReady();
    }
    isAuthEmailEnabled() {
        if (this.workflowEmailSuspended && !this.authEmailEnabled)
            return false;
        return this.isTransportReady();
    }
    isTransportReady() {
        if (!this.enabled)
            return false;
        if (this.provider === 'resend')
            return Boolean(this.resendApiKey);
        if (this.useGmailApi)
            return true;
        if (this.provider === 'smtp' || this.provider === 'gmail') {
            return this.transporter !== null;
        }
        return false;
    }
    getProvider() {
        return this.provider;
    }
    getPublicStatus() {
        const smtpBlocked = Boolean(this.verificationMessage?.includes('ECONNREFUSED'));
        const deliveryMethod = this.provider === 'resend'
            ? 'resend'
            : this.useGmailApi
                ? 'gmail_api'
                : this.isGmail
                    ? 'gmail_smtp'
                    : this.provider === 'smtp'
                        ? 'smtp'
                        : undefined;
        const productionReady = this.isAuthEmailEnabled() &&
            this.verified &&
            (this.provider === 'resend'
                ? !this.fromAddress.includes('resend.dev')
                : true);
        if (!this.isAuthEmailEnabled() &&
            this.warnings.some((w) => w.includes('suspended'))) {
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
                setupHint: 'Email is turned off for now. Workflows and Tasks still work with in-app notifications. Set EMAIL_DISABLED=false when ready to configure Gmail or Resend.',
                warnings: this.warnings,
            };
        }
        let setupHint = 'Gmail: set EMAIL_PROVIDER=gmail, SMTP_USER=you@gmail.com, SMTP_PASS=16-char app password, restart server.';
        if (smtpBlocked && this.isGmail && !this.useGmailApi) {
            setupHint =
                'Your network blocks Gmail SMTP (ECONNREFUSED). Fix: add GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN for Gmail API (HTTPS), OR use EMAIL_PROVIDER=resend, OR run the backend on a cloud server.';
        }
        else if (this.provider === 'resend') {
            setupHint =
                'Set EMAIL_PROVIDER=resend, RESEND_API_KEY, and RESEND_FROM=you@your-verified-domain.com in .env, then restart the server.';
        }
        else if (this.provider === 'smtp' && !this.isGmail) {
            setupHint =
                'For Gmail use EMAIL_PROVIDER=gmail (not smtp). Or set SMTP_HOST=smtp.gmail.com with app password.';
        }
        else if (this.isEnabled() && this.fromAddress.includes('resend.dev')) {
            setupHint =
                'Resend works in test mode. For production: verify your domain at resend.com, then set RESEND_FROM=notifications@yourdomain.com';
        }
        else if (this.isEnabled() && this.verified) {
            setupHint = 'Email is configured. Use POST /email/test to send a test message.';
        }
        const authOnly = this.workflowEmailSuspended &&
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
    async sendPasswordResetEmail(to, resetUrl, context = {}) {
        return this.resendPasswordReset.sendPasswordResetEmail(to, resetUrl, context);
    }
    async sendTransactional(to, subject, text, html) {
        if (this.provider === 'resend') {
            return this.sendViaResend(to, subject, text, html);
        }
        if (this.useGmailApi) {
            return this.sendViaGmailApi(to, subject, text, html);
        }
        if (this.provider === 'smtp' || this.provider === 'gmail') {
            const smtpResult = await this.sendViaSmtp(to, subject, text, html);
            if (!smtpResult.sent &&
                smtpResult.error?.includes('ECONNREFUSED') &&
                this.gmailRefreshToken) {
                this.logger.warn('SMTP blocked — retrying password reset via Gmail API');
                return this.sendViaGmailApi(to, subject, text, html);
            }
            return smtpResult;
        }
        return { sent: false, skippedReason: 'Email transport not available' };
    }
    async sendTestEmail(to) {
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
    async send(options) {
        const to = options.to?.trim();
        if (!to || !to.includes('@')) {
            return { sent: false, skippedReason: 'Invalid recipient email' };
        }
        if (!this.isEnabled()) {
            this.logger.debug(`[Email off] Would send to ${to}: ${options.subject}`);
            return { sent: false, skippedReason: 'Email not configured' };
        }
        const html = options.html ||
            this.wrapHtmlBody(options.text || options.subject, options.subject);
        if (this.provider === 'resend') {
            return this.sendViaResend(to, options.subject, options.text, html);
        }
        if (this.useGmailApi) {
            return this.sendViaGmailApi(to, options.subject, options.text, html);
        }
        if (this.provider === 'smtp' || this.provider === 'gmail') {
            const smtpResult = await this.sendViaSmtp(to, options.subject, options.text, html);
            if (!smtpResult.sent &&
                smtpResult.error?.includes('ECONNREFUSED') &&
                this.gmailRefreshToken) {
                this.logger.warn('SMTP blocked — retrying via Gmail API');
                return this.sendViaGmailApi(to, options.subject, options.text, html);
            }
            return smtpResult;
        }
        return { sent: false, skippedReason: 'Email not configured' };
    }
    async sendViaResend(to, subject, text, html) {
        const payload = {
            from: `${this.fromName} <${this.fromAddress}>`,
            to: [to],
            subject,
            html,
            text: text || subject,
        };
        if (this.replyTo) {
            payload.reply_to = this.replyTo;
        }
        const attempt = async () => {
            try {
                const response = await axios_1.default.post('https://api.resend.com/emails', payload, {
                    headers: {
                        Authorization: `Bearer ${this.resendApiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 20_000,
                });
                const messageId = response.data?.id;
                this.logger.log(`Email sent via Resend to ${to} (${messageId || 'ok'})`);
                return { sent: true, messageId };
            }
            catch (err) {
                const message = this.formatResendError(err);
                return { sent: false, error: message };
            }
        };
        let result = await attempt();
        if (!result.sent &&
            result.error &&
            (result.error.includes('timeout') || result.error.includes('5'))) {
            this.logger.warn(`Resend retry for ${to}`);
            result = await attempt();
        }
        if (!result.sent) {
            this.logger.error(`Resend failed for ${to}: ${result.error}`);
        }
        return result;
    }
    formatResendError(err) {
        if (axios_1.default.isAxiosError(err)) {
            const data = err.response?.data;
            if (data?.message)
                return data.message;
            if (typeof err.response?.data === 'string')
                return err.response.data;
            return err.message;
        }
        return err instanceof Error ? err.message : String(err);
    }
    async sendViaSmtp(to, subject, text, html) {
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
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            const refused = message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT');
            if (refused && this.fallbackTransporter) {
                try {
                    const info = await this.fallbackTransporter.sendMail(mail);
                    this.logger.log(`Email sent via ${label} (fallback port) to ${to} (${info.messageId})`);
                    return { sent: true, messageId: info.messageId };
                }
                catch (fallbackErr) {
                    const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
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
    async sendToMany(recipients, options) {
        const unique = [
            ...new Set(recipients.map((e) => e.trim().toLowerCase())),
        ].filter((e) => e.includes('@'));
        const results = [];
        let sent = 0;
        let failed = 0;
        for (const to of unique) {
            const result = await this.send({ ...options, to });
            results.push(result);
            if (result.sent)
                sent++;
            else
                failed++;
        }
        return { sent, failed, results };
    }
    buildAuth() {
        const user = this.configService.get('SMTP_USER')?.trim();
        const pass = this.configService
            .get('SMTP_PASS')
            ?.replace(/\s+/g, '');
        if (user && pass) {
            return { user, pass };
        }
        return undefined;
    }
    wrapHtmlBody(text, subject) {
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
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        resend_password_reset_service_1.ResendPasswordResetService])
], EmailService);
//# sourceMappingURL=email.service.js.map