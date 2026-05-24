import { Injectable } from '@nestjs/common';
import {
  BLUEPRINT_OPTIONS,
  getIndustryProfile,
  inferBlueprintFromDomain,
} from '../../common/catalog/platform-catalog.config';
import { WORKFLOW_TEMPLATE_DEFINITIONS } from '../../common/catalog/workflow-template-definitions';

@Injectable()
export class PlatformCatalogService {
  getOnboardingRecommendations(industry: string, domain: string) {
    const profile = getIndustryProfile(industry || 'other');
    const domainBlueprint = inferBlueprintFromDomain(domain);
    const suggestedBlueprintId =
      domainBlueprint ?? profile.defaultBlueprintId;

    const blueprintOptions = BLUEPRINT_OPTIONS.map((bp) => ({
      ...bp,
      isSuggested: profile.suggestedBlueprintIds.includes(bp.id),
      isDefault: bp.id === suggestedBlueprintId,
      isDomainMatch: domainBlueprint === bp.id,
    }));

    const suggestedWorkflows = profile.suggestedWorkflowCatalogKeys
      .map((key) => WORKFLOW_TEMPLATE_DEFINITIONS.find((t) => t.id === key))
      .filter((t): t is NonNullable<typeof t> => Boolean(t))
      .map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        icon: t.icon,
        estimatedTime: t.estimatedTime,
      }));

    return {
      industry: industry || 'other',
      domain,
      suggestedBlueprintId,
      suggestedBlueprintIds: profile.suggestedBlueprintIds,
      domainInferredBlueprintId: domainBlueprint,
      suggestedWorkflowCatalogKeys: profile.suggestedWorkflowCatalogKeys,
      suggestedWorkflows,
      blueprints: blueprintOptions,
    };
  }
}
