import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  const host = configService.get('DB_HOST') || 'localhost';
  const port = parseInt(configService.get('DB_PORT') || '5433') || 5433;
  const username = configService.get('DB_USERNAME') || 'postgres';
  const password = configService.get('DB_PASSWORD') || '1234';
  const database = configService.get('DB_DATABASE') || 'super_erp';

  return {
    type: 'postgres',
    host,
    port,
    username,
    password,
    database,
    entities: [__dirname + '/../modules/**/*.entity{.ts,.js}'],
    synchronize: configService.get('NODE_ENV') === 'development',
    logging: configService.get('NODE_ENV') === 'development',
    migrations: ['src/database/migrations/*.ts'],
    migrationsRun: true,
  };
};
