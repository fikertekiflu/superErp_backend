/** Multer memory-storage file shape (avoids @types/multer dependency). */
export interface VerificationUploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export type VerificationDocumentType =
  | 'business_license'
  | 'tin_certificate'
  | 'trade_registration'
  | 'memorandum_articles'
  | 'address_proof'
  | 'other_qualification';

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

export const VERIFICATION_FILE_FIELDS: Array<{
  field: VerificationDocumentType;
  label: string;
  required: boolean;
}> = [
  { field: 'business_license', label: 'Business License', required: true },
  { field: 'tin_certificate', label: 'TIN Certificate', required: true },
  { field: 'trade_registration', label: 'Trade Registration', required: false },
  {
    field: 'memorandum_articles',
    label: 'Memorandum / Articles of Association',
    required: false,
  },
  { field: 'address_proof', label: 'Proof of Business Address', required: false },
  {
    field: 'other_qualification',
    label: 'Other Business Qualification',
    required: false,
  },
];
