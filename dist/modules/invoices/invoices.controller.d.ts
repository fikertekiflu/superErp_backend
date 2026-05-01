import { InvoicesService } from './invoices.service';
export declare class InvoicesController {
    private readonly invoicesService;
    constructor(invoicesService: InvoicesService);
    findAll(req: any): Promise<import("./entities/invoice.entity").Invoice[]>;
    findOne(id: string, req: any): Promise<import("./entities/invoice.entity").Invoice>;
    create(req: any, data: any): Promise<import("./entities/invoice.entity").Invoice>;
    updateStatus(id: string, req: any, status: string): Promise<import("./entities/invoice.entity").Invoice>;
    remove(id: string, req: any): Promise<void>;
}
