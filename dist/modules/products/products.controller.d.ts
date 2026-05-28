import type { Response } from 'express';
import { ProductsService } from './products.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { ProductImageStorageService } from './product-image-storage.service';
import type { ProductUploadedFile } from './product-image-storage.service';
export declare class ProductsController {
    private readonly productsService;
    private readonly subscriptionsService;
    private readonly imageStorage;
    constructor(productsService: ProductsService, subscriptionsService: SubscriptionsService, imageStorage: ProductImageStorageService);
    private ensureProductCatalogAccess;
    findAll(req: any, activeOnly?: string): Promise<import("./entities/product.entity").Product[]>;
    streamImage(id: string, req: any, res: Response): Promise<void>;
    findOne(id: string, req: any): Promise<import("./entities/product.entity").Product>;
    create(req: any, data: any): Promise<import("./entities/product.entity").Product>;
    uploadImage(id: string, req: any, file: ProductUploadedFile): Promise<import("./entities/product.entity").Product>;
    removeImage(id: string, req: any): Promise<import("./entities/product.entity").Product>;
    update(id: string, req: any, data: any): Promise<import("./entities/product.entity").Product>;
    remove(id: string, req: any): Promise<{
        success: boolean;
    }>;
}
