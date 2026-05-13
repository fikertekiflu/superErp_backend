import { Controller, Get, Post, Param, Body, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';

@ApiTags('Tasks')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Get my tasks (role-based claim system)' })
  async getMyTasks(@Request() req) {
    return this.tasksService.getTasksByUserRoles(req.user.userId, req.user.tenantId);
  }

  @Post(':id/claim')
  @ApiOperation({ summary: 'Claim a task (role-based assignment)' })
  async claimTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.claimTask(id, req.user.userId, req.user.tenantId);
  }

  @Post(':id/unclaim')
  @ApiOperation({ summary: 'Unclaim a task (release ownership)' })
  async unclaimTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.unclaimTask(id, req.user.userId, req.user.tenantId);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all tasks for tenant' })
  async getAllTasks(@Request() req) {
    return this.tasksService.getAllTasks(req.user.tenantId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get task statistics' })
  async getStats(@Request() req) {
    return this.tasksService.getTaskStats(req.user.tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by ID' })
  async getTask(@Param('id') id: string) {
    return this.tasksService.getTask(id);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start working on a task' })
  async startTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.startTask(id, req.user.userId);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete a task (approve/reject for approval tasks)' })
  async completeTask(
    @Param('id') id: string,
    @Body() body: { approved?: boolean; notes?: string; data?: any },
    @Request() req,
  ) {
    return this.tasksService.completeTask(id, req.user.userId, body);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a task' })
  async cancelTask(@Param('id') id: string, @Request() req) {
    return this.tasksService.cancelTask(id, req.user.userId);
  }
}
