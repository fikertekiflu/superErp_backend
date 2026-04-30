import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { CreateEntityDataDto, UpdateEntityDataDto } from './dto/create-entity-data.dto';
export declare class EntitiesController {
    private readonly entitiesService;
    constructor(entitiesService: EntitiesService);
    create(createEntityDto: CreateEntityDto, req: any): Promise<import("./entity.entity").Entity>;
    findAll(req: any): Promise<import("./entity.entity").Entity[]>;
    findOne(id: string, req: any): Promise<import("./entity.entity").Entity>;
    findBySlug(slug: string, req: any): Promise<import("./entity.entity").Entity>;
    update(id: string, updateEntityDto: UpdateEntityDto, req: any): Promise<import("./entity.entity").Entity>;
    remove(id: string, req: any): Promise<void>;
    createData(id: string, createEntityDataDto: CreateEntityDataDto, req: any): Promise<import("./entity-data.entity").EntityData>;
    findAllData(id: string, req: any): Promise<import("./entity-data.entity").EntityData[]>;
    findDataById(dataId: string, req: any): Promise<import("./entity-data.entity").EntityData>;
    updateData(dataId: string, updateEntityDataDto: UpdateEntityDataDto, req: any): Promise<import("./entity-data.entity").EntityData>;
    removeData(id: string, dataId: string, req: any): Promise<void>;
    searchData(id: string, searchQuery: any, req: any): Promise<import("./entity-data.entity").EntityData[]>;
    getStats(id: string, req: any): Promise<any>;
}
