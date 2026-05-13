import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkflowExecutionService } from './workflow-execution.service';
import { EventType } from './workflow-event.entity';

@ApiTags('Workflow Executions')
@Controller('workflow-executions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowExecutionsController {
  constructor(private readonly executionService: WorkflowExecutionService) {}

  @Get()
  @ApiOperation({ summary: 'Get all workflow executions for tenant' })
  async getExecutions(@Request() req) {
    return this.executionService.getExecutions(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get workflow execution by ID' })
  async getExecution(@Param('id') id: string) {
    return this.executionService.getExecution(id);
  }

  @Post('trigger/:workflowId')
  @ApiOperation({ summary: 'Manually trigger a workflow execution' })
  async triggerWorkflow(
    @Param('workflowId') workflowId: string,
    @Body() body: { entityId?: string; entityType?: string; entityData?: Record<string, any> },
    @Request() req,
  ) {
    return this.executionService.triggerWorkflow(
      workflowId,
      req.user.userId,
      req.user.tenantId,
      {
        ...body,
        triggerType: 'manual',
      },
    );
  }

  @Post(':executionId/approve')
  @ApiOperation({ summary: 'Approve a workflow approval step' })
  async approveWorkflow(
    @Param('executionId') executionId: string,
    @Body() body: { taskId: string; notes?: string },
    @Request() req,
  ) {
    return this.executionService.handleApproval(
      executionId,
      body.taskId,
      req.user.userId,
      'approve',
      body.notes,
    );
  }

  @Post(':executionId/reject')
  @ApiOperation({ summary: 'Reject a workflow approval step' })
  async rejectWorkflow(
    @Param('executionId') executionId: string,
    @Body() body: { taskId: string; notes?: string; reason?: string },
    @Request() req,
  ) {
    return this.executionService.handleApproval(
      executionId,
      body.taskId,
      req.user.userId,
      'reject',
      body.notes || body.reason,
    );
  }

  @Get(':id/events')
  @ApiOperation({ summary: 'Get workflow execution audit events' })
  async getExecutionEvents(@Param('id') id: string, @Request() req) {
    return this.executionService.getExecutionEvents(id, req.user.tenantId);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Get workflow execution with full history and events' })
  async getExecutionWithHistory(@Param('id') id: string) {
    return this.executionService.getExecution(id);
  }

  @Post(':id/transitions/:transitionId/execute')
  @ApiOperation({ summary: 'Execute a workflow transition' })
  async executeTransition(
    @Param('id') id: string,
    @Param('transitionId') transitionId: string,
    @Body() body: { notes?: string },
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.executionService.executeTransition(id, transitionId, userId, tenantId, body.notes);
  }
}
