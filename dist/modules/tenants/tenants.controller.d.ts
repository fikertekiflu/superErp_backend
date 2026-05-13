import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(createTenantDto: CreateTenantDto, req: any): Promise<import("./tenant.entity").Tenant>;
    findAll(req: any): Promise<import("./tenant.entity").Tenant[]>;
    findMyTenant(req: any): Promise<import("./tenant.entity").Tenant | null>;
    onboard(setupData: any, req: any): Promise<import("./tenant.entity").Tenant>;
    findMe(req: any): Promise<import("./tenant.entity").Tenant | null>;
    updateMe(updateData: any, req: any): Promise<import("./tenant.entity").Tenant>;
    submitDocuments(body: {
        documents: Array<{
            name: string;
            fileUrl: string;
            type: string;
        }>;
    }, req: any): Promise<import("./tenant.entity").Tenant>;
    findPending(req: any): Promise<import("./tenant.entity").Tenant[]>;
    approveTenant(id: string, req: any): Promise<import("./tenant.entity").Tenant>;
    rejectTenant(id: string, req: any, body: {
        reason: string;
    }): Promise<import("./tenant.entity").Tenant>;
}
