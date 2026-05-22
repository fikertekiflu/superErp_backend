import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Param,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscriptionsService } from './subscriptions.service';
import { ChapaService } from './chapa.service';

@ApiTags('subscriptions')
@Controller('subscriptions')
@ApiBearerAuth()
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly chapaService: ChapaService,
  ) {}

  @Get('plans')
  @ApiOperation({ summary: 'Get all active subscription plans' })
  async getPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Get('my-subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Get current tenant subscription' })
  async getMySubscription(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.findTenantSubscription(tenantId);
  }

  @Post('upgrade/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Upgrade or change subscription plan' })
  async upgrade(@Param('planId') planId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.subscriptionsService.upgradePlan(tenantId, planId);
  }

  @Get('admin-all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all tenant subscriptions (Admin only)' })
  async findAllSubscriptions() {
    return this.subscriptionsService.findAllSubscriptions();
  }

  @Get('admin-plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all plans (Admin only)' })
  async findAllPlans() {
    return this.subscriptionsService.findAllPlans();
  }

  @Patch('admin-plans/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update a subscription plan (Admin only)' })
  async updatePlan(@Param('id') id: string, @Body() data: any) {
    return this.subscriptionsService.updatePlan(id, data);
  }

  @Post('checkout/:planId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Initialize Chapa payment for a plan' })
  async checkout(@Param('planId') planId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    const user = req.user;
    
    // 1. Get plan details
    const plan = await this.subscriptionsService.findPlanById(planId);
    
    // 2. Create unique reference (Format: tx-tenantPart-planPart-timestamp)
    const tx_ref = `tx-${tenantId.split('-')[0]}-${planId.split('-')[0]}-${Date.now()}`;
    
    // 3. Initialize Chapa
    const payload = {
      amount: plan.price, 
      currency: 'ETB', 
      email: user.email,
      first_name: user.firstName || 'User',
      last_name: user.lastName || 'ERP',
      tx_ref,
      meta: {
        planId: planId,
        tenantId: tenantId
      },
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/dashboard/billing/success?status=success&tx_ref=${tx_ref}`,
      callback_url: `${process.env.BACKEND_URL || 'http://localhost:3000'}/subscriptions/webhook/chapa`,
    };

    console.log('Sending to Chapa:', JSON.stringify(payload, null, 2));
    
    return this.chapaService.initializeTransaction(payload);
  }

  @Get('verify/:tx_ref')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Verify Chapa payment' })
  async verify(@Param('tx_ref') tx_ref: string, @Request() req) {
    const tenantId = req.user.tenantId;
    const verification = await this.chapaService.verifyTransaction(tx_ref);
    
    if (verification.status === 'success') {
      // 1. Extract the planPart from the tx_ref (tx-tenantPart-planPart-timestamp)
      const parts = tx_ref.split('-');
      const planPart = parts[2]; 
      
      console.log('Verifying payment for tx_ref:', tx_ref);
      console.log('Extracted Plan Part:', planPart);
      
      // 2. Find the full plan by matching the first part of the ID
      const allPlans = await this.subscriptionsService.findAllPlans();
      const plan = allPlans.find(p => p.id.startsWith(planPart));
      
      if (plan) {
        console.log('Found matching plan:', plan.name, 'with ID:', plan.id);
        await this.subscriptionsService.upgradePlan(tenantId, plan.id);
        console.log('Successfully upgraded tenant:', tenantId, 'to plan:', plan.name);
        return { status: 'success', message: 'Payment verified and plan upgraded' };
      } else {
        console.log('CRITICAL: No plan found starting with:', planPart);
        console.log('Available plan IDs:', allPlans.map(p => p.id));
        return { status: 'failed', message: 'Plan matching failed' };
      }
    }
    
    return { status: 'failed', message: 'Payment verification failed' };
  }

  @Post('admin/plans')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new plan (Admin only)' })
  async createPlan(@Body() planData: any) {
    // In a real app, we would add a RoleGuard(SUPER_ADMIN) here
    return this.subscriptionsService.createPlan(planData);
  }
}
