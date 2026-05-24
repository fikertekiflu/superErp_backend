import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { WorkflowCatalogService } from './workflow-catalog.service';

@ApiTags('Workflow Catalog')
@Controller('workflows/catalog')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowCatalogController {
  constructor(private readonly catalogService: WorkflowCatalogService) {}

  @Get('published')
  @ApiOperation({
    summary: 'List published workflow templates (tenant deploy catalog)',
  })
  listPublished(@Request() req) {
    return this.catalogService.listPublishedForTenant(req.user.tenantId);
  }

  @Get('published/:catalogKey')
  @ApiOperation({ summary: 'Get one published template definition' })
  getOne(@Param('catalogKey') catalogKey: string) {
    return this.catalogService.getPublishedByKey(catalogKey);
  }
}

@ApiTags('Admin Workflow Templates')
@Controller('admin/workflow-templates')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminWorkflowCatalogController {
  constructor(private readonly catalogService: WorkflowCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all catalog templates (super admin)' })
  listAll() {
    return this.catalogService.listAllForAdmin();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync template library from platform definitions' })
  sync() {
    return this.catalogService.syncLibraryFromDefinitions(false);
  }

  @Patch(':catalogKey/publish')
  publish(@Param('catalogKey') catalogKey: string) {
    return this.catalogService.publish(catalogKey);
  }

  @Patch(':catalogKey/unpublish')
  unpublish(@Param('catalogKey') catalogKey: string) {
    return this.catalogService.unpublish(catalogKey);
  }
}
