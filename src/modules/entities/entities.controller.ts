import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EntitiesService, EntityAuthContext } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import {
  CreateEntityDataDto,
  UpdateEntityDataDto,
} from './dto/create-entity-data.dto';

@ApiTags('entities')
@Controller('entities')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  private authFromRequest(req): EntityAuthContext {
    return {
      userId: req.user.userId,
      tenantId: req.user.tenantId,
      systemRole: req.user.role,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  async create(@Body() createEntityDto: CreateEntityDto, @Request() req) {
    return this.entitiesService.create(createEntityDto, this.authFromRequest(req));
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities for current tenant' })
  async findAll(@Request() req) {
    return this.entitiesService.findAll(this.authFromRequest(req));
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', description: 'Entity slug' })
  @ApiOperation({ summary: 'Get entity by slug' })
  async findBySlug(@Param('slug') slug: string, @Request() req) {
    return this.entitiesService.findBySlug(slug, this.authFromRequest(req));
  }

  @Get('data/:dataId')
  @ApiParam({ name: 'dataId', description: 'Data record ID' })
  @ApiOperation({ summary: 'Get data record by ID' })
  async findDataById(@Param('dataId') dataId: string, @Request() req) {
    return this.entitiesService.findDataById(dataId, this.authFromRequest(req));
  }

  @Patch('data/:dataId')
  @ApiParam({ name: 'dataId', description: 'Data record ID' })
  @ApiOperation({ summary: 'Update data record' })
  async updateData(
    @Param('dataId') dataId: string,
    @Body() updateEntityDataDto: UpdateEntityDataDto,
    @Request() req,
  ) {
    return this.entitiesService.updateData(
      dataId,
      updateEntityDataDto,
      this.authFromRequest(req),
    );
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get entity by ID' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.entitiesService.findOne(id, this.authFromRequest(req));
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Update entity' })
  async update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
    @Request() req,
  ) {
    return this.entitiesService.update(id, updateEntityDto, this.authFromRequest(req));
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Delete entity' })
  async remove(@Param('id') id: string, @Request() req) {
    return this.entitiesService.remove(id, this.authFromRequest(req));
  }

  @Post(':id/data')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Create data for entity' })
  async createData(
    @Param('id') id: string,
    @Body() createEntityDataDto: CreateEntityDataDto,
    @Request() req,
  ) {
    createEntityDataDto.entityId = id;
    return this.entitiesService.createEntityData(
      createEntityDataDto,
      this.authFromRequest(req),
    );
  }

  @Get(':id/data')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get all data for entity' })
  async findAllData(@Param('id') id: string, @Request() req) {
    return this.entitiesService.findAllData(id, this.authFromRequest(req));
  }

  @Delete(':id/data/:dataId')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiParam({ name: 'dataId', description: 'Data ID' })
  @ApiOperation({ summary: 'Delete entity data' })
  async removeData(
    @Param('dataId') dataId: string,
    @Request() req,
  ) {
    return this.entitiesService.removeData(dataId, this.authFromRequest(req));
  }

  @Get(':id/search')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Search entity data with filters' })
  async searchData(
    @Param('id') id: string,
    @Query('q') query: string,
    @Request() req,
  ) {
    return this.entitiesService.searchData(
      id,
      query || '',
      this.authFromRequest(req),
    );
  }

  @Get(':id/stats')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get entity statistics and reports' })
  async getStats(@Param('id') id: string, @Request() req) {
    return this.entitiesService.getEntityStats(id, this.authFromRequest(req));
  }

  @Get(':id/insights')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Dynamic dashboard insights for an entity' })
  async getInsights(@Param('id') id: string, @Request() req) {
    return this.entitiesService.getEntityInsights(
      id,
      this.authFromRequest(req),
    );
  }
}
