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
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
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
import { DeployWorkflowTemplateDto } from './dto/deploy-workflow-template.dto';
import { WorkflowAnalyticsService } from './workflow-analytics.service';

@ApiTags('Workflows')
@Controller('workflows')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WorkflowsController {
  constructor(
    private readonly workflowsService: WorkflowsService,
    private readonly analyticsService: WorkflowAnalyticsService,
  ) {}

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

  @Post('deploy-template')
  @ApiOperation({
    summary: 'Deploy a workflow from template (states, transitions, steps)',
  })
  async deployTemplate(
    @Body() dto: DeployWorkflowTemplateDto,
    @Request() req,
  ) {
    return this.workflowsService.deployFromTemplate(
      dto,
      req.user.userId,
      req.user.tenantId,
    );
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

  @Get('analytics')
  @ApiOperation({ summary: 'Workflow execution analytics' })
  async getAnalytics(
    @Request() req,
    @Query('dateRange') dateRange?: string,
    @Query('workflowId') workflowId?: string,
  ) {
    return this.analyticsService.getAnalytics(
      req.user.tenantId,
      dateRange || '30d',
      workflowId,
    );
  }

  @Get('analytics/export')
  @ApiOperation({ summary: 'Export workflow analytics as CSV' })
  async exportAnalytics(
    @Request() req,
    @Res() res: Response,
    @Query('dateRange') dateRange?: string,
    @Query('workflowId') workflowId?: string,
  ) {
    const csv = await this.analyticsService.exportCsv(
      req.user.tenantId,
      dateRange || '30d',
      workflowId,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="workflow-analytics.csv"`,
    );
    res.send(csv);
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

  // State endpoints
  @Post(':id/states')
  @ApiOperation({ summary: 'Create a workflow state' })
  async createState(
    @Param('id') id: string,
    @Body() stateData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.createState(id, stateData, tenantId);
  }

  @Get(':id/states')
  @ApiOperation({ summary: 'Get workflow states' })
  async getStates(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.getStates(id, tenantId);
  }

  @Patch('states/:stateId')
  @ApiOperation({ summary: 'Update a workflow state' })
  async updateState(
    @Param('stateId') stateId: string,
    @Body() stateData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.updateState(stateId, stateData, tenantId);
  }

  @Delete('states/:stateId')
  @ApiOperation({ summary: 'Delete a workflow state' })
  async deleteState(@Param('stateId') stateId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.deleteState(stateId, tenantId);
  }

  // Transition endpoints
  @Post(':id/transitions')
  @ApiOperation({ summary: 'Create a workflow transition' })
  async createTransition(
    @Param('id') id: string,
    @Body() transitionData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.createTransition(id, transitionData, tenantId);
  }

  @Get(':id/transitions')
  @ApiOperation({ summary: 'Get workflow transitions' })
  async getTransitions(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.getTransitions(id, tenantId);
  }

  @Patch('transitions/:transitionId')
  @ApiOperation({ summary: 'Update a workflow transition' })
  async updateTransition(
    @Param('transitionId') transitionId: string,
    @Body() transitionData: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.updateTransition(transitionId, transitionData, tenantId);
  }

  @Delete('transitions/:transitionId')
  @ApiOperation({ summary: 'Delete a workflow transition' })
  async deleteTransition(@Param('transitionId') transitionId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.workflowsService.deleteTransition(transitionId, tenantId);
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
