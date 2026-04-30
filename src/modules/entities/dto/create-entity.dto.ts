import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEntityDto {
  @ApiProperty({ example: 'Leads' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'lead', description: 'Internal slug name' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ example: 'Manage business opportunities', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'briefcase', required: false })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isInMenu?: boolean;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  menuOrder?: number;

  @ApiProperty({ isArray: true })
  @IsArray()
  fields: {
    name: string;
    label: string;
    type: string;
    required: boolean;
    unique: boolean;
    options?: string[];
    defaultValue?: any;
    display: {
      order: number;
      showInList: boolean;
      showInForm: boolean;
    };
  }[];

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  config?: any;
}
