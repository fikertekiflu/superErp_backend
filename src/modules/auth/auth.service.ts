import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TenantsService } from '../tenants/tenants.service';
import { CompanyRegisterDto } from './dto/company-register.dto';
import { Tenant } from '../tenants/tenant.entity';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { Plan } from '../subscriptions/plan.entity';
import { Subscription } from '../subscriptions/subscription.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private tenantsService: TenantsService,
    private subscriptionsService: SubscriptionsService,
  ) {}

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['tenant', 'roles'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE || !user.isActive) {
      throw new UnauthorizedException('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Generate JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
        tenant: user.tenant,
        roles: user.roles,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;
    const phone = (registerDto as any).phone;
    const role = (registerDto as any).role;
    const tenantId = (registerDto as any).tenantId;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    // Check subscription limits if tenantId is provided
    if (tenantId) {
      const userCount = await this.userRepository.count({
        where: { tenantId },
      });
      await this.subscriptionsService.checkLimit(tenantId, 'maxUsers', userCount);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || null,
      role: role ? (role as UserRole) : UserRole.USER,
      tenantId: tenantId || null,
      status: UserStatus.PENDING,
      isEmailVerified: false,
    });

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token
    const payload = {
      sub: savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      tenantId: savedUser.tenantId,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        role: savedUser.role,
        tenantId: savedUser.tenantId,
        status: savedUser.status,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async createSuperAdmin() {
    const email = 'admin@supererp.com';
    const password = 'admin123456';

    // Check if super admin already exists
    const existingAdmin = await this.userRepository.findOne({
      where: { email, role: UserRole.SUPER_ADMIN },
    });

    if (existingAdmin) {
      return { message: 'Super admin already exists' };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create super admin
    const superAdmin = this.userRepository.create({
      email,
      password: hashedPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isEmailVerified: true,
      isActive: true,
      // Super admin doesn't need a tenant
      tenantId: undefined,
    });

    await this.userRepository.save(superAdmin);

    return {
      message: 'Super admin created successfully',
      credentials: { email, password },
    };
  }

  async registerCompany(companyRegisterDto: CompanyRegisterDto) {
    const {
      firstName,
      lastName,
      email,
      password,
      companyName,
      companyDomain,
      companyDescription,
      plan: planSlug,
    } = companyRegisterDto;

    // We'll use a transaction to ensure both user and tenant are created together
    return await this.userRepository.manager.transaction(
      async (transactionalEntityManager) => {
        // 1. Check if user already exists (case-insensitive)
        const existingUser = await transactionalEntityManager.findOne(User, {
          where: { email: email.toLowerCase() },
        });

        if (existingUser) {
          throw new ConflictException('User with this email already exists');
        }

        // 2. Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Create user (without tenant initially)
        const newUser = transactionalEntityManager.create(User, {
          email: email.toLowerCase(),
          password: hashedPassword,
          role: UserRole.TENANT_ADMIN,
          status: UserStatus.ACTIVE,
          firstName,
          lastName,
          isActive: true,
          isEmailVerified: true,
        });

        const user = await transactionalEntityManager.save(newUser);

        // 4. Create tenant
        const existingTenantByDomain = await transactionalEntityManager.findOne(
          Tenant,
          {
            where: [{ domain: companyDomain }, { name: companyName }],
          },
        );

        if (existingTenantByDomain) {
          throw new ConflictException('Company name or domain already exists');
        }

        const tenant = await transactionalEntityManager.save(
          transactionalEntityManager.create(Tenant, {
            name: companyName,
            domain: companyDomain,
            description: companyDescription,
            createdById: user.id,
            status: 'active' as any, // Cast to any to handle enum or string
            isOnboarded: false,
          }),
        );

        // 5. Update user with tenant ID
        await transactionalEntityManager.update(User, user.id, {
          tenantId: tenant.id,
        });

        // 5.5. Create subscription
        let plan = await transactionalEntityManager.findOne(Plan, {
          where: { name: (planSlug || 'starter').charAt(0).toUpperCase() + (planSlug || 'starter').slice(1) }
        });
        
        // Fallback search if exact name match fails (e.g. "Starter (Free)")
        if (!plan) {
          const allPlans = await transactionalEntityManager.find(Plan);
          plan = allPlans.find(p => p.name.toLowerCase().includes(planSlug || 'starter')) || allPlans[0];
        }

        if (plan) {
          const isPaidPlan = !plan.name.toLowerCase().includes('starter');
          await transactionalEntityManager.save(
            transactionalEntityManager.create(Subscription, {
              tenantId: tenant.id,
              planId: plan.id,
              status: (isPaidPlan ? 'trialing' : 'active') as any,
              currentPeriodStart: new Date(),
              currentPeriodEnd: isPaidPlan 
                ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 day trial
                : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // "Forever"
            })
          );
        }

        // 6. Generate JWT token
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role,
          tenantId: tenant.id,
        };

        const token = this.jwtService.sign(payload);

        return {
          message: 'Company and admin user created successfully',
          access_token: token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: tenant.id,
          },
          tenant: {
            id: tenant.id,
            name: tenant.name,
            domain: tenant.domain,
            description: tenant.description,
            isOnboarded: tenant.isOnboarded,
            status: tenant.status,
          },
        };
      },
    );
  }
}
