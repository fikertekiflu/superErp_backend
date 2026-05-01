import { Tenant } from '../../tenants/tenant.entity';
export declare class Employee {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    position: string;
    department: string;
    tinNumber: string;
    basicSalary: number;
    hireDate: Date;
    status: 'active' | 'on_leave' | 'terminated';
    tenantId: string;
    tenant: Tenant;
    createdAt: Date;
    updatedAt: Date;
}
