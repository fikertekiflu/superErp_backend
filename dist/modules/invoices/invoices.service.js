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
exports.InvoicesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const invoice_entity_1 = require("./entities/invoice.entity");
const invoice_item_entity_1 = require("./entities/invoice-item.entity");
let InvoicesService = class InvoicesService {
    invoiceRepository;
    invoiceItemRepository;
    constructor(invoiceRepository, invoiceItemRepository) {
        this.invoiceRepository = invoiceRepository;
        this.invoiceItemRepository = invoiceItemRepository;
    }
    async findAll(tenantId) {
        return this.invoiceRepository.find({
            where: { tenantId },
            order: { createdAt: 'DESC' },
            relations: ['items'],
        });
    }
    async findOne(id, tenantId) {
        const invoice = await this.invoiceRepository.findOne({
            where: { id, tenantId },
            relations: ['items'],
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        return invoice;
    }
    async create(tenantId, data) {
        const { items, ...invoiceData } = data;
        let subTotal = 0;
        const invoiceItems = items.map(item => {
            const total = Number(item.quantity) * Number(item.unitPrice);
            subTotal += total;
            return this.invoiceItemRepository.create({ ...item, total });
        });
        const vatAmount = subTotal * 0.15;
        const totalAmount = subTotal + vatAmount;
        const invoice = this.invoiceRepository.create({
            ...invoiceData,
            subTotal,
            vatAmount,
            totalAmount,
            tenantId,
            items: invoiceItems,
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        });
        return this.invoiceRepository.save(invoice);
    }
    async updateStatus(id, tenantId, status) {
        const invoice = await this.findOne(id, tenantId);
        invoice.status = status;
        return this.invoiceRepository.save(invoice);
    }
    async remove(id, tenantId) {
        const invoice = await this.findOne(id, tenantId);
        await this.invoiceRepository.remove(invoice);
    }
};
exports.InvoicesService = InvoicesService;
exports.InvoicesService = InvoicesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(invoice_entity_1.Invoice)),
    __param(1, (0, typeorm_1.InjectRepository)(invoice_item_entity_1.InvoiceItem)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], InvoicesService);
//# sourceMappingURL=invoices.service.js.map