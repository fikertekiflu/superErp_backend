import { Controller, Get, UseGuards, Request, Param, Post, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UserRole } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Role)
    private roleRepo: Repository<Role>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all users for current tenant' })
  async getTenantUsers(@Request() req) {
    return this.usersService.getTenantUsers(req.user.tenantId);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user info' })
  async getCurrentUser(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get('roles')
  @ApiOperation({ summary: 'Get all roles for current tenant' })
  async getTenantRoles(@Request() req) {
    return this.usersService.getTenantRoles(req.user.tenantId);
  }

  @Post('roles')
  @ApiOperation({ summary: 'Create a new tenant role' })
  async createTenantRole(@Request() req, @Body() body: { name: string; description?: string }) {
    return this.usersService.createTenantRole(req.user.tenantId, body);
  }

  @Post('roles/:roleId/assign/:userId')
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRoleToUser(@Request() req, @Param('roleId') roleId: string, @Param('userId') userId: string) {
    await this.usersService.assignRoleToUser(userId, roleId, req.user.tenantId);
    return { message: 'Role assigned successfully' };
  }

  @Delete('roles/:roleId/remove/:userId')
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRoleFromUser(@Request() req, @Param('roleId') roleId: string, @Param('userId') userId: string) {
    await this.usersService.removeRoleFromUser(userId, roleId, req.user.tenantId);
    return { message: 'Role removed successfully' };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new tenant user' })
  async createTenantUser(@Request() req, @Body() body: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    role?: UserRole;
    roleIds?: string[];
  }) {
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
