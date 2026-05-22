"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const account_entity_1 = require("./entities/account.entity");
const journal_entry_entity_1 = require("./entities/journal-entry.entity");
const journal_line_entity_1 = require("./entities/journal-line.entity");
let AccountingService = class AccountingService {
    accountsRepository;
    journalEntriesRepository;
    dataSource;
    constructor(accountsRepository, journalEntriesRepository, dataSource) {
        this.accountsRepository = accountsRepository;
        this.journalEntriesRepository = journalEntriesRepository;
        this.dataSource = dataSource;
    }
    async createAccount(tenantId, dto) {
        const existing = await this.accountsRepository.findOne({
            where: { code: dto.code, tenantId },
        });
        if (existing) {
            throw new common_1.BadRequestException(`Account code ${dto.code} already exists.`);
        }
        const account = this.accountsRepository.create({
            ...dto,
            tenantId,
        });
        return this.accountsRepository.save(account);
    }
    async getAccounts(tenantId) {
        return this.accountsRepository.find({
            where: { tenantId },
            order: { code: 'ASC' },
        });
    }
    async seedDefaultAccounts(tenantId) {
        const defaults = [
            { code: '1000', name: 'Cash', type: account_entity_1.AccountType.ASSET },
            { code: '1200', name: 'Accounts Receivable', type: account_entity_1.AccountType.ASSET },
            { code: '2000', name: 'Accounts Payable', type: account_entity_1.AccountType.LIABILITY },
            { code: '3000', name: 'Owner Equity', type: account_entity_1.AccountType.EQUITY },
            { code: '4000', name: 'Sales Revenue', type: account_entity_1.AccountType.REVENUE },
            { code: '5000', name: 'Cost of Goods Sold', type: account_entity_1.AccountType.EXPENSE },
            { code: '6000', name: 'Operating Expenses', type: account_entity_1.AccountType.EXPENSE },
        ];
        for (const acc of defaults) {
            const existing = await this.accountsRepository.findOne({
                where: { code: acc.code, tenantId },
            });
            if (!existing) {
                await this.accountsRepository.save(this.accountsRepository.create({ ...acc, tenantId }));
            }
        }
    }
    async createJournalEntry(tenantId, userId, dto) {
        if (!dto.lines || dto.lines.length < 2) {
            throw new common_1.BadRequestException('A journal entry must have at least two lines.');
        }
        let totalDebit = 0;
        let totalCredit = 0;
        for (const line of dto.lines) {
            totalDebit += line.debit;
            totalCredit += line.credit;
            if (line.debit > 0 && line.credit > 0) {
                throw new common_1.BadRequestException('A single line cannot have both debit and credit amounts.');
            }
        }
        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            throw new common_1.BadRequestException(`Debits (${totalDebit}) and Credits (${totalCredit}) must balance to 0.`);
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
                status: dto.status || journal_entry_entity_1.JournalEntryStatus.DRAFT,
                createdById: userId,
            });
            const savedEntry = await queryRunner.manager.save(entry);
            const lines = dto.lines.map((line) => {
                return queryRunner.manager.create(journal_line_entity_1.JournalLine, {
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
        }
        catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        }
        finally {
            await queryRunner.release();
        }
    }
    async getJournalEntries(tenantId) {
        return this.journalEntriesRepository.find({
            where: { tenantId },
            relations: ['lines', 'lines.account'],
            order: { date: 'DESC', createdAt: 'DESC' },
        });
    }
    async getTrialBalance(tenantId) {
        const entries = await this.getJournalEntries(tenantId);
        const postedEntries = entries.filter(e => e.status === journal_entry_entity_1.JournalEntryStatus.POSTED);
        const accountBalances = {};
        const accounts = await this.getAccounts(tenantId);
        for (const acc of accounts) {
            accountBalances[acc.id] = { account: acc, debit: 0, credit: 0, balance: 0 };
        }
        for (const entry of postedEntries) {
            for (const line of entry.lines) {
                if (!accountBalances[line.accountId])
                    continue;
                accountBalances[line.accountId].debit += Number(line.debit);
                accountBalances[line.accountId].credit += Number(line.credit);
            }
        }
        return Object.values(accountBalances).map(record => {
            let balance = 0;
            if (record.account.type === account_entity_1.AccountType.ASSET || record.account.type === account_entity_1.AccountType.EXPENSE) {
                balance = record.debit - record.credit;
            }
            else {
                balance = record.credit - record.debit;
            }
            record.balance = balance;
            return record;
        }).filter(record => record.debit > 0 || record.credit > 0);
    }
};
exports.AccountingService = AccountingService;
exports.AccountingService = AccountingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(account_entity_1.Account)),
    __param(1, (0, typeorm_1.InjectRepository)(journal_entry_entity_1.JournalEntry)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], AccountingService);
//# sourceMappingURL=accounting.service.js.map