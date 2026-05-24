import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { TenantsService } from '../tenants/tenants.service';
import { CompanyRegisterDto } from './dto/company-register.dto';
import { EmailService } from '../email/email.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
export declare class AuthService {
    private userRepository;
    private jwtService;
    private configService;
    private emailService;
    private tenantsService;
    private subscriptionsService;
    constructor(userRepository: Repository<User>, jwtService: JwtService, configService: ConfigService, emailService: EmailService, tenantsService: TenantsService, subscriptionsService: SubscriptionsService);
    private hashResetToken;
    private getFrontendBaseUrl;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    } | {
        emailError?: string | undefined;
        devResetUrl?: string | undefined;
        devHint?: string | undefined;
        message: string;
        emailSent: boolean;
    }>;
    validatePasswordResetToken(token: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            tenantId: string;
            tenant: any;
            roles: any[];
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            tenantId: string;
            status: UserStatus;
        };
    }>;
    validateUser(email: string, password: string): Promise<any>;
    createSuperAdmin(): Promise<{
        message: string;
        credentials?: undefined;
    } | {
        message: string;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    registerCompany(companyRegisterDto: CompanyRegisterDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: UserRole;
            tenantId: string;
        };
        tenant: {
            id: string;
            name: string;
            domain: string;
            description: string;
            isOnboarded: boolean;
            status: import("../tenants/tenant.entity").TenantStatus;
            verificationStatus: any;
        };
    }>;
}
