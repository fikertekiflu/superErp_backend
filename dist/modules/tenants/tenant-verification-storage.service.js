"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TenantVerificationStorageService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const crypto_1 = require("crypto");
const verification_document_types_1 = require("./verification-document.types");
const user_entity_1 = require("../users/user.entity");
const ALLOWED_MIME = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]);
const MAX_BYTES = 10 * 1024 * 1024;
let TenantVerificationStorageService = class TenantVerificationStorageService {
    uploadRoot = (0, path_1.join)(process.cwd(), 'uploads', 'verification');
    ensureUploadDir(tenantId) {
        const dir = (0, path_1.join)(this.uploadRoot, tenantId);
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        return dir;
    }
    validateFile(file, label) {
        if (!file)
            return;
        if (file.size > MAX_BYTES) {
            throw new common_1.BadRequestException(`${label} exceeds maximum size of 10MB`);
        }
        if (!ALLOWED_MIME.has(file.mimetype)) {
            throw new common_1.BadRequestException(`${label} must be PDF, JPG, or PNG (received ${file.mimetype})`);
        }
    }
    saveFile(tenantId, type, file) {
        this.validateFile(file, type);
        const dir = this.ensureUploadDir(tenantId);
        const id = (0, crypto_1.randomUUID)();
        const ext = (0, path_1.extname)(file.originalname) || this.extFromMime(file.mimetype);
        const storedName = `${id}${ext}`;
        const absolutePath = (0, path_1.join)(dir, storedName);
        (0, fs_1.writeFileSync)(absolutePath, file.buffer);
        const meta = verification_document_types_1.VERIFICATION_FILE_FIELDS.find((f) => f.field === type);
        return {
            id,
            type,
            name: meta?.label || type,
            fileName: file.originalname,
            mimeType: file.mimetype,
            storagePath: (0, path_1.join)('verification', tenantId, storedName),
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
        };
    }
    collectUploadedFiles(tenantId, files) {
        const records = [];
        for (const spec of verification_document_types_1.VERIFICATION_FILE_FIELDS) {
            const uploaded = files[spec.field]?.[0];
            if (!uploaded) {
                if (spec.required) {
                    throw new common_1.BadRequestException(`Missing required file: ${spec.label}`);
                }
                continue;
            }
            records.push(this.saveFile(tenantId, spec.field, uploaded));
        }
        if (records.length < 2) {
            throw new common_1.BadRequestException('Upload at least Business License and TIN Certificate');
        }
        return records;
    }
    resolveAbsolutePath(storagePath) {
        return (0, path_1.join)(process.cwd(), 'uploads', storagePath);
    }
    streamDocument(storagePath, mimeType, fileName, res) {
        const absolute = this.resolveAbsolutePath(storagePath);
        if (!(0, fs_1.existsSync)(absolute)) {
            throw new common_1.NotFoundException('File not found on server');
        }
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName.replace(/"/g, '')}"`);
        (0, fs_1.createReadStream)(absolute).pipe(res);
    }
    assertCanAccess(actor, targetTenantId) {
        const role = actor.role?.toLowerCase();
        if (role === user_entity_1.UserRole.SUPER_ADMIN)
            return;
        if (actor.tenantId === targetTenantId)
            return;
        throw new common_1.ForbiddenException('Cannot access this verification file');
    }
    extFromMime(mime) {
        if (mime === 'application/pdf')
            return '.pdf';
        if (mime === 'image/png')
            return '.png';
        if (mime === 'image/webp')
            return '.webp';
        return '.jpg';
    }
};
exports.TenantVerificationStorageService = TenantVerificationStorageService;
exports.TenantVerificationStorageService = TenantVerificationStorageService = __decorate([
    (0, common_1.Injectable)()
], TenantVerificationStorageService);
//# sourceMappingURL=tenant-verification-storage.service.js.map