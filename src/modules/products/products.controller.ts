import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ProductImageStorageService } from './product-image-storage.service';
import type { ProductUploadedFile } from './product-image-storage.service';

@Controller('products')
@UseGuards(JwtAuthGuard)
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly imageStorage: ProductImageStorageService,
  ) {}

  private async ensureProductCatalogAccess(tenantId: string) {
    const subscription = await this.subscriptionsService.findTenantSubscription(tenantId);
    if (!subscription?.plan?.modules?.includes('product_catalog')) {
      throw new ForbiddenException(
        'Product Catalog is not enabled on your plan. Contact your administrator.',
      );
    }
  }

  @Get()
  async findAll(@Request() req, @Query('activeOnly') activeOnly?: string) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    return this.productsService.findAll(
      req.user.tenantId,
      activeOnly === 'true',
    );
  }

  @Get(':id/image')
  async streamImage(
    @Param('id') id: string,
    @Request() req,
    @Res() res: Response,
  ) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    const product = await this.productsService.findOne(id, req.user.tenantId);
    if (!product.imagePath) {
      throw new BadRequestException('This product has no image');
    }
    this.imageStorage.stream(product.imagePath, res);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    return this.productsService.findOne(id, req.user.tenantId);
  }

  @Post()
  async create(@Request() req, @Body() data: any) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    return this.productsService.create(req.user.tenantId, data);
  }

  @Post(':id/image')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @Request() req,
    @UploadedFile() file: ProductUploadedFile,
  ) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    if (!file) throw new BadRequestException('Image file is required');

    const product = await this.productsService.findOne(id, req.user.tenantId);
    if (product.imagePath) {
      this.imageStorage.remove(product.imagePath);
    }

    const imagePath = this.imageStorage.save(
      req.user.tenantId,
      id,
      file,
    );
    return this.productsService.setImagePath(id, req.user.tenantId, imagePath);
  }

  @Delete(':id/image')
  async removeImage(@Param('id') id: string, @Request() req) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    const product = await this.productsService.findOne(id, req.user.tenantId);
    this.imageStorage.remove(product.imagePath);
    return this.productsService.clearImagePath(id, req.user.tenantId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Request() req, @Body() data: any) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    return this.productsService.update(id, req.user.tenantId, data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    await this.ensureProductCatalogAccess(req.user.tenantId);
    const product = await this.productsService.findOne(id, req.user.tenantId);
    this.imageStorage.remove(product.imagePath);
    await this.productsService.remove(id, req.user.tenantId);
    return { success: true };
  }
}
