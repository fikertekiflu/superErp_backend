import { InvoiceItem } from './invoice-item.entity';
import { Tenant } from '../../tenants/tenant.entity';
export declare class Invoice {
    id: string;
    invoiceNumber: string;
    customerName: string;
    customerEmail: string;
    status: 'draft' | 'sent' | 'paid' | 'overdue';
    dueDate: Date;
    subTotal: number;
    vatAmount: number;
    totalAmount: number;
    tenantId: string;
    tenant: Tenant;
    items: InvoiceItem[];
    createdAt: Date;
    updatedAt: Date;
}
