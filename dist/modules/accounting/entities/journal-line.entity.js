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
Object.defineProperty(exports, "__esModule", { value: true });
exports.JournalLine = void 0;
const typeorm_1 = require("typeorm");
const journal_entry_entity_1 = require("./journal-entry.entity");
const account_entity_1 = require("./account.entity");
let JournalLine = class JournalLine {
    id;
    journalEntryId;
    journalEntry;
    accountId;
    account;
    debit;
    credit;
    description;
};
exports.JournalLine = JournalLine;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], JournalLine.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'journal_entry_id' }),
    __metadata("design:type", String)
], JournalLine.prototype, "journalEntryId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => journal_entry_entity_1.JournalEntry, (entry) => entry.lines, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'journal_entry_id' }),
    __metadata("design:type", journal_entry_entity_1.JournalEntry)
], JournalLine.prototype, "journalEntry", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'account_id' }),
    __metadata("design:type", String)
], JournalLine.prototype, "accountId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => account_entity_1.Account, { onDelete: 'RESTRICT' }),
    (0, typeorm_1.JoinColumn)({ name: 'account_id' }),
    __metadata("design:type", account_entity_1.Account)
], JournalLine.prototype, "account", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JournalLine.prototype, "debit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 12, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], JournalLine.prototype, "credit", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], JournalLine.prototype, "description", void 0);
exports.JournalLine = JournalLine = __decorate([
    (0, typeorm_1.Entity)('journal_lines')
], JournalLine);
//# sourceMappingURL=journal-line.entity.js.map