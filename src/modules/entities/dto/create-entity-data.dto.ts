import { IsObject, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class CreateEntityDataDto {
  @ApiProperty({
    example: 'uuid',
    description: 'ID of the entity this data belongs to',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiProperty({ example: { name: 'John Doe', email: 'john@example.com' } })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  metadata?: Record<string, any>;
}

export class UpdateEntityDataDto extends PartialType(CreateEntityDataDto) {}
