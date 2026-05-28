"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductImageStorageService = void 0;
const common_1 = require("@nestjs/common");
const fs_1 = require("fs");
const path_1 = require("path");
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;
let ProductImageStorageService = class ProductImageStorageService {
    uploadRoot = (0, path_1.join)(process.cwd(), 'uploads', 'products');
    save(tenantId, productId, file) {
        if (!ALLOWED_MIME.has(file.mimetype)) {
            throw new common_1.BadRequestException('Image must be JPEG, PNG, WebP, or GIF');
        }
        if (file.buffer.length > MAX_BYTES) {
            throw new common_1.BadRequestException('Image must be 5MB or smaller');
        }
        const ext = (0, path_1.extname)(file.originalname) || '.jpg';
        const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase())
            ? ext.toLowerCase()
            : '.jpg';
        const dir = (0, path_1.join)(this.uploadRoot, tenantId);
        (0, fs_1.mkdirSync)(dir, { recursive: true });
        const filename = `${productId}${safeExt}`;
        const relativePath = (0, path_1.join)('products', tenantId, filename);
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', relativePath);
        (0, fs_1.writeFileSync)(absolutePath, file.buffer);
        return relativePath.replace(/\\/g, '/');
    }
    remove(imagePath) {
        if (!imagePath)
            return;
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', imagePath);
        if ((0, fs_1.existsSync)(absolutePath)) {
            (0, fs_1.unlinkSync)(absolutePath);
        }
    }
    stream(imagePath, res) {
        const absolutePath = (0, path_1.join)(process.cwd(), 'uploads', imagePath);
        if (!(0, fs_1.existsSync)(absolutePath)) {
            throw new common_1.NotFoundException('Product image not found');
        }
        const ext = (0, path_1.extname)(absolutePath).toLowerCase();
        const mime = ext === '.png'
            ? 'image/png'
            : ext === '.webp'
                ? 'image/webp'
                : ext === '.gif'
                    ? 'image/gif'
                    : 'image/jpeg';
        res.setHeader('Content-Type', mime);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        (0, fs_1.createReadStream)(absolutePath).pipe(res);
    }
};
exports.ProductImageStorageService = ProductImageStorageService;
exports.ProductImageStorageService = ProductImageStorageService = __decorate([
    (0, common_1.Injectable)()
], ProductImageStorageService);
//# sourceMappingURL=product-image-storage.service.js.map