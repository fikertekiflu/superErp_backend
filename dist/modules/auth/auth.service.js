"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../users/user.entity");
const tenants_service_1 = require("../tenants/tenants.service");
const tenant_entity_1 = require("../tenants/tenant.entity");
const subscriptions_service_1 = require("../subscriptions/subscriptions.service");
const plan_entity_1 = require("../subscriptions/plan.entity");
const subscription_entity_1 = require("../subscriptions/subscription.entity");
let AuthService = class AuthService {
    userRepository;
    jwtService;
    tenantsService;
    subscriptionsService;
    constructor(userRepository, jwtService, tenantsService, subscriptionsService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.tenantsService = tenantsService;
        this.subscriptionsService = subscriptionsService;
    }
    async login(loginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({
            where: { email },
            relations: ['tenant', 'roles'],
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (user.status !== user_entity_1.UserStatus.ACTIVE || !user.isActive) {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        await this.userRepository.update(user.id, {
            lastLoginAt: new Date(),
        });
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
    async register(registerDto) {
        const { email, password, firstName, lastName } = registerDto;
        const phone = registerDto.phone;
        const role = registerDto.role;
        const tenantId = registerDto.tenantId;
        const existingUser = await this.userRepository.findOne({
            where: { email },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException('User already exists');
        }
        if (tenantId) {
            const userCount = await this.userRepository.count({
                where: { tenantId },
            });
            await this.subscriptionsService.checkLimit(tenantId, 'maxUsers', userCount);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = this.userRepository.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phone: phone || null,
            role: role ? role : user_entity_1.UserRole.USER,
            tenantId: tenantId || null,
            status: user_entity_1.UserStatus.PENDING,
            isEmailVerified: false,
        });
        const savedUser = await this.userRepository.save(user);
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
    async validateUser(email, password) {
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
        const existingAdmin = await this.userRepository.findOne({
            where: { email, role: user_entity_1.UserRole.SUPER_ADMIN },
        });
        if (existingAdmin) {
            return { message: 'Super admin already exists' };
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const superAdmin = this.userRepository.create({
            email,
            password: hashedPassword,
            firstName: 'Super',
            lastName: 'Admin',
            role: user_entity_1.UserRole.SUPER_ADMIN,
            status: user_entity_1.UserStatus.ACTIVE,
            isEmailVerified: true,
            isActive: true,
            tenantId: undefined,
        });
        await this.userRepository.save(superAdmin);
        return {
            message: 'Super admin created successfully',
            credentials: { email, password },
        };
    }
    async registerCompany(companyRegisterDto) {
        const { firstName, lastName, email, password, companyName, companyDomain, companyDescription, plan: planSlug, } = companyRegisterDto;
        return await this.userRepository.manager.transaction(async (transactionalEntityManager) => {
            const existingUser = await transactionalEntityManager.findOne(user_entity_1.User, {
                where: { email: email.toLowerCase() },
            });
            if (existingUser) {
                throw new common_1.ConflictException('User with this email already exists');
            }
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = transactionalEntityManager.create(user_entity_1.User, {
                email: email.toLowerCase(),
                password: hashedPassword,
                role: user_entity_1.UserRole.TENANT_ADMIN,
                status: user_entity_1.UserStatus.ACTIVE,
                firstName,
                lastName,
                isActive: true,
                isEmailVerified: true,
            });
            const user = await transactionalEntityManager.save(newUser);
            const existingTenantByDomain = await transactionalEntityManager.findOne(tenant_entity_1.Tenant, {
                where: [{ domain: companyDomain }, { name: companyName }],
            });
            if (existingTenantByDomain) {
                throw new common_1.ConflictException('Company name or domain already exists');
            }
            const tenant = await transactionalEntityManager.save(transactionalEntityManager.create(tenant_entity_1.Tenant, {
                name: companyName,
                domain: companyDomain,
                description: companyDescription,
                createdById: user.id,
                status: 'pending_verification',
                verificationStatus: 'pending',
                isOnboarded: false,
            }));
            await transactionalEntityManager.update(user_entity_1.User, user.id, {
                tenantId: tenant.id,
            });
            let plan = await transactionalEntityManager.findOne(plan_entity_1.Plan, {
                where: { name: (planSlug || 'starter').charAt(0).toUpperCase() + (planSlug || 'starter').slice(1) }
            });
            if (!plan) {
                const allPlans = await transactionalEntityManager.find(plan_entity_1.Plan);
                plan = allPlans.find(p => p.name.toLowerCase().includes(planSlug || 'starter')) || allPlans[0];
            }
            if (plan) {
                const isPaidPlan = !plan.name.toLowerCase().includes('starter');
                await transactionalEntityManager.save(transactionalEntityManager.create(subscription_entity_1.Subscription, {
                    tenantId: tenant.id,
                    planId: plan.id,
                    status: (isPaidPlan ? 'trialing' : 'active'),
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: isPaidPlan
                        ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                        : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000),
                }));
            }
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
                    verificationStatus: tenant.verificationStatus || 'pending',
                },
            };
        });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        jwt_1.JwtService,
        tenants_service_1.TenantsService,
        subscriptions_service_1.SubscriptionsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map