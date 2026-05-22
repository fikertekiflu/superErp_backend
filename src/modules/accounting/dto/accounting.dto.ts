import { IsString, IsNotEmpty, IsEnum, IsOptional, IsBoolean, IsArray, ValidateNested, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountType } from '../entities/account.entity';
import { JournalEntryStatus } from '../entities/journal-entry.entity';

export class CreateAccountDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AccountType)
  type: AccountType;

  @IsString()
  @IsOptional()
  description?: string;
}

export class JournalLineDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsNumber()
  @Min(0)
  debit: number;

  @IsNumber()
  @Min(0)
  credit: number;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateJournalEntryDto {
  @IsString()
  @IsNotEmpty()
  referenceNumber: string;

  @IsString()
  @IsNotEmpty()
  date: string; // ISO date string

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(JournalEntryStatus)
  @IsOptional()
  status?: JournalEntryStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}
