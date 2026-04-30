import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompanyRegisterDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@company.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Acme Corporation' })
  @IsString()
  @IsNotEmpty()
  companyName: string;

  @ApiProperty({ example: 'acme' })
  @IsString()
  @IsNotEmpty()
  companyDomain: string;

  @ApiProperty({
    example: 'Enterprise resource planning for Acme',
    required: false,
  })
  @IsString()
  @IsOptional()
  companyDescription?: string;

  @ApiProperty({
    example: 'professional',
    required: false,
  })
  @IsString()
  @IsOptional()
  plan?: string;
}
