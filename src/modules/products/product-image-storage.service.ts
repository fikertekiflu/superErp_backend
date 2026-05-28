import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { Response } from 'express';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_BYTES = 5 * 1024 * 1024;

export type ProductUploadedFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
};

@Injectable()
export class ProductImageStorageService {
  private readonly uploadRoot = join(process.cwd(), 'uploads', 'products');

  save(tenantId: string, productId: string, file: ProductUploadedFile): string {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Image must be JPEG, PNG, WebP, or GIF');
    }
    if (file.buffer.length > MAX_BYTES) {
      throw new BadRequestException('Image must be 5MB or smaller');
    }

    const ext = extname(file.originalname) || '.jpg';
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(ext.toLowerCase())
      ? ext.toLowerCase()
      : '.jpg';
    const dir = join(this.uploadRoot, tenantId);
    mkdirSync(dir, { recursive: true });

    const filename = `${productId}${safeExt}`;
    const relativePath = join('products', tenantId, filename);
    const absolutePath = join(process.cwd(), 'uploads', relativePath);

    writeFileSync(absolutePath, file.buffer);
    return relativePath.replace(/\\/g, '/');
  }

  remove(imagePath: string | null | undefined) {
    if (!imagePath) return;
    const absolutePath = join(process.cwd(), 'uploads', imagePath);
    if (existsSync(absolutePath)) {
      unlinkSync(absolutePath);
    }
  }

  stream(imagePath: string, res: Response) {
    const absolutePath = join(process.cwd(), 'uploads', imagePath);
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Product image not found');
    }
    const ext = extname(absolutePath).toLowerCase();
    const mime =
      ext === '.png'
        ? 'image/png'
        : ext === '.webp'
          ? 'image/webp'
          : ext === '.gif'
            ? 'image/gif'
            : 'image/jpeg';
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'private, max-age=3600');
    createReadStream(absolutePath).pipe(res);
  }
}
