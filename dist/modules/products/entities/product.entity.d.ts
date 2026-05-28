import { Tenant } from '../../tenants/tenant.entity';
export declare class Product {
    id: string;
    tenantId: string;
    tenant: Tenant;
    name: string;
    sku: string;
    description: string;
    category: string;
    barcode: string;
    unit: string;
    currency: string;
    unitPrice: number;
    taxRate: number;
    stockQuantity: number;
    imagePath: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
