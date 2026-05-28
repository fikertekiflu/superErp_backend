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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("./entities/product.entity");
let ProductsService = class ProductsService {
    productRepository;
    constructor(productRepository) {
        this.productRepository = productRepository;
    }
    findAll(tenantId, activeOnly = false) {
        const where = { tenantId };
        if (activeOnly)
            where.isActive = true;
        return this.productRepository.find({
            where,
            order: { name: 'ASC' },
        });
    }
    async findOne(id, tenantId) {
        const product = await this.productRepository.findOne({ where: { id, tenantId } });
        if (!product)
            throw new common_1.NotFoundException('Product not found');
        return product;
    }
    create(tenantId, data) {
        const product = this.productRepository.create({ ...data, tenantId });
        return this.productRepository.save(product);
    }
    async update(id, tenantId, data) {
        const product = await this.findOne(id, tenantId);
        Object.assign(product, data);
        return this.productRepository.save(product);
    }
    async remove(id, tenantId) {
        const product = await this.findOne(id, tenantId);
        await this.productRepository.remove(product);
    }
    async setImagePath(id, tenantId, imagePath) {
        const product = await this.findOne(id, tenantId);
        product.imagePath = imagePath;
        return this.productRepository.save(product);
    }
    async clearImagePath(id, tenantId) {
        await this.productRepository.update({ id, tenantId }, { imagePath: null });
        return this.findOne(id, tenantId);
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map