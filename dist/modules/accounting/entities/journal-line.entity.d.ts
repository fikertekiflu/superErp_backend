import { JournalEntry } from './journal-entry.entity';
import { Account } from './account.entity';
export declare class JournalLine {
    id: string;
    journalEntryId: string;
    journalEntry: JournalEntry;
    accountId: string;
    account: Account;
    debit: number;
    credit: number;
    description: string;
}
