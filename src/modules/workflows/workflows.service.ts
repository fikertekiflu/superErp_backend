import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Workflow, WorkflowStatus, WorkflowTrigger } from './workflow.entity';
import { WorkflowStep } from './workflow-step.entity';
import { WorkflowState } from './workflow-state.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Entity as DynamicEntity } from '../entities/entity.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Role } from '../roles/role.entity';
import { DeployWorkflowTemplateDto } from './dto/deploy-workflow-template.dto';
import { WorkflowAutomationService } from './workflow-automation.service';
import {
  WorkflowExecution,
  ExecutionStatus,
} from './workflow-execution.entity';
import { WorkflowEvent } from './workflow-event.entity';
import { Task } from '../tasks/task.entity';
import { Notification } from '../notifications/notification.entity';
import { EntitiesService, EntityAuthContext } from '../entities/entities.service';
import { UserRole } from '../users/user.entity';
import { findBlueprintForSlug } from '../../common/catalog/template-entity-blueprints';

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private workflowStepsRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowState)
    private workflowStatesRepository: Repository<WorkflowState>,
    @InjectRepository(WorkflowTransition)
    private workflowTransitionsRepository: Repository<WorkflowTransition>,
    @InjectRepository(WorkflowExecution)
    private workflowExecutionsRepository: Repository<WorkflowExecution>,
    @InjectRepository(WorkflowEvent)
    private workflowEventsRepository: Repository<WorkflowEvent>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(DynamicEntity)
    private entitiesRepository: Repository<DynamicEntity>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    private subscriptionsService: SubscriptionsService,
    private workflowAutomationService: WorkflowAutomationService,
    @Inject(forwardRef(() => EntitiesService))
    private entitiesService: EntitiesService,
  ) {}

  private entityAuth(userId: string, tenantId: string): EntityAuthContext {
    return {
      userId,
      tenantId,
      systemRole: UserRole.TENANT_ADMIN,
    };
  }

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

  async remove(id: string, tenantId?: string): Promise<{ deleted: boolean }> {
    await this.findOne(id, tenantId);

    await this.workflowsRepository.manager.transaction(async (manager) => {
      const workflow = await manager.findOne(Workflow, {
        where: { id, tenantId },
      });
      if (!workflow) {
        throw new NotFoundException('Workflow not found');
      }

      if (workflow.status === WorkflowStatus.ACTIVE) {
        await manager.update(Workflow, id, {
          status: WorkflowStatus.PAUSED,
        });
      }

      const executions = await manager.find(WorkflowExecution, {
        where: { workflowId: id },
        select: ['id'],
      });
      const executionIds = executions.map((e) => e.id);

      if (executionIds.length > 0) {
        await manager.delete(Task, { executionId: In(executionIds) });
        await manager.delete(WorkflowEvent, { executionId: In(executionIds) });
        await manager.delete(Notification, {
          executionId: In(executionIds),
        });
        await manager.delete(WorkflowExecution, { workflowId: id });
      }

      await manager.delete(WorkflowTransition, { workflowId: id });
      await manager.delete(WorkflowState, { workflowId: id });
      await manager.delete(WorkflowStep, { workflowId: id });
      await manager.delete(Workflow, { id });
    });

    return { deleted: true };
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

    let config = stepData.config;
    if (stepData.type === 'automation' && config) {
      config = this.workflowAutomationService.normalizeStepConfig(
        config as Record<string, unknown>,
      );
    }

    const step = this.workflowStepsRepository.create({
      ...stepData,
      config,
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

    const patch = { ...stepData };
    if (
      (patch.type === 'automation' || step.type === 'automation') &&
      patch.config
    ) {
      patch.config = this.workflowAutomationService.normalizeStepConfig(
        patch.config as Record<string, unknown>,
      );
    }

    await this.workflowStepsRepository.update(stepId, patch);
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

    const totalExecutions = await this.workflowExecutionsRepository.count({
      where: { tenantId },
    });
    const completedExecutions =
      await this.workflowExecutionsRepository.count({
        where: { tenantId, status: ExecutionStatus.COMPLETED },
      });
    const successRate =
      totalExecutions > 0
        ? Math.round((completedExecutions / totalExecutions) * 1000) / 10
        : 100;

    return {
      totalWorkflows,
      totalExecutions,
      successRate,
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

  // State management methods
  async createState(
    workflowId: string,
    stateData: { name: string; key: string; description?: string; order?: number; metadata?: Record<string, any> },
    tenantId: string,
  ): Promise<WorkflowState> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id: workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const duplicate = await this.workflowStatesRepository.findOne({
      where: { workflowId, key: stateData.key },
    });
    if (duplicate) {
      throw new BadRequestException(
        `State key "${stateData.key}" already exists in this workflow`,
      );
    }

    const state = this.workflowStatesRepository.create({
      ...stateData,
      workflowId,
    });

    return await this.workflowStatesRepository.save(state);
  }

  async getStates(workflowId: string, tenantId: string): Promise<WorkflowState[]> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id: workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return await this.workflowStatesRepository.find({
      where: { workflowId },
      order: { order: 'ASC' },
    });
  }

  async updateState(
    stateId: string,
    stateData: Partial<WorkflowState>,
    tenantId: string,
  ): Promise<WorkflowState> {
    const state = await this.workflowStatesRepository.findOne({
      where: { id: stateId },
      relations: ['workflow'],
    });

    if (!state || state.workflow.tenantId !== tenantId) {
      throw new NotFoundException('State not found');
    }

    Object.assign(state, stateData);
    return await this.workflowStatesRepository.save(state);
  }

  async deleteState(stateId: string, tenantId: string): Promise<void> {
    const state = await this.workflowStatesRepository.findOne({
      where: { id: stateId },
      relations: ['workflow'],
    });

    if (!state || state.workflow.tenantId !== tenantId) {
      throw new NotFoundException('State not found');
    }

    await this.workflowTransitionsRepository.delete([
      { fromStateId: stateId },
      { toStateId: stateId },
    ]);

    await this.workflowStatesRepository.delete(stateId);
  }

  // Transition management methods
  async createTransition(
    workflowId: string,
    transitionData: {
      name: string;
      description?: string;
      fromStateId: string;
      toStateId: string;
      requiredRoleId?: string;
      conditions?: any[];
      actions?: any[];
      metadata?: Record<string, any>;
    },
    tenantId: string,
  ): Promise<WorkflowTransition> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id: workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    const fromState = await this.workflowStatesRepository.findOne({
      where: { id: transitionData.fromStateId, workflowId },
    });

    const toState = await this.workflowStatesRepository.findOne({
      where: { id: transitionData.toStateId, workflowId },
    });

    if (!fromState || !toState) {
      throw new NotFoundException('State not found in this workflow');
    }

    const transition = this.workflowTransitionsRepository.create({
      ...transitionData,
      workflowId,
    });

    return await this.workflowTransitionsRepository.save(transition);
  }

  async getTransitions(workflowId: string, tenantId: string): Promise<WorkflowTransition[]> {
    const workflow = await this.workflowsRepository.findOne({
      where: { id: workflowId, tenantId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    return await this.workflowTransitionsRepository.find({
      where: { workflowId },
      relations: ['fromState', 'toState', 'requiredRole'],
    });
  }

  async updateTransition(
    transitionId: string,
    transitionData: Partial<WorkflowTransition>,
    tenantId: string,
  ): Promise<WorkflowTransition> {
    const transition = await this.workflowTransitionsRepository.findOne({
      where: { id: transitionId },
      relations: ['workflow'],
    });

    if (!transition || transition.workflow.tenantId !== tenantId) {
      throw new NotFoundException('Transition not found');
    }

    Object.assign(transition, transitionData);
    return await this.workflowTransitionsRepository.save(transition);
  }

  async deleteTransition(transitionId: string, tenantId: string): Promise<void> {
    const transition = await this.workflowTransitionsRepository.findOne({
      where: { id: transitionId },
      relations: ['workflow'],
    });

    if (!transition || transition.workflow.tenantId !== tenantId) {
      throw new NotFoundException('Transition not found');
    }

    await this.workflowTransitionsRepository.delete(transitionId);
  }

  async deployFromTemplate(
    dto: DeployWorkflowTemplateDto,
    userId: string,
    tenantId: string,
  ): Promise<Workflow> {
    let workflowId: string | null = null;

    try {
      return await this.deployFromTemplateInternal(
        dto,
        userId,
        tenantId,
        (id) => {
          workflowId = id;
        },
      );
    } catch (error) {
      if (workflowId) {
        try {
          await this.remove(workflowId, tenantId);
        } catch (cleanupErr) {
          console.error(
            `Failed to roll back partial template deploy ${workflowId}`,
            cleanupErr,
          );
        }
      }
      throw error;
    }
  }

  private async deployFromTemplateInternal(
    dto: DeployWorkflowTemplateDto,
    userId: string,
    tenantId: string,
    onWorkflowCreated?: (workflowId: string) => void,
  ): Promise<Workflow> {
    const trigger = Object.values(WorkflowTrigger).includes(
      dto.trigger as WorkflowTrigger,
    )
      ? (dto.trigger as WorkflowTrigger)
      : WorkflowTrigger.MANUAL;

    const seedEntities = dto.seedEntities !== false;
    const { assignments: entityAssignments, createdEntitySlugs, linkedEntitySlugs } =
      await this.resolveEntityAssignmentsWithSeed(
        tenantId,
        userId,
        dto.entityAssignments || [],
        dto.entitySlugs || [],
        seedEntities,
      );

    const workflow = await this.create(
      {
        name: dto.name,
        description: dto.description,
        trigger,
        status: WorkflowStatus.DRAFT,
        entityAssignments,
        config: {
          templateId: dto.templateId,
          deployedFrom: 'template',
          deployedAt: new Date().toISOString(),
          linkedEntitySlugs,
          createdEntitySlugs,
        },
      },
      userId,
      tenantId,
    );

    onWorkflowCreated?.(workflow.id);

    const stateKeyToId: Record<string, string> = {};
    const sortedStates = [...dto.states].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    for (const state of sortedStates) {
      const created = await this.createState(
        workflow.id,
        {
          name: state.name,
          key: state.key,
          description: state.description,
          order: state.order ?? 0,
        },
        tenantId,
      );
      stateKeyToId[state.key] = created.id;
    }

    const roleNameToId = await this.buildRoleNameMap(
      tenantId,
      dto,
      dto.seedRoles !== false,
    );

    for (const transition of dto.transitions) {
      const fromStateId = stateKeyToId[transition.fromState];
      const toStateId = stateKeyToId[transition.toState];
      if (!fromStateId || !toStateId) {
        throw new BadRequestException(
          `Invalid transition states: ${transition.fromState} -> ${transition.toState}`,
        );
      }

      const requiredRoleId = transition.requiredRole
        ? roleNameToId[transition.requiredRole.trim().toLowerCase()]
        : undefined;

      await this.createTransition(
        workflow.id,
        {
          name: transition.name,
          fromStateId,
          toStateId,
          requiredRoleId,
        },
        tenantId,
      );
    }

    const sortedSteps = [...dto.steps].sort(
      (a, b) => (a.order ?? 0) - (b.order ?? 0),
    );

    for (const step of sortedSteps) {
      let config = this.resolveStepConfig(step.config, roleNameToId);
      if (step.type === 'automation') {
        config = this.workflowAutomationService.normalizeStepConfig(
          config as Record<string, unknown>,
        ) as typeof config;
      }

      await this.addStep(
        workflow.id,
        {
          name: step.name,
          description: step.description,
          type: step.type,
          order: step.order ?? 1,
          config,
        },
        tenantId,
      );
    }

    if (dto.activate) {
      return this.activate(workflow.id, userId, tenantId);
    }

    return this.findOne(workflow.id, tenantId);
  }

  private collectTemplateRoleNames(dto: DeployWorkflowTemplateDto): string[] {
    const names = new Set<string>();
    for (const t of dto.transitions) {
      if (t.requiredRole?.trim()) names.add(t.requiredRole.trim());
    }
    for (const step of dto.steps) {
      const roles = step.config?.assignToRoles;
      if (Array.isArray(roles)) {
        for (const r of roles) {
          if (typeof r === 'string' && r.trim()) names.add(r.trim());
        }
      }
    }
    return [...names];
  }

  private async buildRoleNameMap(
    tenantId: string,
    dto: DeployWorkflowTemplateDto,
    seedMissing: boolean,
  ): Promise<Record<string, string>> {
    const map: Record<string, string> = {};
    const existing = await this.roleRepository.find({
      where: { tenant: { id: tenantId }, isActive: true },
    });

    for (const role of existing) {
      map[role.name.trim().toLowerCase()] = role.id;
    }

    if (!seedMissing) return map;

    for (const name of this.collectTemplateRoleNames(dto)) {
      const key = name.toLowerCase();
      if (map[key]) continue;

      const created = await this.roleRepository.save(
        this.roleRepository.create({
          name,
          description: 'Auto-created from workflow template',
          tenant: { id: tenantId },
          isActive: true,
          entityPermissions: [],
        }),
      );
      map[key] = created.id;
    }

    return map;
  }

  private async resolveEntityAssignmentsWithSeed(
    tenantId: string,
    userId: string,
    explicit: Array<{
      entityId: string;
      permissions?: Record<string, boolean>;
    }>,
    slugs: string[],
    seedEntities: boolean,
  ): Promise<{
    assignments: Array<{
      entityId: string;
      permissions: {
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
      };
    }>;
    createdEntitySlugs: string[];
    linkedEntitySlugs: string[];
  }> {
    const createdEntitySlugs: string[] = [];
    const linkedEntitySlugs: string[] = [];

    if (seedEntities && slugs.length > 0) {
      const seeded = await this.ensureTemplateEntities(tenantId, userId, slugs);
      createdEntitySlugs.push(...seeded.created);
      linkedEntitySlugs.push(...seeded.linked);
    }

    const assignments = await this.resolveEntityAssignments(
      tenantId,
      explicit,
      slugs,
    );

    for (const a of assignments) {
      const entity = await this.entitiesRepository.findOne({
        where: { id: a.entityId, tenantId },
      });
      if (entity?.slug && !linkedEntitySlugs.includes(entity.slug)) {
        linkedEntitySlugs.push(entity.slug);
      }
    }

    return {
      assignments,
      createdEntitySlugs,
      linkedEntitySlugs: [...new Set(linkedEntitySlugs)],
    };
  }

  private async ensureTemplateEntities(
    tenantId: string,
    userId: string,
    requestedSlugs: string[],
  ): Promise<{ created: string[]; linked: string[] }> {
    const created: string[] = [];
    const linked: string[] = [];
    const processedBlueprints = new Set<string>();
    const auth = this.entityAuth(userId, tenantId);

    for (const rawSlug of requestedSlugs) {
      const blueprint = findBlueprintForSlug(rawSlug);
      if (!blueprint || processedBlueprints.has(blueprint.slug)) {
        continue;
      }
      processedBlueprints.add(blueprint.slug);

      const candidates = [blueprint.slug, ...blueprint.aliases];
      let existing: DynamicEntity | null = null;
      for (const candidate of candidates) {
        existing = await this.entitiesRepository.findOne({
          where: { slug: candidate, tenantId },
        });
        if (existing) break;
      }

      if (existing) {
        linked.push(existing.slug);
        continue;
      }

      try {
        const saved = await this.entitiesService.create(
          blueprint.definition,
          auth,
        );
        created.push(saved.slug);
        linked.push(saved.slug);
      } catch (err: any) {
        const msg = err?.message || '';
        if (msg.includes('already exists')) {
          const again = await this.entitiesRepository.findOne({
            where: { slug: blueprint.slug, tenantId },
          });
          if (again) linked.push(again.slug);
        } else {
          throw err;
        }
      }
    }

    return { created, linked };
  }

  private async resolveEntityAssignments(
    tenantId: string,
    explicit: Array<{
      entityId: string;
      permissions?: Record<string, boolean>;
    }>,
    slugs: string[],
  ): Promise<
    Array<{
      entityId: string;
      permissions: {
        canCreate: boolean;
        canRead: boolean;
        canUpdate: boolean;
        canDelete: boolean;
      };
    }>
  > {
    const defaultPerms = {
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    };

    const byEntityId = new Map<
      string,
      {
        entityId: string;
        permissions: typeof defaultPerms;
      }
    >();

    for (const item of explicit) {
      byEntityId.set(item.entityId, {
        entityId: item.entityId,
        permissions: {
          canCreate: item.permissions?.canCreate ?? defaultPerms.canCreate,
          canRead: item.permissions?.canRead ?? defaultPerms.canRead,
          canUpdate: item.permissions?.canUpdate ?? defaultPerms.canUpdate,
          canDelete: item.permissions?.canDelete ?? defaultPerms.canDelete,
        },
      });
    }

    for (const slug of slugs) {
      const blueprint = findBlueprintForSlug(slug);
      const candidates = blueprint
        ? [blueprint.slug, ...blueprint.aliases]
        : [slug];

      for (const candidate of candidates) {
        const entity = await this.entitiesRepository.findOne({
          where: { slug: candidate, tenantId },
        });
        if (entity && !byEntityId.has(entity.id)) {
          byEntityId.set(entity.id, {
            entityId: entity.id,
            permissions: defaultPerms,
          });
          break;
        }
      }
    }

    return [...byEntityId.values()];
  }

  private resolveStepConfig(
    config: Record<string, unknown> | undefined,
    roleNameToId: Record<string, string>,
  ): Record<string, unknown> | undefined {
    if (!config) return config;
    const next = { ...config };
    if (Array.isArray(next.assignToRoles)) {
      next.assignToRoles = (next.assignToRoles as string[])
        .map((name) => roleNameToId[name.trim().toLowerCase()] || name)
        .filter(Boolean);
    }
    return next;
  }
}
