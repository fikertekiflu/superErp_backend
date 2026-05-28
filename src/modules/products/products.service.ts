import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  findAll(tenantId: string, activeOnly = false): Promise<Product[]> {
    const where: { tenantId: string; isActive?: boolean } = { tenantId };
    if (activeOnly) where.isActive = true;
    return this.productRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id, tenantId } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  create(tenantId: string, data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create({ ...data, tenantId });
    return this.productRepository.save(product);
  }

  async update(id: string, tenantId: string, data: Partial<Product>): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const product = await this.findOne(id, tenantId);
    await this.productRepository.remove(product);
  }

  async setImagePath(id: string, tenantId: string, imagePath: string): Promise<Product> {
    const product = await this.findOne(id, tenantId);
    product.imagePath = imagePath;
    return this.productRepository.save(product);
  }

  async clearImagePath(id: string, tenantId: string): Promise<Product> {
    await this.productRepository.update({ id, tenantId }, { imagePath: null as unknown as string });
    return this.findOne(id, tenantId);
  }
}
