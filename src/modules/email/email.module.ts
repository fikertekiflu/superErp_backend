import { Global, Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailController } from './email.controller';
import { ResendPasswordResetService } from './resend-password-reset.service';

@Global()
@Module({
  controllers: [EmailController],
  providers: [EmailService, ResendPasswordResetService],
  exports: [EmailService, ResendPasswordResetService],
})
export class EmailModule {}
