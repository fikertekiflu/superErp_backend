import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowExecutionService } from './workflow-execution.service';
import { Entity } from '../entities/entity.entity';

@Injectable()
export class WorkflowTriggerService {
  private readonly logger = new Logger(WorkflowTriggerService.name);

  constructor(
    @InjectRepository(Workflow)
    private readonly workflowsRepository: Repository<Workflow>,
    @InjectRepository(Entity)
    private readonly entityRepository: Repository<Entity>,
    private readonly workflowExecutionService: WorkflowExecutionService,
  ) {}

  /**
   * Run all active event_based workflows linked to this entity definition.
   */
  async triggerForEntityRecord(
    tenantId: string,
    entityDefinitionId: string,
    entityName: string,
    recordId: string,
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    if (!tenantId) {
      this.logger.warn('triggerForEntityRecord skipped: missing tenantId');
      return;
    }

    const workflows = await this.workflowsRepository.find({
      where: {
        tenantId,
        status: 'active',
        trigger: 'event_based',
      },
    });

    this.logger.log(
      `Entity record created (${entityName}/${recordId}): ${workflows.length} active event workflow(s) for tenant`,
    );

    let triggered = 0;

    for (const workflow of workflows) {
      const assignments = workflow.entityAssignments || [];
      const isLinked = assignments.some(
        (a) => a.entityId === entityDefinitionId,
      );

      if (!isLinked) {
        continue;
      }

      this.logger.log(
        `Triggering workflow "${workflow.name}" (${workflow.id}) for ${entityName}`,
      );

      try {
        await this.workflowExecutionService.triggerWorkflow(
          workflow.id,
          userId,
          tenantId,
          {
            recordId,
            entityDefinitionId,
            entityId: recordId,
            entityType: entityName,
            entityData: data,
            triggerType: 'event_based',
          },
        );
        triggered++;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Workflow "${workflow.name}" failed to run: ${message}`,
        );
      }
    }

    if (triggered === 0) {
      this.logger.warn(
        `No workflow ran for entity ${entityDefinitionId}. Check workflow is Active, trigger=event_based, and entity is assigned.`,
      );
    }
  }

  /**
   * Resolve entity by slug(s) and trigger linked workflows (used by HRM, etc.).
   */
  async triggerForEntitySlugs(
    tenantId: string,
    slugs: string[],
    recordId: string,
    data: Record<string, unknown>,
    userId: string,
  ): Promise<void> {
    for (const slug of slugs) {
      const entity = await this.entityRepository.findOne({
        where: { slug, tenantId },
      });
      if (entity) {
        await this.triggerForEntityRecord(
          tenantId,
          entity.id,
          entity.name,
          recordId,
          data,
          userId,
        );
        return;
      }
    }

    this.logger.warn(
      `No entity found for slug(s) [${slugs.join(', ')}] — workflows not triggered`,
    );
  }
}
