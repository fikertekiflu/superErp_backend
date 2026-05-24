export interface VerificationUploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    buffer: Buffer;
}
export type VerificationDocumentType = 'business_license' | 'tin_certificate' | 'trade_registration' | 'memorandum_articles' | 'address_proof' | 'other_qualification';
export interface VerificationDocumentRecord {
    id: string;
    type: VerificationDocumentType;
    name: string;
    fileName: string;
    mimeType: string;
    storagePath: string;
    fileSize: number;
    uploadedAt: string;
}
export interface TenantVerificationProfile {
    legalBusinessName?: string;
    tinNumber?: string;
    businessRegistrationNumber?: string;
    businessPhone?: string;
    businessAddress?: string;
    submittedAt?: string;
}
export declare const VERIFICATION_FILE_FIELDS: Array<{
    field: VerificationDocumentType;
    label: string;
    required: boolean;
}>;
