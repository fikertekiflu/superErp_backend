import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublishedWorkflowTemplate } from './published-workflow-template.entity';
import { WorkflowCatalogService } from './workflow-catalog.service';
import {
  WorkflowCatalogController,
  AdminWorkflowCatalogController,
} from './workflow-catalog.controller';
import { Tenant } from '../tenants/tenant.entity';
import { PlatformCatalogController } from './platform-catalog.controller';
import { PlatformCatalogService } from './platform-catalog.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PublishedWorkflowTemplate, Tenant]),
  ],
  controllers: [
    WorkflowCatalogController,
    AdminWorkflowCatalogController,
    PlatformCatalogController,
  ],
  providers: [WorkflowCatalogService, PlatformCatalogService],
  exports: [WorkflowCatalogService, PlatformCatalogService],
})
export class WorkflowCatalogModule {}
