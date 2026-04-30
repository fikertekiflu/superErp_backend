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
import { EntitiesService } from './entities.service';
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

  // Entity CRUD Operations
  @Post()
  @ApiOperation({ summary: 'Create a new entity' })
  @ApiResponse({ status: 201, description: 'Entity created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 403, description: 'Entity slug already exists' })
  async create(@Body() createEntityDto: CreateEntityDto, @Request() req) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.entitiesService.create(createEntityDto, userId, tenantId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all entities for current tenant' })
  @ApiResponse({ status: 200, description: 'Entities retrieved successfully' })
  async findAll(@Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.findAll(tenantId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get entity by ID' })
  @ApiResponse({ status: 200, description: 'Entity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findOne(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.findOne(id, tenantId);
  }

  @Get('slug/:slug')
  @ApiParam({ name: 'slug', description: 'Entity slug' })
  @ApiOperation({ summary: 'Get entity by slug' })
  @ApiResponse({ status: 200, description: 'Entity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findBySlug(@Param('slug') slug: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.findBySlug(slug, tenantId);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Update entity' })
  @ApiResponse({ status: 200, description: 'Entity updated successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @ApiResponse({ status: 403, description: 'Entity slug already exists' })
  async update(
    @Param('id') id: string,
    @Body() updateEntityDto: UpdateEntityDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.entitiesService.update(id, updateEntityDto, userId, tenantId);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Delete entity' })
  @ApiResponse({ status: 200, description: 'Entity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @ApiResponse({ status: 403, description: 'Cannot delete entity with data' })
  async remove(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.remove(id, tenantId);
  }

  // Entity Data CRUD Operations
  @Post(':id/data')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Create data for entity' })
  @ApiResponse({ status: 201, description: 'Data created successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createData(
    @Param('id') id: string,
    @Body() createEntityDataDto: CreateEntityDataDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;

    // Ensure the entityId matches the param
    createEntityDataDto.entityId = id;

    return this.entitiesService.createEntityData(
      createEntityDataDto,
      userId,
      tenantId,
    );
  }

  @Get(':id/data')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get all data for entity' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async findAllData(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.findAllData(id, tenantId);
  }

  @Get('data/:dataId')
  @ApiParam({ name: 'dataId', description: 'Data record ID' })
  @ApiOperation({ summary: 'Get data record by ID' })
  @ApiResponse({ status: 200, description: 'Data retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  async findDataById(@Param('dataId') dataId: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.findDataById(dataId, tenantId);
  }

  @Patch('data/:dataId')
  @ApiParam({ name: 'dataId', description: 'Data record ID' })
  @ApiOperation({ summary: 'Update data record' })
  @ApiResponse({ status: 200, description: 'Data updated successfully' })
  @ApiResponse({ status: 404, description: 'Data not found' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async updateData(
    @Param('dataId') dataId: string,
    @Body() updateEntityDataDto: UpdateEntityDataDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const tenantId = req.user.tenantId;
    return this.entitiesService.updateData(
      dataId,
      updateEntityDataDto,
      userId,
      tenantId,
    );
  }

  @Delete(':id/data/:dataId')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiParam({ name: 'dataId', description: 'Data ID' })
  @ApiOperation({ summary: 'Delete entity data' })
  @ApiResponse({ status: 200, description: 'Data deleted successfully' })
  @ApiResponse({ status: 404, description: 'Entity or data not found' })
  async removeData(
    @Param('id') id: string,
    @Param('dataId') dataId: string,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.removeData(dataId, tenantId);
  }

  @Get(':id/search')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Search entity data with filters' })
  @ApiResponse({ status: 200, description: 'Search results' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async searchData(
    @Param('id') id: string,
    @Query() searchQuery: any,
    @Request() req,
  ) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.searchData(id, searchQuery, tenantId);
  }

  @Get(':id/stats')
  @ApiParam({ name: 'id', description: 'Entity ID' })
  @ApiOperation({ summary: 'Get entity statistics and reports' })
  @ApiResponse({ status: 200, description: 'Entity statistics' })
  @ApiResponse({ status: 404, description: 'Entity not found' })
  async getStats(@Param('id') id: string, @Request() req) {
    const tenantId = req.user.tenantId;
    return this.entitiesService.getEntityStats(id, tenantId);
  }
}
