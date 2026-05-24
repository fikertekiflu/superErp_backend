import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  Patch,
  Param,
  Res,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantSettingsDto } from './dto/update-tenant-settings.dto';
import { SubmitVerificationDto } from './dto/submit-verification.dto';
import {
  VERIFICATION_FILE_FIELDS,
  VerificationUploadedFile,
} from './verification-document.types';

@ApiTags('tenants')
@Controller('tenants')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tenant (company)' })
  async create(@Body() createTenantDto: CreateTenantDto, @Request() req) {
    return this.tenantsService.create(createTenantDto, req.user.userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all tenants (super admin only)' })
  async findAll() {
    return this.tenantsService.findAll();
  }

  @Get('my')
  @ApiOperation({ summary: 'Get current user tenant' })
  async findMyTenant(@Request() req) {
    return this.tenantsService.findByUserId(req.user.userId);
  }

  @Post('onboard')
  @ApiOperation({ summary: 'Complete tenant onboarding' })
  async onboard(@Body() setupData: any, @Request() req) {
    return this.tenantsService.completeOnboarding(
      req.user.tenantId,
      req.user.userId,
      setupData,
    );
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current workspace details' })
  async findMe(@Request() req) {
    return this.tenantsService.findOne(req.user.tenantId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current workspace settings' })
  async updateMe(@Body() dto: UpdateTenantSettingsDto, @Request() req) {
    const tenant = await this.tenantsService.updateMySettings(
      req.user.tenantId,
      dto,
    );
    return tenant;
  }

  @Post('submit-verification')
  @UseInterceptors(
    FileFieldsInterceptor(
      VERIFICATION_FILE_FIELDS.map((f) => ({ name: f.field, maxCount: 1 })),
      {
        storage: memoryStorage(),
        limits: { fileSize: 10 * 1024 * 1024 },
      },
    ),
  )
  @ApiOperation({
    summary: 'Submit verification application with PDF/image uploads',
  })
  async submitVerification(
    @UploadedFiles()
    files: Partial<Record<string, VerificationUploadedFile[]>>,
    @Body() body: SubmitVerificationDto,
    @Request() req,
  ) {
    return this.tenantsService.submitVerificationApplication(
      req.user.tenantId,
      {
        legalBusinessName: body.legalBusinessName,
        tinNumber: body.tinNumber,
        businessRegistrationNumber: body.businessRegistrationNumber,
        businessPhone: body.businessPhone,
        businessAddress: body.businessAddress,
      },
      files,
    );
  }

  @Get(':tenantId/verification-files/:documentId')
  @ApiOperation({ summary: 'Stream a verification document (PDF/image)' })
  async getVerificationFile(
    @Param('tenantId') tenantId: string,
    @Param('documentId') documentId: string,
    @Request() req,
    @Res() res: Response,
  ) {
    await this.tenantsService.streamVerificationFile(
      tenantId,
      documentId,
      req.user,
      res,
    );
  }

  @Patch('submit-documents')
  @ApiOperation({ summary: 'Submit verification documents (legacy URLs)' })
  async submitDocuments(
    @Body()
    body: {
      documents: Array<{ name: string; fileUrl: string; type: string }>;
    },
    @Request() req,
  ) {
    return this.tenantsService.submitDocuments(
      req.user.tenantId,
      body.documents,
    );
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get pending verification tenants (super admin)' })
  async findPending() {
    return this.tenantsService.findPending();
  }

  @Patch(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Approve a tenant (super admin only)' })
  async approveTenant(@Param('id') id: string, @Request() req) {
    return this.tenantsService.approveTenant(id, req.user.userId);
  }

  @Patch(':id/reject')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Reject a tenant (super admin only)' })
  async rejectTenant(
    @Param('id') id: string,
    @Request() req,
    @Body() body: { reason: string },
  ) {
    return this.tenantsService.rejectTenant(id, req.user.userId, body.reason);
  }
}
