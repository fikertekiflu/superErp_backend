import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantAdminGuard } from '../auth/guards/tenant-admin.guard';
import { EmailService } from './email.service';

@ApiTags('Email')
@Controller('email')
@UseGuards(JwtAuthGuard, TenantAdminGuard)
@ApiBearerAuth()
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Get('status')
  @ApiOperation({ summary: 'Email provider status (tenant admin)' })
  getStatus() {
    return this.emailService.getPublicStatus();
  }

  @Post('test')
  @ApiOperation({ summary: 'Send a test email (tenant admin)' })
  async sendTest(
    @Request() req,
    @Body() body: { to?: string },
  ) {
    const to = body.to?.trim() || req.user.email;
    if (!to) {
      return {
        ok: false,
        message: 'No recipient — pass { "to": "you@company.com" } or ensure your user has an email',
      };
    }

    const result = await this.emailService.sendTestEmail(to);
    return {
      ok: result.sent,
      to,
      messageId: result.messageId,
      error: result.error,
      skippedReason: result.skippedReason,
      provider: this.emailService.getProvider(),
      hint: result.sent
        ? 'Check inbox and spam. For Resend production, verify your domain and use RESEND_FROM=you@yourdomain.com'
        : this.emailService.getPublicStatus().setupHint,
    };
  }
}
