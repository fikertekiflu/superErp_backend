import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseTestService } from './database-test.service';
import { AuthModule } from './modules/auth/auth.module';
import { User } from './modules/users/user.entity';
import { Tenant } from './modules/tenants/tenant.entity';
import { Role } from './modules/roles/role.entity';
import { TenantsModule } from './modules/tenants/tenants.module';
import { EntitiesModule } from './modules/entities/entities.module';
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { HrmModule } from './modules/hrm/hrm.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { ProductsModule } from './modules/products/products.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { AccountingModule } from './modules/accounting/accounting.module';
import { CommonModule } from './common/common.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { WorkflowCatalogModule } from './modules/workflow-catalog/workflow-catalog.module';
import { EmailModule } from './modules/email/email.module';

@Module({
  imports: [
    CommonModule,
    EmailModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Tenant, Role]),
    AuthModule,
    TenantsModule,
    EntitiesModule,
    WorkflowsModule,
    SubscriptionsModule,
    HrmModule,
    InvoicesModule,
    ProductsModule,
    TasksModule,
    NotificationsModule,
    AttendanceModule,
    AccountingModule,
    AuditLogsModule,
    WorkflowCatalogModule,
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseTestService],
})
export class AppModule {}
