import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { WorkflowApprovalLimitsService } from './workflow-approval-limits.service';
import { User, UserRole } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { BadRequestException } from '@nestjs/common';

describe('WorkflowApprovalLimitsService', () => {
  let service: WorkflowApprovalLimitsService;

  const userRepo = {
    findOne: jest.fn(),
  };
  const roleRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowApprovalLimitsService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
      ],
    }).compile();

    service = module.get(WorkflowApprovalLimitsService);
    jest.clearAllMocks();
  });

  it('uses strictest role limit', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      role: UserRole.USER,
      approvalLimitOverride: null,
      roles: [{ id: 'r1' }, { id: 'r2' }],
    });
    roleRepo.find.mockResolvedValue([
      { id: 'r1', maxApprovalAmount: 10000 },
      { id: 'r2', maxApprovalAmount: 5000 },
    ]);

    const limit = await service.getEffectiveLimit('u1', 't1', 'r1');
    expect(limit).toBe(5000);
  });

  it('throws when amount exceeds limit', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'u1',
      role: UserRole.USER,
      roles: [{ id: 'r1' }],
    });
    roleRepo.find.mockResolvedValue([{ id: 'r1', maxApprovalAmount: 5000 }]);

    await expect(
      service.assertCanApproveAmount(
        'u1',
        't1',
        { context: { entityData: { amount: 8000 } } } as any,
        'r1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
