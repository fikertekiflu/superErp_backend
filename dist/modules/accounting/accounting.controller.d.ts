import { AccountingService } from './accounting.service';
import { CreateAccountDto, CreateJournalEntryDto } from './dto/accounting.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class AccountingController {
    private readonly accountingService;
    private readonly subscriptionsService;
    constructor(accountingService: AccountingService, subscriptionsService: SubscriptionsService);
    private checkAccountingAccess;
    seedAccounts(req: any): Promise<{
        message: string;
    }>;
    createAccount(req: any, dto: CreateAccountDto): Promise<import("./entities/account.entity").Account>;
    getAccounts(req: any): Promise<import("./entities/account.entity").Account[]>;
    createJournalEntry(req: any, dto: CreateJournalEntryDto): Promise<import("./entities/journal-entry.entity").JournalEntry>;
    getJournalEntries(req: any): Promise<import("./entities/journal-entry.entity").JournalEntry[]>;
    getTrialBalance(req: any): Promise<any[]>;
}
