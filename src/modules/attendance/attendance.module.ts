import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { Attendance } from './entities/attendance.entity';
import { AttendanceLog } from './entities/attendance.entity';
import { AttendancePolicy } from './entities/attendance-policy.entity';
import { AttendanceAdjustment } from './entities/attendance-adjustment.entity';
import { Employee } from '../hrm/entities/employee.entity';
import { Tenant } from '../tenants/tenant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      AttendanceLog,
      AttendancePolicy,
      AttendanceAdjustment,
      Employee,
      Tenant,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
