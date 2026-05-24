import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Headers,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CompanyRegisterDto } from './dto/company-register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'User registration' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Reset requested (generic message)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Get('reset-password/validate')
  @ApiOperation({ summary: 'Check if password reset token is valid' })
  async validateResetToken(@Query('token') token: string) {
    return this.authService.validatePasswordResetToken(token);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Set new password with reset token' })
  @ApiResponse({ status: 200, description: 'Password updated' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('register/company')
  @ApiOperation({ summary: 'Company registration' })
  @ApiResponse({
    status: 201,
    description: 'Company and admin registered successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async registerCompany(@Body() companyRegisterDto: CompanyRegisterDto) {
    return this.authService.registerCompany(companyRegisterDto);
  }

  @Post('init-super-admin')
  @ApiOperation({ summary: 'Create super admin user (requires setup secret)' })
  @ApiResponse({ status: 201, description: 'Super admin created successfully' })
  async createSuperAdmin(
    @Headers('x-setup-secret') headerSecret?: string,
    @Body() body?: { setupSecret?: string },
  ) {
    const expected = this.configService.get<string>('SETUP_SECRET');
    const provided = headerSecret || body?.setupSecret;
    if (!expected || provided !== expected) {
      throw new ForbiddenException('Invalid or missing setup secret');
    }
    return this.authService.createSuperAdmin();
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile() {
    return { message: 'This is a protected route' };
  }
}
