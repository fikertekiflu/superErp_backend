"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const products_service_1 = require("./products.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const product_image_storage_service_1 = require("./product-image-storage.service");
let ProductsController = class ProductsController {
    productsService;
    subscriptionsService;
    imageStorage;
    constructor(productsService, subscriptionsService, imageStorage) {
        this.productsService = productsService;
        this.subscriptionsService = subscriptionsService;
        this.imageStorage = imageStorage;
    }
    async ensureProductCatalogAccess(tenantId) {
        const subscription = await this.subscriptionsService.findTenantSubscription(tenantId);
        if (!subscription?.plan?.modules?.includes('product_catalog')) {
            throw new common_1.ForbiddenException('Product Catalog is not enabled on your plan. Contact your administrator.');
        }
    }
    async findAll(req, activeOnly) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        return this.productsService.findAll(req.user.tenantId, activeOnly === 'true');
    }
    async streamImage(id, req, res) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        const product = await this.productsService.findOne(id, req.user.tenantId);
        if (!product.imagePath) {
            throw new common_1.BadRequestException('This product has no image');
        }
        this.imageStorage.stream(product.imagePath, res);
    }
    async findOne(id, req) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        return this.productsService.findOne(id, req.user.tenantId);
    }
    async create(req, data) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        return this.productsService.create(req.user.tenantId, data);
    }
    async uploadImage(id, req, file) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        if (!file)
            throw new common_1.BadRequestException('Image file is required');
        const product = await this.productsService.findOne(id, req.user.tenantId);
        if (product.imagePath) {
            this.imageStorage.remove(product.imagePath);
        }
        const imagePath = this.imageStorage.save(req.user.tenantId, id, file);
        return this.productsService.setImagePath(id, req.user.tenantId, imagePath);
    }
    async removeImage(id, req) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        const product = await this.productsService.findOne(id, req.user.tenantId);
        this.imageStorage.remove(product.imagePath);
        return this.productsService.clearImagePath(id, req.user.tenantId);
    }
    async update(id, req, data) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        return this.productsService.update(id, req.user.tenantId, data);
    }
    async remove(id, req) {
        await this.ensureProductCatalogAccess(req.user.tenantId);
        const product = await this.productsService.findOne(id, req.user.tenantId);
        this.imageStorage.remove(product.imagePath);
        await this.productsService.remove(id, req.user.tenantId);
        return { success: true };
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id/image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "streamImage", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Delete)(':id/image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "removeImage", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService,
        subscriptions_service_1.SubscriptionsService,
        product_image_storage_service_1.ProductImageStorageService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map