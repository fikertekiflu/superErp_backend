import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.tenantId);
  }

  @Post()
  create(@Request() req, @Body() data: any) {
    return this.invoicesService.create(req.user.tenantId, data);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Request() req, @Body('status') status: string) {
    return this.invoicesService.updateStatus(id, req.user.tenantId, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.invoicesService.remove(id, req.user.tenantId);
  }
}
