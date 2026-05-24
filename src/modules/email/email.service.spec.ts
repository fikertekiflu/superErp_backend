import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

describe('EmailService', () => {
  const createService = (env: Record<string, string>) => {
    const config = {
      get: (key: string, defaultValue?: string) =>
        env[key] ?? defaultValue ?? undefined,
    } as ConfigService;
    return new EmailService(config);
  };

  it('skips send when SMTP is disabled', async () => {
    const service = createService({ SMTP_ENABLED: 'false' });
    const result = await service.send({
      to: 'test@example.com',
      subject: 'Hello',
      text: 'Body',
    });
    expect(result.sent).toBe(false);
    expect(result.skippedReason).toBe('Email not configured');
  });

  it('rejects invalid recipient', async () => {
    const service = createService({ SMTP_ENABLED: 'true' });
    const result = await service.send({
      to: 'not-an-email',
      subject: 'Hello',
    });
    expect(result.sent).toBe(false);
    expect(result.skippedReason).toBe('Invalid recipient email');
  });
});
