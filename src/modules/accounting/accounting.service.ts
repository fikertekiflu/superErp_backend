import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Account, AccountType } from './entities/account.entity';
import { JournalEntry, JournalEntryStatus } from './entities/journal-entry.entity';
import { JournalLine } from './entities/journal-line.entity';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';

@Injectable()
export class AccountingService {
  constructor(
    @InjectRepository(Account)
    private accountsRepository: Repository<Account>,
    @InjectRepository(JournalEntry)
    private journalEntriesRepository: Repository<JournalEntry>,
    private dataSource: DataSource,
  ) {}

  // Account Management
  async createAccount(tenantId: string, dto: CreateAccountDto): Promise<Account> {
    const existing = await this.accountsRepository.findOne({
      where: { code: dto.code, tenantId },
    });

    if (existing) {
      throw new BadRequestException(`Account code ${dto.code} already exists.`);
    }

    const account = this.accountsRepository.create({
      ...dto,
      tenantId,
    });

    return this.accountsRepository.save(account);
  }

  async getAccounts(tenantId: string): Promise<Account[]> {
    return this.accountsRepository.find({
      where: { tenantId },
      order: { code: 'ASC' },
    });
  }

  async seedDefaultAccounts(tenantId: string): Promise<void> {
    const defaults = [
      { code: '1000', name: 'Cash', type: AccountType.ASSET },
      { code: '1200', name: 'Accounts Receivable', type: AccountType.ASSET },
      { code: '2000', name: 'Accounts Payable', type: AccountType.LIABILITY },
      { code: '3000', name: 'Owner Equity', type: AccountType.EQUITY },
      { code: '4000', name: 'Sales Revenue', type: AccountType.REVENUE },
      { code: '5000', name: 'Cost of Goods Sold', type: AccountType.EXPENSE },
      { code: '6000', name: 'Operating Expenses', type: AccountType.EXPENSE },
    ];

    for (const acc of defaults) {
      const existing = await this.accountsRepository.findOne({
        where: { code: acc.code, tenantId },
      });
      if (!existing) {
        await this.accountsRepository.save(
          this.accountsRepository.create({ ...acc, tenantId })
        );
      }
    }
  }

  // Journal Entries
  async createJournalEntry(tenantId: string, userId: string, dto: CreateJournalEntryDto): Promise<JournalEntry> {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException('A journal entry must have at least two lines.');
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of dto.lines) {
      totalDebit += line.debit;
      totalCredit += line.credit;
      
      if (line.debit > 0 && line.credit > 0) {
        throw new BadRequestException('A single line cannot have both debit and credit amounts.');
      }
    }

    // Floating point comparison safeguard
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new BadRequestException(`Debits (${totalDebit}) and Credits (${totalCredit}) must balance to 0.`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const entry = this.journalEntriesRepository.create({
        tenantId,
        referenceNumber: dto.referenceNumber,
        date: new Date(dto.date),
        description: dto.description,
        status: dto.status || JournalEntryStatus.DRAFT,
        createdById: userId,
      });

      const savedEntry = await queryRunner.manager.save(entry);

      const lines = dto.lines.map((line) => {
        return queryRunner.manager.create(JournalLine, {
          journalEntryId: savedEntry.id,
          accountId: line.accountId,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        });
      });

      await queryRunner.manager.save(lines);
      await queryRunner.commitTransaction();

      return await this.journalEntriesRepository.findOneOrFail({
        where: { id: savedEntry.id },
        relations: ['lines', 'lines.account'],
      });
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getJournalEntries(tenantId: string): Promise<JournalEntry[]> {
    return this.journalEntriesRepository.find({
      where: { tenantId },
      relations: ['lines', 'lines.account'],
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  // Reporting / Ledger
  async getTrialBalance(tenantId: string): Promise<any[]> {
    const entries = await this.getJournalEntries(tenantId);
    // Only include posted entries for official trial balance
    const postedEntries = entries.filter(e => e.status === JournalEntryStatus.POSTED);

    const accountBalances: Record<string, { account: Account, debit: number, credit: number, balance: number }> = {};

    const accounts = await this.getAccounts(tenantId);
    for (const acc of accounts) {
      accountBalances[acc.id] = { account: acc, debit: 0, credit: 0, balance: 0 };
    }

    for (const entry of postedEntries) {
      for (const line of entry.lines) {
        if (!accountBalances[line.accountId]) continue;
        
        accountBalances[line.accountId].debit += Number(line.debit);
        accountBalances[line.accountId].credit += Number(line.credit);
      }
    }

    return Object.values(accountBalances).map(record => {
      let balance = 0;
      // Normal balances
      // Asset & Expense: Debit increases, Credit decreases
      if (record.account.type === AccountType.ASSET || record.account.type === AccountType.EXPENSE) {
        balance = record.debit - record.credit;
      } else {
        // Liability, Equity, Revenue: Credit increases, Debit decreases
        balance = record.credit - record.debit;
      }
      record.balance = balance;
      return record;
    }).filter(record => record.debit > 0 || record.credit > 0);
  }
}
