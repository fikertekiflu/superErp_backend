import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EntitiesController } from './entities.controller';
import { EntitiesService } from './entities.service';
import { Entity } from './entity.entity';
import { EntityData } from './entity-data.entity';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Entity, EntityData]),
    SubscriptionsModule,
    AuditLogsModule,
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [EntitiesController],
  providers: [EntitiesService],
  exports: [EntitiesService],
})
export class EntitiesModule {}
