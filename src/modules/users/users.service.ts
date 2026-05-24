import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './user.entity';
import { Role, RoleEntityPermission } from '../roles/role.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async findOne(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id }, relations: ['roles'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['roles'] });
  }

  async update(id: string, updateData: any): Promise<void> {
    await this.userRepository.update(id, updateData);
  }

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; phone?: string },
  ): Promise<User> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const patch: Partial<User> = {};
    if (data.firstName !== undefined) patch.firstName = data.firstName.trim();
    if (data.lastName !== undefined) patch.lastName = data.lastName.trim();
    if (data.phone !== undefined) {
      patch.phone = data.phone.trim() ? data.phone.trim() : undefined;
    }

    await this.userRepository.update(userId, patch);
    const updated = await this.findOne(userId);
    if (!updated) throw new NotFoundException('User not found');
    return updated;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(userId, { password: hashed });
  }

  sanitizeUser(user: User): Omit<User, 'password'> {
    const { password: _pw, ...safe } = user as User & { password?: string };
    return safe;
  }

  async updateUserApprovalLimit(
    userId: string,
    tenantId: string,
    approvalLimitOverride?: number | null,
  ): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
      relations: ['roles'],
    });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepository.update(userId, {
      approvalLimitOverride:
        approvalLimitOverride === undefined ? null : approvalLimitOverride,
    });
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    }) as Promise<User>;
  }

  // Tenant Role Management
  async getTenantRoles(tenantId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { tenant: { id: tenantId }, isActive: true },
      order: { name: 'ASC' },
    });
  }

  async createTenantRole(
    tenantId: string,
    data: {
      name: string;
      description?: string;
      entityPermissions?: RoleEntityPermission[];
    },
  ): Promise<Role> {
    const role = this.roleRepository.create({
      name: data.name,
      description: data.description,
      entityPermissions: data.entityPermissions || [],
      tenant: { id: tenantId },
      isActive: true,
    });
    return this.roleRepository.save(role);
  }

  async updateTenantRole(roleId: string, tenantId: string, data: Partial<Role>): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id: roleId, tenant: { id: tenantId } } });
    if (!role) throw new NotFoundException('Role not found');
    await this.roleRepository.update(roleId, data);
    return this.roleRepository.findOne({ where: { id: roleId } }) as Promise<Role>;
  }

  async deleteTenantRole(roleId: string, tenantId: string): Promise<void> {
    const role = await this.roleRepository.findOne({ where: { id: roleId, tenant: { id: tenantId } } });
    if (role) {
      await this.roleRepository.update(roleId, { isActive: false });
    }
  }

  async assignRoleToUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId, tenantId }, 
      relations: ['roles'] 
    });
    const role = await this.roleRepository.findOne({ 
      where: { id: roleId, tenant: { id: tenantId } } 
    });

    if (!user || !role) throw new NotFoundException('User or role not found');

    user.roles = [...(user.roles || []), role];
    await this.userRepository.save(user);
  }

  async removeRoleFromUser(userId: string, roleId: string, tenantId: string): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId, tenantId }, 
      relations: ['roles'] 
    });

    if (!user) throw new NotFoundException('User not found');

    user.roles = user.roles?.filter(role => role.id !== roleId) || [];
    await this.userRepository.save(user);
  }

  async getTenantUsers(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      relations: ['roles'],
      order: { createdAt: 'DESC' },
    });
  }

  async createTenantUser(tenantId: string, data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    roleIds?: string[];
  }): Promise<User> {
    // Hash the password before saving
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      ...data,
      password: hashedPassword,
      tenantId,
      status: UserStatus.ACTIVE,
      isActive: true,
    });

    const saved = await this.userRepository.save(user);

    // Assign custom roles if provided
    if (data.roleIds && data.roleIds.length > 0) {
      for (const roleId of data.roleIds) {
        await this.assignRoleToUser(saved.id, roleId, tenantId);
      }
    }

    return this.findOne(saved.id) as Promise<User>;
  }
}
