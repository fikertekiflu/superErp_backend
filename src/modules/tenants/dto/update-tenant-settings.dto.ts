import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class TenantRegionalSettingsDto {
  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  dateFormat?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  weekStartsOn?: 'monday' | 'sunday';
}

export class TenantNotificationSettingsDto {
  @IsOptional()
  workflowEmails?: boolean;

  @IsOptional()
  taskAssignmentEmails?: boolean;

  @IsOptional()
  approvalRequestEmails?: boolean;

  @IsOptional()
  weeklyDigest?: boolean;
}

export class UpdateTenantSettingsDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  companySize?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantRegionalSettingsDto)
  regional?: TenantRegionalSettingsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TenantNotificationSettingsDto)
  notifications?: TenantNotificationSettingsDto;
}
