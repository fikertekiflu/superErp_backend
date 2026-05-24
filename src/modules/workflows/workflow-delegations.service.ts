import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { WorkflowDelegation } from './workflow-delegation.entity';
import { User } from '../users/user.entity';

@Injectable()
export class WorkflowDelegationsService {
  constructor(
    @InjectRepository(WorkflowDelegation)
    private readonly delegationRepo: Repository<WorkflowDelegation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(
    tenantId: string,
    delegatorUserId: string,
    body: {
      delegateUserId: string;
      startsAt: string;
      endsAt: string;
      roleIds?: string[];
      reason?: string;
    },
  ): Promise<WorkflowDelegation> {
    if (body.delegateUserId === delegatorUserId) {
      throw new BadRequestException('Cannot delegate to yourself');
    }

    const startsAt = new Date(body.startsAt);
    const endsAt = new Date(body.endsAt);
    if (endsAt <= startsAt) {
      throw new BadRequestException('End date must be after start date');
    }

    const delegate = await this.userRepo.findOne({
      where: { id: body.delegateUserId, tenantId },
    });
    if (!delegate) throw new NotFoundException('Delegate user not found');

    const delegator = await this.userRepo.findOne({
      where: { id: delegatorUserId, tenantId },
      relations: ['roles'],
    });
    if (!delegator) throw new NotFoundException('Delegator not found');

    if (body.roleIds?.length) {
      const delegatorRoleIds = new Set(
        delegator.roles?.map((r) => r.id) || [],
      );
      for (const rid of body.roleIds) {
        if (!delegatorRoleIds.has(rid)) {
          throw new BadRequestException(
            'You can only delegate roles assigned to you',
          );
        }
      }
    }

    const delegation = this.delegationRepo.create({
      tenantId,
      delegatorUserId,
      delegateUserId: body.delegateUserId,
      roleIds: body.roleIds?.length ? body.roleIds : [],
      startsAt,
      endsAt,
      reason: body.reason,
      isActive: true,
    });

    return this.delegationRepo.save(delegation);
  }

  async listForUser(
    tenantId: string,
    userId: string,
  ): Promise<{
    granted: WorkflowDelegation[];
    received: WorkflowDelegation[];
  }> {
    const [granted, received] = await Promise.all([
      this.delegationRepo.find({
        where: { tenantId, delegatorUserId: userId },
        relations: ['delegate', 'delegator'],
        order: { createdAt: 'DESC' },
      }),
      this.delegationRepo.find({
        where: { tenantId, delegateUserId: userId },
        relations: ['delegate', 'delegator'],
        order: { createdAt: 'DESC' },
      }),
    ]);
    return { granted, received };
  }

  async revoke(
    id: string,
    tenantId: string,
    userId: string,
  ): Promise<WorkflowDelegation> {
    const delegation = await this.delegationRepo.findOne({
      where: { id, tenantId },
    });
    if (!delegation) throw new NotFoundException('Delegation not found');
    if (delegation.delegatorUserId !== userId) {
      throw new ForbiddenException('Only the delegator can revoke');
    }
    delegation.isActive = false;
    return this.delegationRepo.save(delegation);
  }

  /** Active delegations where user is the delegate */
  async getActiveDelegateRoleIds(
    tenantId: string,
    delegateUserId: string,
  ): Promise<string[]> {
    const now = new Date();
    const delegations = await this.delegationRepo.find({
      where: {
        tenantId,
        delegateUserId,
        isActive: true,
        startsAt: LessThanOrEqual(now),
        endsAt: MoreThanOrEqual(now),
      },
      relations: ['delegator', 'delegator.roles'],
    });

    const roleIds = new Set<string>();
    for (const d of delegations) {
      if (d.roleIds?.length) {
        d.roleIds.forEach((id) => roleIds.add(id));
      } else {
        for (const r of d.delegator?.roles || []) {
          roleIds.add(r.id);
        }
      }
    }
    return [...roleIds];
  }

  async canActOnRole(
    tenantId: string,
    userId: string,
    assignedToRoleId: string | undefined,
    userRoleIds: string[],
  ): Promise<{ allowed: boolean; viaDelegation: boolean }> {
    if (!assignedToRoleId) {
      return { allowed: false, viaDelegation: false };
    }
    if (userRoleIds.includes(assignedToRoleId)) {
      return { allowed: true, viaDelegation: false };
    }
    const delegatedRoleIds = await this.getActiveDelegateRoleIds(
      tenantId,
      userId,
    );
    if (delegatedRoleIds.includes(assignedToRoleId)) {
      return { allowed: true, viaDelegation: true };
    }
    return { allowed: false, viaDelegation: false };
  }
}
