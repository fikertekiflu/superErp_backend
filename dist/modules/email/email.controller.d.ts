import { EmailService } from './email.service';
export declare class EmailController {
    private readonly emailService;
    constructor(emailService: EmailService);
    getStatus(): import("./email.service").EmailPublicStatus;
    sendTest(req: any, body: {
        to?: string;
    }): Promise<{
        ok: boolean;
        message: string;
        to?: undefined;
        messageId?: undefined;
        error?: undefined;
        skippedReason?: undefined;
        provider?: undefined;
        hint?: undefined;
    } | {
        ok: boolean;
        to: any;
        messageId: string | undefined;
        error: string | undefined;
        skippedReason: string | undefined;
        provider: "none" | ("gmail" | "smtp" | "resend");
        hint: string;
        message?: undefined;
    }>;
}
