import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantVerificationStorageService } from './tenant-verification-storage.service';
import { Tenant } from './tenant.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { EntitiesModule } from '../entities/entities.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant]),
    SubscriptionsModule,
    AuditLogsModule,
    EntitiesModule,
    WorkflowsModule,
  ],
  controllers: [TenantsController],
  providers: [TenantsService, TenantVerificationStorageService],
  exports: [TenantsService],
})
export class TenantsModule {}
