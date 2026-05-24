import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogsService } from './audit-logs.service';
import { ForbiddenException } from '@nestjs/common';
import { UserRole } from '../users/user.entity';

@ApiTags('audit-logs')
@Controller('audit-logs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get('platform')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Platform-wide audit logs (super admin)' })
  async findPlatform(@Query('limit') limit?: string) {
    return this.auditLogsService.findAllPlatform(
      limit ? parseInt(limit, 10) : 200,
    );
  }

  @Get()
  @ApiOperation({ summary: 'List audit logs for current tenant' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'resourceType', required: false })
  async findAll(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('resourceType') resourceType?: string,
  ) {
    const { tenantId, role, userId } = req.user;
    if (!tenantId) {
      throw new ForbiddenException('Tenant context required');
    }

    const isAdmin =
      role === UserRole.TENANT_ADMIN || role === UserRole.SUPER_ADMIN;
    if (!isAdmin) {
      throw new ForbiddenException(
        'Only tenant administrators can view audit logs',
      );
    }

    return this.auditLogsService.findForTenant(tenantId, {
      limit: limit ? parseInt(limit, 10) : 100,
      resourceType,
    });
  }
}
