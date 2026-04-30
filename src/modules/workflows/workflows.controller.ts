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
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { WorkflowsService } from './workflows.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new workflow' })
  @ApiResponse({ status: 201, description: 'Workflow created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createWorkflowDto: CreateWorkflowDto, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.create(createWorkflowDto, userId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all workflows' })
  @ApiResponse({ status: 200, description: 'Workflows retrieved successfully' })
  async findAll(@Request() req, @Query('status') status?: string) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.findAll(tenantId);
  }

  @Put(':id')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Update workflow' })
  @ApiResponse({ status: 200, description: 'Workflow updated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async update(
    @Param('id') id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.update(
      id,
      updateWorkflowDto,
      userId,
      tenantId,
    );
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Delete workflow' })
  @ApiResponse({ status: 200, description: 'Workflow deleted successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.remove(id, tenantId);
  }

  @Post(':id/activate')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Activate workflow' })
  @ApiResponse({ status: 200, description: 'Workflow activated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async activate(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.activate(id, userId, tenantId);
  }

  @Post(':id/deactivate')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Deactivate workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow deactivated successfully',
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async deactivate(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.deactivate(id, userId, tenantId);
  }

  @Post(':id/duplicate')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Duplicate workflow' })
  @ApiResponse({ status: 201, description: 'Workflow duplicated successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async duplicate(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.duplicate(id, userId, tenantId);
  }

  @Post(':id/start')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Start workflow execution' })
  @ApiResponse({ status: 200, description: 'Workflow started successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async startWorkflow(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.workflowsService.startWorkflow(id, userId, tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get workflow statistics' })
  @ApiResponse({
    status: 200,
    description: 'Workflow statistics retrieved successfully',
  })
  async getStats(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.getWorkflowStats(tenantId);
  }

  @Get(':id/entities')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Get entities assigned to workflow' })
  @ApiResponse({
    status: 200,
    description: 'Workflow entities retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async getWorkflowEntities(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.getWorkflowEntities(id, tenantId);
  }

  @Post(':id/steps')
  @ApiOperation({ summary: 'Add a step to a workflow' })
  async addStep(
    @Param('id') id: string,
    @Body() stepData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.addStep(id, stepData, tenantId);
  }

  @Patch('steps/:stepId')
  @ApiOperation({ summary: 'Update a workflow step' })
  async updateStep(
    @Param('stepId') stepId: string,
    @Body() stepData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.updateStep(stepId, stepData, tenantId);
  }

  @Delete('steps/:stepId')
  @ApiOperation({ summary: 'Remove a workflow step' })
  async removeStep(@Param('stepId') stepId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.removeStep(stepId, tenantId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Workflow ID' })
  @ApiOperation({ summary: 'Get workflow by ID' })
  @ApiResponse({ status: 200, description: 'Workflow retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Workflow not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.workflowsService.findOne(id, req.user.tenantId);
  }
}
