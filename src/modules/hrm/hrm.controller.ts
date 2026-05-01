import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { HrmService } from './hrm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('hrm')
@Controller('hrm')
@UseGuards(JwtAuthGuard)
export class HrmController {
  constructor(private readonly hrmService: HrmService) {}

  @Get('employees')
  findAll(@Request() req) {
    return this.hrmService.findAll(req.user.tenantId);
  }

  @Get('employees/:id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.hrmService.findOne(id, req.user.tenantId);
  }

  @Post('employees')
  create(@Request() req, @Body() data: any) {
    return this.hrmService.create(req.user.tenantId, data);
  }

  @Patch('employees/:id')
  update(@Param('id') id: string, @Request() req, @Body() data: any) {
    return this.hrmService.update(id, req.user.tenantId, data);
  }

  @Delete('employees/:id')
  remove(@Param('id') id: string, @Request() req) {
    return this.hrmService.remove(id, req.user.tenantId);
  }

  // Department Endpoints
  @Get('departments')
  findAllDepartments(@Request() req) {
    return this.hrmService.findAllDepartments(req.user.tenantId);
  }

  @Post('departments')
  createDepartment(@Request() req, @Body() data: any) {
    return this.hrmService.createDepartment(req.user.tenantId, data);
  }

  @Delete('departments/:id')
  removeDepartment(@Param('id') id: string, @Request() req) {
    return this.hrmService.removeDepartment(id, req.user.tenantId);
  }

  // Position Endpoints
  @Get('positions')
  findAllPositions(@Request() req) {
    return this.hrmService.findAllPositions(req.user.tenantId);
  }

  @Post('positions')
  createPosition(@Request() req, @Body() data: any) {
    return this.hrmService.createPosition(req.user.tenantId, data);
  }

  @Delete('positions/:id')
  removePosition(@Param('id') id: string, @Request() req) {
    return this.hrmService.removePosition(id, req.user.tenantId);
  }
}

// Helper for Swagger
function ApiTags(name: string) {
  return (target: any) => {};
}
