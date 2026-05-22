import { AccountType } from '../entities/account.entity';
import { JournalEntryStatus } from '../entities/journal-entry.entity';
export declare class CreateAccountDto {
    code: string;
    name: string;
    type: AccountType;
    description?: string;
}
export declare class JournalLineDto {
    accountId: string;
    debit: number;
    credit: number;
    description?: string;
}
export declare class CreateJournalEntryDto {
    referenceNumber: string;
    date: string;
    description: string;
    status?: JournalEntryStatus;
    lines: JournalLineDto[];
}
