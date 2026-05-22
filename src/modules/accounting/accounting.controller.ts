import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Post as HttpPost,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@ApiTags('accounting')
@Controller('accounting')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(
    private readonly accountingService: AccountingService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  // Gating middleware simulation: Ensure tenant has access to accounting module
  private async checkAccountingAccess(tenantId: string) {
    const subscription = await this.subscriptionsService.findTenantSubscription(tenantId);
    if (!subscription || !subscription.plan || !subscription.plan.modules.includes('accounting')) {
      throw new Error('Accounting module is not available on your current plan. Please upgrade to Enterprise.');
    }
  }

  @Post('accounts/seed')
  @ApiOperation({ summary: 'Seed default chart of accounts' })
  async seedAccounts(@Request() req) {
    const tenantId = req.user.tenantId;
    await this.checkAccountingAccess(tenantId);
    await this.accountingService.seedDefaultAccounts(tenantId);
    return { message: 'Default accounts seeded successfully' };
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create a new ledger account' })
  async createAccount(@Request() req, @Body() dto: CreateAccountDto) {
    const tenantId = req.user.tenantId;
    await this.checkAccountingAccess(tenantId);
    return this.accountingService.createAccount(tenantId, dto);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'Get chart of accounts' })
  async getAccounts(@Request() req) {
    const tenantId = req.user.tenantId;
    await this.checkAccountingAccess(tenantId);
    return this.accountingService.getAccounts(tenantId);
  }

  @Post('journal')
  @ApiOperation({ summary: 'Create a journal entry' })
  async createJournalEntry(@Request() req, @Body() dto: CreateJournalEntryDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    await this.checkAccountingAccess(tenantId);
    return this.accountingService.createJournalEntry(tenantId, userId, dto);
  }

  @Get('journal')
  @ApiOperation({ summary: 'Get all journal entries' })
  async getJournalEntries(@Request() req) {
    const tenantId = req.user.tenantId;
    await this.checkAccountingAccess(tenantId);
    return this.accountingService.getJournalEntries(tenantId);
  }

  @Get('reports/trial-balance')
  @ApiOperation({ summary: 'Get trial balance report' })
  async getTrialBalance(@Request() req) {
    const tenantId = req.user.tenantId;
    await this.checkAccountingAccess(tenantId);
    return this.accountingService.getTrialBalance(tenantId);
  }
}
