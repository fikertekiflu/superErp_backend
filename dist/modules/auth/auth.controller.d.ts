import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CompanyRegisterDto } from './dto/company-register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthController {
    private readonly authService;
    private readonly configService;
    constructor(authService: AuthService, configService: ConfigService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/user.entity").UserRole;
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
            role: import("../users/user.entity").UserRole;
            tenantId: string;
            status: import("../users/user.entity").UserStatus;
        };
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    } | {
        emailError?: string | undefined;
        devResetUrl?: string | undefined;
        devHint?: string | undefined;
        message: string;
        emailSent: boolean;
    }>;
    validateResetToken(token: string): Promise<{
        valid: boolean;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    registerCompany(companyRegisterDto: CompanyRegisterDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            role: import("../users/user.entity").UserRole;
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
    createSuperAdmin(headerSecret?: string, body?: {
        setupSecret?: string;
    }): Promise<{
        message: string;
        credentials?: undefined;
    } | {
        message: string;
        credentials: {
            email: string;
            password: string;
        };
    }>;
    getProfile(): Promise<{
        message: string;
    }>;
}
