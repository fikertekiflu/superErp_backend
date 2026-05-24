import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { WorkflowExecution } from './workflow-execution.entity';
import { resolveEntityFieldValue } from './workflow-branching.util';

@Injectable()
export class WorkflowApprovalLimitsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
  ) {}

  /**
   * Effective limit: user override if set, else minimum of assigned role limits (strictest wins).
   * null = unlimited.
   */
  async getEffectiveLimit(
    userId: string,
    tenantId: string,
    assignedToRoleId?: string,
  ): Promise<number | null> {
    const user = await this.userRepo.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });
    if (!user) return null;

    if (user.role === UserRole.TENANT_ADMIN || user.role === UserRole.SUPER_ADMIN) {
      return null;
    }

    if (
      user.approvalLimitOverride != null &&
      !Number.isNaN(Number(user.approvalLimitOverride))
    ) {
      return Number(user.approvalLimitOverride);
    }

    const roleIds = new Set<string>();
    if (assignedToRoleId) roleIds.add(assignedToRoleId);
    for (const r of user.roles || []) {
      roleIds.add(r.id);
    }

    if (roleIds.size === 0) return null;

    const roles = await this.roleRepo.find({
      where: { id: In([...roleIds]) },
    });
    const limits = roles
      .map((r) => r.maxApprovalAmount)
      .filter((v): v is number => v != null && !Number.isNaN(Number(v)))
      .map(Number);

    if (limits.length === 0) return null;
    return Math.min(...limits);
  }

  async assertCanApproveAmount(
    userId: string,
    tenantId: string,
    execution: WorkflowExecution,
    assignedToRoleId?: string,
    amountField = 'amount',
  ): Promise<void> {
    const limit = await this.getEffectiveLimit(
      userId,
      tenantId,
      assignedToRoleId,
    );
    if (limit == null) return;

    const entityData = (execution.context?.entityData || {}) as Record<
      string,
      unknown
    >;
    const raw = resolveEntityFieldValue(entityData, amountField);
    const amount = Number(raw);
    if (Number.isNaN(amount)) return;

    if (amount > limit) {
      throw new BadRequestException(
        `Approval limit exceeded: amount ${amount} is above your limit of ${limit}. Escalate to a user with a higher limit.`,
      );
    }
  }
}
