import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HrmService } from './hrm.service';
import { HrmController } from './hrm.controller';
import { Employee } from './entities/employee.entity';
import { Department } from './entities/department.entity';
import { Position } from './entities/position.entity';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Employee, Department, Position]),
    WorkflowsModule,
  ],
  controllers: [HrmController],
  providers: [HrmService],
  exports: [HrmService],
})
export class HrmModule {}
