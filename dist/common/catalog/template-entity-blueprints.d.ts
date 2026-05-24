import { CreateEntityDto } from '../../modules/entities/dto/create-entity.dto';
export interface TemplateEntityBlueprint {
    slug: string;
    aliases: string[];
    definition: CreateEntityDto;
}
export declare const TEMPLATE_ENTITY_BLUEPRINTS: TemplateEntityBlueprint[];
export declare function findBlueprintForSlug(slug: string): TemplateEntityBlueprint | undefined;
