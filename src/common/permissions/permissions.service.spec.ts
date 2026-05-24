import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { User, UserRole } from '../../modules/users/user.entity';
import { Role } from '../../modules/roles/role.entity';

describe('PermissionsService', () => {
  let service: PermissionsService;

  const userRepo = {
    findOne: jest.fn(),
  };

  const roleRepo = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Role), useValue: roleRepo },
      ],
    }).compile();

    service = module.get(PermissionsService);
    jest.clearAllMocks();
  });

  it('grants full access to tenant_admin', async () => {
    const snapshot = await service.getSnapshot(
      'user-1',
      'tenant-1',
      UserRole.TENANT_ADMIN,
    );
    expect(snapshot.isFullAccess).toBe(true);
    expect(snapshot.canManageSchemas).toBe(true);
  });

  it('merges permissions from multiple roles', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      roles: [
        {
          id: 'role-1',
          entityPermissions: [
            {
              entityId: 'ent-a',
              canCreate: false,
              canRead: true,
              canUpdate: false,
              canDelete: false,
            },
          ],
        },
        {
          id: 'role-2',
          entityPermissions: [
            {
              entityId: 'ent-a',
              canCreate: true,
              canRead: false,
              canUpdate: true,
              canDelete: false,
            },
          ],
        },
      ],
    });

    const snapshot = await service.getSnapshot(
      'user-1',
      'tenant-1',
      UserRole.USER,
    );

    expect(snapshot.byEntity['ent-a']).toEqual({
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    });
  });

  it('denies entity action when not permitted', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      roles: [
        {
          id: 'role-1',
          entityPermissions: [
            {
              entityId: 'ent-a',
              canCreate: false,
              canRead: true,
              canUpdate: false,
              canDelete: false,
            },
          ],
        },
      ],
    });

    await expect(
      service.assertEntityAction(
        'user-1',
        'tenant-1',
        UserRole.USER,
        'ent-a',
        'create',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows read when role grants read', async () => {
    userRepo.findOne.mockResolvedValue({
      id: 'user-1',
      tenantId: 'tenant-1',
      roles: [
        {
          id: 'role-1',
          entityPermissions: [
            {
              entityId: 'ent-a',
              canCreate: false,
              canRead: true,
              canUpdate: false,
              canDelete: false,
            },
          ],
        },
      ],
    });

    await expect(
      service.assertEntityAction(
        'user-1',
        'tenant-1',
        UserRole.USER,
        'ent-a',
        'read',
      ),
    ).resolves.not.toThrow();
  });
});
