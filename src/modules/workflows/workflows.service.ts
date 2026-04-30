import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Workflow, WorkflowStatus, WorkflowTrigger } from './workflow.entity';
import { WorkflowStep } from './workflow-step.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private workflowStepsRepository: Repository<WorkflowStep>,
    @InjectRepository(DynamicEntity)
    private entitiesRepository: Repository<DynamicEntity>,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async create(
    createWorkflowDto: CreateWorkflowDto,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    try {
      // Validate entity assignments exist and belong to tenant
      if (
        createWorkflowDto.entityAssignments &&
        createWorkflowDto.entityAssignments.length > 0
      ) {
        for (const assignment of createWorkflowDto.entityAssignments) {
          const entity = await this.entitiesRepository.findOne({
            where: { id: assignment.entityId, tenantId },
          });

          if (!entity) {
            throw new NotFoundException(
              `Entity with ID ${assignment.entityId} not found`,
            );
          }
        }
      }

      // Check subscription limits
      if (tenantId) {
        const currentCount = await this.workflowsRepository.count({
          where: { tenant: { id: tenantId } },
        });
        await this.subscriptionsService.checkLimit(tenantId, 'maxWorkflows', currentCount);
      }

      const workflowData: any = {
        ...createWorkflowDto,
        createdBy: { id: userId },
      };

      if (tenantId) {
        workflowData.tenant = { id: tenantId };
      }

      const workflow = this.workflowsRepository.create(workflowData);
      return (await this.workflowsRepository.save(
        workflow,
      )) as unknown as Workflow;
    } catch (error) {
      console.error('Error in WorkflowsService.create:', error);
      throw error;
    }
  }

  async findAll(tenantId?: string): Promise<Workflow[]> {
    return this.workflowsRepository.find({
      where: { tenant: { id: tenantId } },
      relations: ['tenant'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, tenantId?: string): Promise<Workflow> {
    try {
      const workflow = await this.workflowsRepository.findOne({
        where: { id, tenant: { id: tenantId } },
        relations: ['steps', 'createdBy', 'tenant'],
      });

      if (!workflow) {
        throw new NotFoundException(`Workflow with ID ${id} not found`);
      }

      return workflow;
    } catch (error) {
      console.error(`Error finding workflow ${id}:`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updateWorkflowDto: UpdateWorkflowDto,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id, tenantId);

    // Validate entity assignments if provided
    if (updateWorkflowDto.entityAssignments) {
      for (const assignment of updateWorkflowDto.entityAssignments) {
        const entity = await this.entitiesRepository.findOne({
          where: { id: assignment.entityId, tenantId },
        });

        if (!entity) {
          throw new NotFoundException(
            `Entity with ID ${assignment.entityId} not found`,
          );
        }
      }
    }

    await this.workflowsRepository.update(id, {
      ...updateWorkflowDto,
      updatedBy: { id: userId },
    });

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId?: string): Promise<void> {
    const workflow = await this.findOne(id, tenantId);

    // Check if workflow is active
    if (workflow.status === WorkflowStatus.ACTIVE) {
      throw new ForbiddenException(
        'Cannot delete an active workflow. Deactivate it first.',
      );
    }

    await this.workflowsRepository.delete(id);
  }

  async activate(
    id: string,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id, tenantId);

    await this.workflowsRepository.update(id, {
      status: WorkflowStatus.ACTIVE,
      updatedBy: { id: userId },
    });

    return this.findOne(id, tenantId);
  }

  async deactivate(
    id: string,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    const workflow = await this.findOne(id, tenantId);

    await this.workflowsRepository.update(id, {
      status: WorkflowStatus.PAUSED,
      updatedBy: { id: userId },
    });

    return this.findOne(id, tenantId);
  }

  async duplicate(
    id: string,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    const originalWorkflow = await this.findOne(id, tenantId);

    const duplicatedWorkflow = this.workflowsRepository.create({
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      status: WorkflowStatus.DRAFT,
      trigger: WorkflowTrigger.MANUAL,
      config: originalWorkflow.config,
      entityAssignments: originalWorkflow.entityAssignments,
      createdBy: { id: userId },
      tenant: { id: tenantId },
    });

    return this.workflowsRepository.save(duplicatedWorkflow);
  }

  // Workflow execution methods
  async startWorkflow(
    workflowId: string,
    userId: string,
    tenantId?: string,
  ): Promise<Workflow> {
    // Verify workflow exists
    const workflow = await this.findOne(workflowId, tenantId);

    if (workflow.status !== WorkflowStatus.ACTIVE) {
      throw new BadRequestException('Workflow must be active to start');
    }

    // Create initial workflow execution record
    // This would be implemented in a separate WorkflowExecution entity
    // For now, just update the workflow status

    return this.activate(workflowId, userId, tenantId);
  }

  async getWorkflowEntities(id: string, tenantId?: string): Promise<any[]> {
    // Verify it exists
    const workflow = await this.findOne(id, tenantId);

    if (
      !workflow.entityAssignments ||
      workflow.entityAssignments.length === 0
    ) {
      return [];
    }

    const entityIds = workflow.entityAssignments.map((a) => a.entityId);
    return this.entitiesRepository.find({ where: { id: In(entityIds) } });
  }

  async addStep(
    workflowId: string,
    stepData: any,
    tenantId?: string,
  ): Promise<WorkflowStep> {
    const workflow = await this.findOne(workflowId, tenantId);

    const step = this.workflowStepsRepository.create({
      ...stepData,
      workflow: { id: workflowId },
    });

    return this.workflowStepsRepository.save(
      step,
    ) as unknown as Promise<WorkflowStep>;
  }

  async updateStep(
    stepId: string,
    stepData: any,
    tenantId?: string,
  ): Promise<WorkflowStep> {
    const step = await this.workflowStepsRepository.findOne({
      where: { id: stepId },
      relations: ['workflow'],
    });

    if (!step || step.workflow.tenantId !== tenantId) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    await this.workflowStepsRepository.update(stepId, stepData);
    const updated = await this.workflowStepsRepository.findOne({
      where: { id: stepId },
    });
    if (!updated)
      throw new NotFoundException(
        `Step with ID ${stepId} not found after update`,
      );
    return updated;
  }

  async removeStep(stepId: string, tenantId?: string): Promise<void> {
    const step = await this.workflowStepsRepository.findOne({
      where: { id: stepId },
      relations: ['workflow'],
    });

    if (!step || step.workflow.tenantId !== tenantId) {
      throw new NotFoundException(`Step with ID ${stepId} not found`);
    }

    await this.workflowStepsRepository.delete(stepId);
  }

  async getWorkflowStats(tenantId?: string): Promise<any> {
    const totalWorkflows = await this.workflowsRepository.count({
      where: { tenant: { id: tenantId } },
    });

    const statusCounts = await this.workflowsRepository
      .createQueryBuilder('workflow')
      .select('workflow.status')
      .addSelect('COUNT(*)', 'count')
      .where('workflow.tenantId = :tenantId', { tenantId })
      .groupBy('workflow.status')
      .getRawMany();

    const recentWorkflows = await this.workflowsRepository.find({
      where: { tenant: { id: tenantId } },
      order: { updatedAt: 'DESC' },
      take: 5,
      relations: ['createdBy'],
    });

    return {
      totalWorkflows,
      statusBreakdown: statusCounts,
      recentWorkflows: recentWorkflows.map((wf) => ({
        id: wf.id,
        name: wf.name,
        status: wf.status,
        updatedAt: wf.updatedAt,
        createdBy: wf.createdBy?.firstName + ' ' + wf.createdBy?.lastName,
      })),
    };
  }
}
