import { Repository, DataSource } from 'typeorm';
import { Account } from './entities/account.entity';
import { JournalEntry } from './entities/journal-entry.entity';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
export declare class AccountingService {
    private accountsRepository;
    private journalEntriesRepository;
    private dataSource;
    constructor(accountsRepository: Repository<Account>, journalEntriesRepository: Repository<JournalEntry>, dataSource: DataSource);
    createAccount(tenantId: string, dto: CreateAccountDto): Promise<Account>;
    getAccounts(tenantId: string): Promise<Account[]>;
    seedDefaultAccounts(tenantId: string): Promise<void>;
    createJournalEntry(tenantId: string, userId: string, dto: CreateJournalEntryDto): Promise<JournalEntry>;
    getJournalEntries(tenantId: string): Promise<JournalEntry[]>;
    getTrialBalance(tenantId: string): Promise<any[]>;
}
