"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEntityDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_entity_dto_1 = require("./create-entity.dto");
class UpdateEntityDto extends (0, swagger_1.PartialType)(create_entity_dto_1.CreateEntityDto) {
}
exports.UpdateEntityDto = UpdateEntityDto;
//# sourceMappingURL=update-entity.dto.js.map