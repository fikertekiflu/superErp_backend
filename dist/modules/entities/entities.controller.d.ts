import { EntitiesService } from './entities.service';
import { CreateEntityDto } from './dto/create-entity.dto';
import { UpdateEntityDto } from './dto/update-entity.dto';
import { CreateEntityDataDto, UpdateEntityDataDto } from './dto/create-entity-data.dto';
export declare class EntitiesController {
    private readonly entitiesService;
    constructor(entitiesService: EntitiesService);
    private authFromRequest;
    create(createEntityDto: CreateEntityDto, req: any): Promise<import("./entity.entity").Entity>;
    findAll(req: any): Promise<import("./entity.entity").Entity[]>;
    findBySlug(slug: string, req: any): Promise<import("./entity.entity").Entity>;
    findDataById(dataId: string, req: any): Promise<import("./entity-data.entity").EntityData>;
    updateData(dataId: string, updateEntityDataDto: UpdateEntityDataDto, req: any): Promise<import("./entity-data.entity").EntityData>;
    findOne(id: string, req: any): Promise<import("./entity.entity").Entity>;
    update(id: string, updateEntityDto: UpdateEntityDto, req: any): Promise<import("./entity.entity").Entity>;
    remove(id: string, req: any): Promise<void>;
    createData(id: string, createEntityDataDto: CreateEntityDataDto, req: any): Promise<import("./entity-data.entity").EntityData>;
    findAllData(id: string, req: any): Promise<import("./entity-data.entity").EntityData[]>;
    removeData(dataId: string, req: any): Promise<void>;
    searchData(id: string, query: string, req: any): Promise<import("./entity-data.entity").EntityData[]>;
    getStats(id: string, req: any): Promise<{
        totalRecords: number;
        recentRecords: number;
        entityId: string;
    }>;
    getInsights(id: string, req: any): Promise<{
        entityId: string;
        entityName: string;
        totalRecords: number;
        recentRecords: number;
        recordsByDay: {
            date: string;
            label: string;
            count: number;
        }[];
        fieldBreakdown: {
            name: string;
            total: number;
        } | null;
    }>;
}
