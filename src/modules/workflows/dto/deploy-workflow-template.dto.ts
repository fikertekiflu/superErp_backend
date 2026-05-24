import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
class TemplateStateDto {
  @IsString()
  name: string;

  @IsString()
  key: string;

  @IsOptional()
  order?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

class TemplateTransitionDto {
  @IsString()
  name: string;

  @IsString()
  fromState: string;

  @IsString()
  toState: string;

  @IsOptional()
  @IsString()
  requiredRole?: string;
}

class TemplateStepDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  type: string;

  @IsOptional()
  order?: number;

  @IsOptional()
  config?: Record<string, unknown>;
}

export class DeployWorkflowTemplateDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  templateId?: string;

  @IsString()
  trigger: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateStateDto)
  states: TemplateStateDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateTransitionDto)
  transitions: TemplateTransitionDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateStepDto)
  steps: TemplateStepDto[];

  @IsOptional()
  @IsArray()
  entityAssignments?: Array<{
    entityId: string;
    permissions?: Record<string, boolean>;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  entitySlugs?: string[];

  @IsOptional()
  @IsBoolean()
  activate?: boolean;

  @IsOptional()
  @IsBoolean()
  seedRoles?: boolean;

  /** When true, create missing data models (entities) referenced by entitySlugs */
  @IsOptional()
  @IsBoolean()
  seedEntities?: boolean;
}
