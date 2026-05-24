export declare class TenantRegionalSettingsDto {
    timezone?: string;
    currency?: string;
    dateFormat?: string;
    language?: string;
    weekStartsOn?: 'monday' | 'sunday';
}
export declare class TenantNotificationSettingsDto {
    workflowEmails?: boolean;
    taskAssignmentEmails?: boolean;
    approvalRequestEmails?: boolean;
    weeklyDigest?: boolean;
}
export declare class UpdateTenantSettingsDto {
    name?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    regional?: TenantRegionalSettingsDto;
    notifications?: TenantNotificationSettingsDto;
}
