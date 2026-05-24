import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import { Response } from 'express';
import {
  VERIFICATION_FILE_FIELDS,
  VerificationDocumentRecord,
  VerificationDocumentType,
  VerificationUploadedFile,
} from './verification-document.types';
import { UserRole } from '../users/user.entity';

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const MAX_BYTES = 10 * 1024 * 1024;

@Injectable()
export class TenantVerificationStorageService {
  private readonly uploadRoot = join(process.cwd(), 'uploads', 'verification');

  ensureUploadDir(tenantId: string): string {
    const dir = join(this.uploadRoot, tenantId);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  validateFile(file: VerificationUploadedFile | undefined, label: string): void {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      throw new BadRequestException(
        `${label} exceeds maximum size of 10MB`,
      );
    }
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException(
        `${label} must be PDF, JPG, or PNG (received ${file.mimetype})`,
      );
    }
  }

  saveFile(
    tenantId: string,
    type: VerificationDocumentType,
    file: VerificationUploadedFile,
  ): VerificationDocumentRecord {
    this.validateFile(file, type);
    const dir = this.ensureUploadDir(tenantId);
    const id = randomUUID();
    const ext = extname(file.originalname) || this.extFromMime(file.mimetype);
    const storedName = `${id}${ext}`;
    const absolutePath = join(dir, storedName);
    writeFileSync(absolutePath, file.buffer);

    const meta = VERIFICATION_FILE_FIELDS.find((f) => f.field === type);

    return {
      id,
      type,
      name: meta?.label || type,
      fileName: file.originalname,
      mimeType: file.mimetype,
      storagePath: join('verification', tenantId, storedName),
      fileSize: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }

  collectUploadedFiles(
    tenantId: string,
    files: Partial<Record<VerificationDocumentType, VerificationUploadedFile[]>>,
  ): VerificationDocumentRecord[] {
    const records: VerificationDocumentRecord[] = [];

    for (const spec of VERIFICATION_FILE_FIELDS) {
      const uploaded = files[spec.field]?.[0];
      if (!uploaded) {
        if (spec.required) {
          throw new BadRequestException(`Missing required file: ${spec.label}`);
        }
        continue;
      }
      records.push(this.saveFile(tenantId, spec.field, uploaded));
    }

    if (records.length < 2) {
      throw new BadRequestException(
        'Upload at least Business License and TIN Certificate',
      );
    }

    return records;
  }

  resolveAbsolutePath(storagePath: string): string {
    return join(process.cwd(), 'uploads', storagePath);
  }

  streamDocument(
    storagePath: string,
    mimeType: string,
    fileName: string,
    res: Response,
  ): void {
    const absolute = this.resolveAbsolutePath(storagePath);
    if (!existsSync(absolute)) {
      throw new NotFoundException('File not found on server');
    }
    res.setHeader('Content-Type', mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${fileName.replace(/"/g, '')}"`,
    );
    createReadStream(absolute).pipe(res);
  }

  assertCanAccess(
    actor: {
      userId: string;
      tenantId?: string;
      role?: string;
    },
    targetTenantId: string,
  ): void {
    const role = actor.role?.toLowerCase();
    if (role === UserRole.SUPER_ADMIN) return;
    if (actor.tenantId === targetTenantId) return;
    throw new ForbiddenException('Cannot access this verification file');
  }

  private extFromMime(mime: string): string {
    if (mime === 'application/pdf') return '.pdf';
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return '.jpg';
  }
}
