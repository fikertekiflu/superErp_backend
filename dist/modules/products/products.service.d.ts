import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
export declare class ProductsService {
    private productRepository;
    constructor(productRepository: Repository<Product>);
    findAll(tenantId: string, activeOnly?: boolean): Promise<Product[]>;
    findOne(id: string, tenantId: string): Promise<Product>;
    create(tenantId: string, data: Partial<Product>): Promise<Product>;
    update(id: string, tenantId: string, data: Partial<Product>): Promise<Product>;
    remove(id: string, tenantId: string): Promise<void>;
    setImagePath(id: string, tenantId: string, imagePath: string): Promise<Product>;
    clearImagePath(id: string, tenantId: string): Promise<Product>;
}
