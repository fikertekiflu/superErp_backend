import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SubmitVerificationDto {
  @IsString()
  @IsNotEmpty()
  legalBusinessName: string;

  @IsString()
  @IsNotEmpty()
  tinNumber: string;

  @IsOptional()
  @IsString()
  businessRegistrationNumber?: string;

  @IsOptional()
  @IsString()
  businessPhone?: string;

  @IsOptional()
  @IsString()
  businessAddress?: string;
}
