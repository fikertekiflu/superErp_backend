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

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseTestService],
})
export class AppModule {}
