import { ConfigService } from '@nestjs/config';
import { SendEmailResult } from './email.service';
export interface PasswordResetEmailContext {
    userName?: string;
    companyName?: string;
    expiresMinutes?: number;
}
export declare class ResendPasswordResetService {
    private readonly configService;
    private readonly logger;
    private readonly client;
    private readonly fromAddress;
    private readonly fromName;
    private readonly emailDisabled;
    private readonly nodeEnv;
    private readonly devInbox?;
    constructor(configService: ConfigService);
    sendPasswordResetEmail(to: string, resetUrl: string, context?: PasswordResetEmailContext): Promise<SendEmailResult>;
    private deliver;
    private buildText;
    private buildHtml;
    private escapeHtml;
}
