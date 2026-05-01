"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HrmController = void 0;
const common_1 = require("@nestjs/common");
const hrm_service_1 = require("./hrm.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
let HrmController = class HrmController {
    hrmService;
    constructor(hrmService) {
        this.hrmService = hrmService;
    }
    findAll(req) {
        return this.hrmService.findAll(req.user.tenantId);
    }
    findOne(id, req) {
        return this.hrmService.findOne(id, req.user.tenantId);
    }
    create(req, data) {
        return this.hrmService.create(req.user.tenantId, data);
    }
    update(id, req, data) {
        return this.hrmService.update(id, req.user.tenantId, data);
    }
    remove(id, req) {
        return this.hrmService.remove(id, req.user.tenantId);
    }
    findAllDepartments(req) {
        return this.hrmService.findAllDepartments(req.user.tenantId);
    }
    createDepartment(req, data) {
        return this.hrmService.createDepartment(req.user.tenantId, data);
    }
    removeDepartment(id, req) {
        return this.hrmService.removeDepartment(id, req.user.tenantId);
    }
    findAllPositions(req) {
        return this.hrmService.findAllPositions(req.user.tenantId);
    }
    createPosition(req, data) {
        return this.hrmService.createPosition(req.user.tenantId, data);
    }
    removePosition(id, req) {
        return this.hrmService.removePosition(id, req.user.tenantId);
    }
};
exports.HrmController = HrmController;
__decorate([
    (0, common_1.Get)('employees'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)('employees'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)('employees/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('departments'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "findAllDepartments", null);
__decorate([
    (0, common_1.Post)('departments'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "createDepartment", null);
__decorate([
    (0, common_1.Delete)('departments/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "removeDepartment", null);
__decorate([
    (0, common_1.Get)('positions'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "findAllPositions", null);
__decorate([
    (0, common_1.Post)('positions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "createPosition", null);
__decorate([
    (0, common_1.Delete)('positions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], HrmController.prototype, "removePosition", null);
exports.HrmController = HrmController = __decorate([
    ApiTags('hrm'),
    (0, common_1.Controller)('hrm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [hrm_service_1.HrmService])
], HrmController);
function ApiTags(name) {
    return (target) => { };
}
//# sourceMappingURL=hrm.controller.js.map