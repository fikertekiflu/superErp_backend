import { Response } from 'express';
import { VerificationDocumentRecord, VerificationDocumentType, VerificationUploadedFile } from './verification-document.types';
export declare class TenantVerificationStorageService {
    private readonly uploadRoot;
    ensureUploadDir(tenantId: string): string;
    validateFile(file: VerificationUploadedFile | undefined, label: string): void;
    saveFile(tenantId: string, type: VerificationDocumentType, file: VerificationUploadedFile): VerificationDocumentRecord;
    collectUploadedFiles(tenantId: string, files: Partial<Record<VerificationDocumentType, VerificationUploadedFile[]>>): VerificationDocumentRecord[];
    resolveAbsolutePath(storagePath: string): string;
    streamDocument(storagePath: string, mimeType: string, fileName: string, res: Response): void;
    assertCanAccess(actor: {
        userId: string;
        tenantId?: string;
        role?: string;
    }, targetTenantId: string): void;
    private extFromMime;
}
