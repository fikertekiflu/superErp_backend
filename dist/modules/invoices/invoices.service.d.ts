import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
export declare class InvoicesService {
    private invoiceRepository;
    private invoiceItemRepository;
    constructor(invoiceRepository: Repository<Invoice>, invoiceItemRepository: Repository<InvoiceItem>);
    findAll(tenantId: string): Promise<Invoice[]>;
    findOne(id: string, tenantId: string): Promise<Invoice>;
    create(tenantId: string, data: any): Promise<Invoice>;
    updateStatus(id: string, tenantId: string, status: string): Promise<Invoice>;
    remove(id: string, tenantId: string): Promise<void>;
}
