import { Invoice } from './invoice.entity';
export declare class InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    invoiceId: string;
    invoice: Invoice;
}
