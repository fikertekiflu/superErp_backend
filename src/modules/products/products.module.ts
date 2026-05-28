import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { ProductImageStorageService } from './product-image-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), SubscriptionsModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductImageStorageService],
  exports: [ProductsService],
})
export class ProductsModule {}
