import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CompanyRegisterDto } from './dto/company-register.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
        };
    }>;
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
    getProfile(): Promise<{
        message: string;
    }>;
}
