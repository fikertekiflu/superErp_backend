import {
  Controller,
  Get,
  UseGuards,
  Request,
  Param,
  Post,
  Body,
  Delete,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TenantAdminGuard } from '../auth/guards/tenant-admin.guard';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role, RoleEntityPermission } from '../roles/role.entity';
import { PermissionsService } from '../../common/permissions/permissions.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly permissionsService: PermissionsService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  @Get('me/permissions')
  @ApiOperation({ summary: 'Get merged entity permissions for current user' })
  async getMyPermissions(@Request() req) {
    return this.permissionsService.getSnapshot(
      req.user.userId,
      req.user.tenantId,
      req.user.role,
    );
  }

  @Get()
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Get all users for current tenant' })
  async getTenantUsers(@Request() req) {
    return this.usersService.getTenantUsers(req.user.tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  async getCurrentUser(@Request() req) {
    const user = await this.usersService.findOne(req.user.userId);
    if (!user) return null;
    return this.usersService.sanitizeUser(user);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateCurrentUser(@Request() req, @Body() body: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.userId, body);
    return this.usersService.sanitizeUser(user);
  }

  @Patch('me/password')
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@Request() req, @Body() body: ChangePasswordDto) {
    await this.usersService.changePassword(
      req.user.userId,
      body.currentPassword,
      body.newPassword,
    );
    return { message: 'Password updated successfully' };
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles for current tenant' })
  async getTenantRoles(@Request() req) {
    return this.usersService.getTenantRoles(req.user.tenantId);
  }

  @Post('roles')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Create a new tenant role' })
  async createTenantRole(
    @Request() req,
    @Body()
    body: {
      name: string;
      description?: string;
      entityPermissions?: RoleEntityPermission[];
    },
  ) {
    return this.usersService.createTenantRole(req.user.tenantId, body);
  }

  @Patch('roles/:roleId')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Update a tenant role' })
  async updateTenantRole(
    @Request() req,
    @Param('roleId') roleId: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      entityPermissions?: RoleEntityPermission[];
      maxApprovalAmount?: number | null;
    },
  ) {
    return this.usersService.updateTenantRole(roleId, req.user.tenantId, body);
  }

  @Patch(':userId/approval-limit')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Set per-user approval limit override' })
  async setUserApprovalLimit(
    @Request() req,
    @Param('userId') userId: string,
    @Body() body: { approvalLimitOverride?: number | null },
  ) {
    return this.usersService.updateUserApprovalLimit(
      userId,
      req.user.tenantId,
      body.approvalLimitOverride,
    );
  }

  @Patch('roles/:roleId/permissions')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Update entity permissions for a role' })
  async updateRolePermissions(
    @Request() req,
    @Param('roleId') roleId: string,
    @Body() body: { entityPermissions: RoleEntityPermission[] },
  ) {
    return this.usersService.updateTenantRole(roleId, req.user.tenantId, {
      entityPermissions: body.entityPermissions,
    });
  }

  @Delete('roles/:roleId')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Deactivate a tenant role' })
  async deleteTenantRole(@Request() req, @Param('roleId') roleId: string) {
    await this.usersService.deleteTenantRole(roleId, req.user.tenantId);
    return { message: 'Role deactivated successfully' };
  }

  @Post('roles/:roleId/assign/:userId')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRoleToUser(
    @Request() req,
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    await this.usersService.assignRoleToUser(
      userId,
      roleId,
      req.user.tenantId,
    );
    return { message: 'Role assigned successfully' };
  }

  @Delete('roles/:roleId/remove/:userId')
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRoleFromUser(
    @Request() req,
    @Param('roleId') roleId: string,
    @Param('userId') userId: string,
  ) {
    await this.usersService.removeRoleFromUser(
      userId,
      roleId,
      req.user.tenantId,
    );
    return { message: 'Role removed successfully' };
  }

  @Post()
  @UseGuards(TenantAdminGuard)
  @ApiOperation({ summary: 'Create a new tenant user' })
  async createTenantUser(
    @Request() req,
    @Body()
    body: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
      role?: UserRole;
      roleIds?: string[];
    },
  ) {
    return this.usersService.createTenantUser(req.user.tenantId, body);
  }

  @Get('by-role/:roleId')
  @ApiOperation({ summary: 'Get users assigned to a specific role' })
  async getUsersByRole(@Request() req, @Param('roleId') roleId: string) {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.roles', 'role')
      .where('user.tenantId = :tenantId', { tenantId: req.user.tenantId })
      .andWhere('role.id = :roleId', { roleId })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .select(['user.id', 'user.email', 'user.firstName', 'user.lastName'])
      .orderBy('user.firstName', 'ASC')
      .getMany();
  }
}
