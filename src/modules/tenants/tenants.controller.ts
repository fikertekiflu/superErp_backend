import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (company)' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async create(@Body() createTenantDto: CreateTenantDto, @Request() req) {
    return this.tenantsService.create(createTenantDto, req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tenants (super admin only)' })
  @ApiResponse({ status: 200, description: 'Tenants retrieved successfully' })
  async findAll(@Request() req) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Only super admin can view all tenants');
    }
    return this.tenantsService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user tenant' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  async findMyTenant(@Request() req) {
    return this.tenantsService.findByUserId(req.user.userId);
  }

  @Post('onboard')
  @ApiOperation({ summary: 'Complete tenant onboarding' })
  @ApiResponse({
    status: 200,
    description: 'Onboarding completed successfully',
  })
  async onboard(@Body() setupData: any, @Request() req) {
    return this.tenantsService.completeOnboarding(
      req.user.tenantId,
      req.user.userId,
      setupData,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current workspace details' })
  @ApiResponse({ status: 200, description: 'Tenant retrieved successfully' })
  async findMe(@Request() req) {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current workspace settings' })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  async updateMe(@Body() updateData: any, @Request() req) {
    return this.tenantsService.update(req.user.tenantId, updateData);
  }

  // === Verification Pipeline ===

  @Patch('submit-documents')
  @ApiOperation({ summary: 'Submit verification documents' })
  @ApiResponse({ status: 200, description: 'Documents submitted for review' })
  async submitDocuments(@Body() body: { documents: Array<{ name: string; fileUrl: string; type: string }> }, @Request() req) {
    return this.tenantsService.submitDocuments(req.user.tenantId, body.documents);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending verification tenants (super admin only)' })
  @ApiResponse({ status: 200, description: 'Pending tenants retrieved' })
  async findPending(@Request() req) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Only super admin can view pending tenants');
    }
    return this.tenantsService.findPending();
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a tenant (super admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant approved' })
  async approveTenant(@Param('id') id: string, @Request() req) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Only super admin can approve tenants');
    }
    return this.tenantsService.approveTenant(id, req.user.userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a tenant (super admin only)' })
  @ApiResponse({ status: 200, description: 'Tenant rejected' })
  async rejectTenant(@Param('id') id: string, @Request() req, @Body() body: { reason: string }) {
    if (req.user.role !== 'super_admin') {
      throw new Error('Only super admin can reject tenants');
    }
    return this.tenantsService.rejectTenant(id, req.user.userId, body.reason);
  }
}
