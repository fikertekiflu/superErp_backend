"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateWorkflowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_workflow_dto_1 = require("./create-workflow.dto");
class UpdateWorkflowDto extends (0, swagger_1.PartialType)(create_workflow_dto_1.CreateWorkflowDto) {
}
exports.UpdateWorkflowDto = UpdateWorkflowDto;
//# sourceMappingURL=update-workflow.dto.js.map