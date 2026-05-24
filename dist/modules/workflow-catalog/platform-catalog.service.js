"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformCatalogService = void 0;
const common_1 = require("@nestjs/common");
const platform_catalog_config_1 = require("../../common/catalog/platform-catalog.config");
const workflow_template_definitions_1 = require("../../common/catalog/workflow-template-definitions");
let PlatformCatalogService = class PlatformCatalogService {
    getOnboardingRecommendations(industry, domain) {
        const profile = (0, platform_catalog_config_1.getIndustryProfile)(industry || 'other');
        const domainBlueprint = (0, platform_catalog_config_1.inferBlueprintFromDomain)(domain);
        const suggestedBlueprintId = domainBlueprint ?? profile.defaultBlueprintId;
        const blueprintOptions = platform_catalog_config_1.BLUEPRINT_OPTIONS.map((bp) => ({
            ...bp,
            isSuggested: profile.suggestedBlueprintIds.includes(bp.id),
            isDefault: bp.id === suggestedBlueprintId,
            isDomainMatch: domainBlueprint === bp.id,
        }));
        const suggestedWorkflows = profile.suggestedWorkflowCatalogKeys
            .map((key) => workflow_template_definitions_1.WORKFLOW_TEMPLATE_DEFINITIONS.find((t) => t.id === key))
            .filter((t) => Boolean(t))
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
};
exports.PlatformCatalogService = PlatformCatalogService;
exports.PlatformCatalogService = PlatformCatalogService = __decorate([
    (0, common_1.Injectable)()
], PlatformCatalogService);
//# sourceMappingURL=platform-catalog.service.js.map