import type { Response } from 'express';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import { VerificationUploadedFile } from './verification-document.types';
export declare class TenantsController {
    private readonly tenantsService;
    constructor(tenantsService: TenantsService);
    create(createTenantDto: CreateTenantDto, req: any): Promise<import("./tenant.entity").Tenant>;
    findAll(): Promise<import("./tenant.entity").Tenant[]>;
    findMyTenant(req: any): Promise<import("./tenant.entity").Tenant | null>;
    onboard(setupData: any, req: any): Promise<import("./tenant.entity").Tenant>;
    findMe(req: any): Promise<import("./tenant.entity").Tenant | null>;
    updateMe(dto: UpdateTenantSettingsDto, req: any): Promise<import("./tenant.entity").Tenant>;
    submitVerification(files: Partial<Record<string, VerificationUploadedFile[]>>, body: SubmitVerificationDto, req: any): Promise<import("./tenant.entity").Tenant>;
    getVerificationFile(tenantId: string, documentId: string, req: any, res: Response): Promise<void>;
    submitDocuments(body: {
        documents: Array<{
            name: string;
            fileUrl: string;
            type: string;
        }>;
    }, req: any): Promise<import("./tenant.entity").Tenant>;
    findPending(): Promise<import("./tenant.entity").Tenant[]>;
    approveTenant(id: string, req: any): Promise<import("./tenant.entity").Tenant>;
    rejectTenant(id: string, req: any, body: {
        reason: string;
    }): Promise<import("./tenant.entity").Tenant>;
}
