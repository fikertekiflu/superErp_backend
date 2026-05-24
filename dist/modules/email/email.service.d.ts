import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PasswordResetEmailContext, ResendPasswordResetService } from './resend-password-reset.service';
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
export declare class EmailService implements OnModuleInit {
    private readonly configService;
    private readonly resendPasswordReset;
    private readonly logger;
    private transporter;
    private fallbackTransporter;
    private readonly provider;
    private readonly isGmail;
    private readonly useGmailApi;
    private readonly gmailClientId?;
    private readonly gmailClientSecret?;
    private readonly gmailRefreshToken?;
    private readonly enabled;
    private readonly fromAddress;
    private readonly fromName;
    private readonly replyTo?;
    private readonly appPublicUrl?;
    private readonly smtpHost;
    private readonly smtpPort;
    private readonly smtpSecure;
    private readonly resendApiKey;
    private readonly nodeEnv;
    private verificationMessage?;
    private verified;
    private readonly warnings;
    private readonly workflowEmailSuspended;
    private readonly authEmailEnabled;
    constructor(configService: ConfigService, resendPasswordReset: ResendPasswordResetService);
    private createSmtpTransporter;
    onModuleInit(): Promise<void>;
    private getGmailAccessToken;
    private verifyGmailApi;
    private buildRawEmailMessage;
    private sendViaGmailApi;
    private verifyResend;
    isEnabled(): boolean;
    isAuthEmailEnabled(): boolean;
    private isTransportReady;
    getProvider(): EmailProvider | 'none';
    getPublicStatus(): EmailPublicStatus;
    sendPasswordResetEmail(to: string, resetUrl: string, context?: PasswordResetEmailContext): Promise<SendEmailResult>;
    private sendTransactional;
    sendTestEmail(to: string): Promise<SendEmailResult>;
    send(options: SendEmailOptions): Promise<SendEmailResult>;
    private sendViaResend;
    private formatResendError;
    private sendViaSmtp;
    sendToMany(recipients: string[], options: Omit<SendEmailOptions, 'to'>): Promise<{
        sent: number;
        failed: number;
        results: SendEmailResult[];
    }>;
    private buildAuth;
    private wrapHtmlBody;
}
export {};
