import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowStatus, WorkflowTrigger } from '../workflow.entity';

export class CreateWorkflowDto {
  @ApiProperty({ example: 'Sales Pipeline' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Manage sales from lead to close', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: WorkflowStatus, default: WorkflowStatus.DRAFT })
  @IsEnum(WorkflowStatus)
  @IsOptional()
  status?: WorkflowStatus;

  @ApiProperty({ enum: WorkflowTrigger, default: WorkflowTrigger.MANUAL })
  @IsEnum(WorkflowTrigger)
  @IsOptional()
  trigger?: WorkflowTrigger;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  config?: any;

  @ApiProperty({ isArray: true, required: false })
  @IsArray()
  @IsOptional()
  entityAssignments?: any[];
}
