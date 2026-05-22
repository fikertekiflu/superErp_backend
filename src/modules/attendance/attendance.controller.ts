import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AttendanceService } from './attendance.service';
import { Attendance, AttendanceStatus } from './entities/attendance.entity';
import { AttendanceLog } from './entities/attendance.entity';
import { AttendanceAdjustment, AdjustmentType, AdjustmentStatus } from './entities/attendance-adjustment.entity';
import { AttendancePolicy } from './entities/attendance-policy.entity';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in employee (self-service)' })
  @ApiResponse({ status: 201, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Already checked in or invalid data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async checkIn(
    @Body() body: {
      notes?: string;
    },
    @Request() req
  ): Promise<Attendance> {
    const employeeId = req.user.userId; // Assuming user is employee
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.checkIn(
      employeeId,
      body,
      tenantId
    );
  }

  @Post('hr/check-in')
  @ApiOperation({ summary: 'HR manually checks in employee' })
  @ApiResponse({ status: 201, description: 'Check-in successful' })
  @ApiResponse({ status: 400, description: 'Already checked in or invalid data' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async hrCheckIn(
    @Body() body: {
      employeeId: string;
      notes?: string;
      date?: string; // optional YYYY-MM-DD override date
    },
    @Request() req
  ): Promise<Attendance> {
    const tenantId = req.user.tenantId;
    const targetDate = body.date ? new Date(body.date) : new Date();
    
    return this.attendanceService.checkIn(
      body.employeeId,
      { notes: body.notes },
      tenantId,
      targetDate
    );
  }

  @Post('check-out')
  @ApiOperation({ summary: 'Check out employee (self-service)' })
  @ApiResponse({ status: 200, description: 'Check-out successful' })
  @ApiResponse({ status: 400, description: 'No check-in found or already checked out' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async checkOut(
    @Body() body: {
      notes?: string;
    },
    @Request() req
  ): Promise<Attendance> {
    const employeeId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.checkOut(
      employeeId,
      body,
      tenantId
    );
  }

  @Post('hr/check-out')
  @ApiOperation({ summary: 'HR manually checks out employee' })
  @ApiResponse({ status: 200, description: 'Check-out successful' })
  @ApiResponse({ status: 400, description: 'No check-in found or already checked out' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async hrCheckOut(
    @Body() body: {
      employeeId: string;
      notes?: string;
      date?: string; // optional YYYY-MM-DD override date
    },
    @Request() req
  ): Promise<Attendance> {
    const tenantId = req.user.tenantId;
    const targetDate = body.date ? new Date(body.date) : new Date();
    
    return this.attendanceService.checkOut(
      body.employeeId,
      { notes: body.notes },
      tenantId,
      targetDate
    );
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s attendance for current employee' })
  @ApiResponse({ status: 200, description: 'Today\'s attendance retrieved' })
  @ApiResponse({ status: 404, description: 'No attendance record found' })
  async getTodayAttendance(@Request() req): Promise<Attendance | null> {
    const employeeId = req.user.userId;
    const tenantId = req.user.tenantId;
    const today = new Date();
    
    return this.attendanceService.getAttendanceByDate(employeeId, today, tenantId);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get attendance history for employee' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Employee ID (optional, defaults to current user)' })
  @ApiResponse({ status: 200, description: 'Attendance history retrieved' })
  async getAttendanceHistory(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Query('employeeId') employeeId?: string
  ): Promise<Attendance[]> {
    const targetEmployeeId = employeeId || req.user.userId;
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.getAttendanceHistory(
      targetEmployeeId,
      new Date(startDate),
      new Date(endDate),
      tenantId
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get attendance summary for employee' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Employee ID (optional, defaults to current user)' })
  @ApiResponse({ status: 200, description: 'Attendance summary retrieved' })
  async getAttendanceSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Query('employeeId') employeeId?: string
  ): Promise<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHours: number;
  }> {
    const targetEmployeeId = employeeId || req.user.userId;
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.getAttendanceSummary(
      targetEmployeeId,
      new Date(startDate),
      new Date(endDate),
      tenantId
    );
  }

  @Get('team')
  @ApiOperation({ summary: 'Get team attendance (for managers)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD), defaults to today' })
  @ApiResponse({ status: 200, description: 'Team attendance retrieved' })
  async getTeamAttendance(
    @Request() req,
    @Query('date') date?: string
  ): Promise<Attendance[]> {
    const tenantId = req.user.tenantId;
    const targetDate = date ? new Date(date) : new Date();
    
    // This would need to be implemented based on team/department relationships
    // For now, return empty array as placeholder
    return [];
  }

  @Get('hr/daily')
  @ApiOperation({ summary: 'Get all employees attendance for a specific date (HR only)' })
  @ApiQuery({ name: 'date', required: false, description: 'Date (YYYY-MM-DD), defaults to today' })
  @ApiResponse({ status: 200, description: 'Daily attendance retrieved' })
  async getDailyAttendance(
    @Request() req,
    @Query('date') date?: string
  ): Promise<Attendance[]> {
    const tenantId = req.user.tenantId;
    const targetDate = date ? new Date(date) : new Date();
    
    return this.attendanceService.getDailyAttendance(targetDate, tenantId);
  }

  @Get('hr/summary')
  @ApiOperation({ summary: 'Get attendance summary for all employees (HR only)' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Attendance summary retrieved' })
  async getAttendanceSummaryForAllEmployees(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req
  ): Promise<{
    totalEmployees: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    halfDays: number;
    totalHours: number;
    overtimeHours: number;
    averageHours: number;
    employeeSummaries: Array<{
      employeeId: string;
      employeeName: string;
      presentDays: number;
      absentDays: number;
      lateDays: number;
      totalHours: number;
    }>;
  }> {
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.getAllEmployeesSummary(
      new Date(startDate),
      new Date(endDate),
      tenantId
    );
  }

  @Post('adjustments')
  @ApiOperation({ summary: 'Request attendance adjustment' })
  @ApiResponse({ status: 201, description: 'Adjustment request created' })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @ApiResponse({ status: 404, description: 'Attendance record not found' })
  async requestAdjustment(
    @Body() body: {
      attendanceId: string;
      adjustmentType: AdjustmentType;
      reason: string;
      description?: string;
      newCheckIn?: Date;
      newCheckOut?: Date;
      newStatus?: AttendanceStatus;
      supportingDocuments?: Array<{ fileName: string; fileUrl: string }>;
    },
    @Request() req
  ): Promise<AttendanceAdjustment> {
    const employeeId = req.user.userId;
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.requestAdjustment(employeeId, body, tenantId);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'Get adjustment requests' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee' })
  @ApiResponse({ status: 200, description: 'Adjustment requests retrieved' })
  async getAdjustments(
    @Request() req,
    @Query('status') status?: AdjustmentStatus,
    @Query('employeeId') employeeId?: string
  ): Promise<AttendanceAdjustment[]> {
    // This would need to be implemented in the service
    // For now, return empty array as placeholder
    return [];
  }

  @Put('adjustments/:id/approve')
  @ApiOperation({ summary: 'Approve or reject adjustment request' })
  @ApiParam({ name: 'id', description: 'Adjustment request ID' })
  @ApiResponse({ status: 200, description: 'Adjustment processed' })
  @ApiResponse({ status: 404, description: 'Adjustment request not found' })
  @ApiResponse({ status: 400, description: 'Adjustment already processed' })
  async approveAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: {
      approved: boolean;
      rejectionReason?: string;
    },
    @Request() req
  ): Promise<AttendanceAdjustment> {
    const approvedById = req.user.userId;
    const tenantId = req.user.tenantId;
    
    return this.attendanceService.approveAdjustment(
      id,
      approvedById,
      tenantId,
      body.approved,
      body.rejectionReason
    );
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get attendance logs' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'employeeId', required: false, description: 'Filter by employee' })
  @ApiResponse({ status: 200, description: 'Attendance logs retrieved' })
  async getAttendanceLogs(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req,
    @Query('employeeId') employeeId?: string
  ): Promise<AttendanceLog[]> {
    // This would need to be implemented in the service
    // For now, return empty array as placeholder
    return [];
  }

  @Get('policies')
  @ApiOperation({ summary: 'Get attendance policies' })
  @ApiResponse({ status: 200, description: 'Policies retrieved' })
  async getPolicies(@Request() req): Promise<AttendancePolicy[]> {
    // This would need to be implemented in the service
    // For now, return empty array as placeholder
    return [];
  }

  @Post('policies')
  @ApiOperation({ summary: 'Create attendance policy' })
  @ApiResponse({ status: 201, description: 'Policy created' })
  async createPolicy(
    @Body() policyData: Partial<AttendancePolicy>,
    @Request() req
  ): Promise<AttendancePolicy> {
    // This would need to be implemented in the service
    // For now, return empty object as placeholder
    return {} as AttendancePolicy;
  }
}
