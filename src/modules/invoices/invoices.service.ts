import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(InvoiceItem)
    private invoiceItemRepository: Repository<InvoiceItem>,
  ) {}

  async findAll(tenantId: string): Promise<Invoice[]> {
    return this.invoiceRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });
  }

  async findOne(id: string, tenantId: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id, tenantId },
      relations: ['items'],
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  async create(tenantId: string, data: any): Promise<Invoice> {
    const { items, ...invoiceData } = data;
    
    // Calculate totals
    let subTotal = 0;
    const invoiceItems = items.map(item => {
      const total = Number(item.quantity) * Number(item.unitPrice);
      subTotal += total;
      return this.invoiceItemRepository.create({ ...item, total });
    });

    const vatAmount = subTotal * 0.15; // 15% VAT
    const totalAmount = subTotal + vatAmount;

    const invoice = this.invoiceRepository.create({
      ...invoiceData,
      subTotal,
      vatAmount,
      totalAmount,
      tenantId,
      items: invoiceItems,
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`, // Simple auto-gen
    });

    return this.invoiceRepository.save(invoice) as any;
  }

  async updateStatus(id: string, tenantId: string, status: string): Promise<Invoice> {
    const invoice = await this.findOne(id, tenantId);
    invoice.status = status as any;
    return this.invoiceRepository.save(invoice);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const invoice = await this.findOne(id, tenantId);
    await this.invoiceRepository.remove(invoice);
  }
}
