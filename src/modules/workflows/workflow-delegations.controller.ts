import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkflowDelegationsService } from './workflow-delegations.service';

@ApiTags('Workflow delegations')
@Controller('workflows/delegations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowDelegationsController {
  constructor(
    private readonly delegationsService: WorkflowDelegationsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List delegations granted and received' })
  async list(@Request() req) {
    return this.delegationsService.listForUser(
      req.user.tenantId,
      req.user.userId,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Delegate approval authority while away' })
  async create(
    @Request() req,
    @Body()
    body: {
      delegateUserId: string;
      startsAt: string;
      endsAt: string;
      roleIds?: string[];
      reason?: string;
    },
  ) {
    return this.delegationsService.create(
      req.user.tenantId,
      req.user.userId,
      body,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Revoke a delegation' })
  async revoke(@Param('id') id: string, @Request() req) {
    return this.delegationsService.revoke(
      id,
      req.user.tenantId,
      req.user.userId,
    );
  }
}
