import { Response } from 'express';
export type ProductUploadedFile = {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
};
export declare class ProductImageStorageService {
    private readonly uploadRoot;
    save(tenantId: string, productId: string, file: ProductUploadedFile): string;
    remove(imagePath: string | null | undefined): void;
    stream(imagePath: string, res: Response): void;
}
