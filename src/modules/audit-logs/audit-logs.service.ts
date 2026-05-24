import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditAction, AuditLog } from './audit-log.entity';

export interface AuditLogInput {
  tenantId?: string;
  actorId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(input: AuditLogInput): Promise<AuditLog> {
    const entry = this.auditRepository.create(input);
    return this.auditRepository.save(entry);
  }

  async findForTenant(
    tenantId: string,
    options?: { limit?: number; resourceType?: string },
  ): Promise<AuditLog[]> {
    const qb = this.auditRepository
      .createQueryBuilder('log')
      .where('log.tenantId = :tenantId', { tenantId })
      .orderBy('log.createdAt', 'DESC')
      .take(options?.limit ?? 100);

    if (options?.resourceType) {
      qb.andWhere('log.resourceType = :resourceType', {
        resourceType: options.resourceType,
      });
    }

    return qb.getMany();
  }

  async findAllPlatform(limit = 200): Promise<AuditLog[]> {
    return this.auditRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
