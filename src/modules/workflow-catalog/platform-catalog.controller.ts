import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformCatalogService } from './platform-catalog.service';

@ApiTags('Platform Catalog')
@Controller('platform')
export class PlatformCatalogController {
  constructor(private readonly platformCatalogService: PlatformCatalogService) {}

  @Get('onboarding-recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Blueprint and workflow suggestions from industry and company domain',
  })
  getOnboardingRecommendations(
    @Query('industry') industry: string,
    @Query('domain') domain: string,
    @Request() req,
  ) {
    const resolvedDomain =
      domain?.trim() ||
      req.user?.tenant?.domain ||
      '';

    return this.platformCatalogService.getOnboardingRecommendations(
      industry || 'other',
      resolvedDomain,
    );
  }
}
