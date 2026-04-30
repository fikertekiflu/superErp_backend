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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapaService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let ChapaService = class ChapaService {
    configService;
    secretKey;
    baseUrl = 'https://api.chapa.co/v1';
    constructor(configService) {
        this.configService = configService;
        this.secretKey = this.configService.get('CHAPA_SECRET_KEY') || 'CHASECK_TEST-5k3saekZB6yPqljhDWmunmyKKtbkVQoi';
    }
    async initializeTransaction(data) {
        try {
            console.log('CHAPA INITIALIZE PAYLOAD:', JSON.stringify(data, null, 2));
            const response = await axios_1.default.post(`${this.baseUrl}/transaction/initialize`, {
                ...data,
                customization: {
                    title: 'SuperERP',
                    description: 'ERP Subscription',
                },
            }, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Chapa Initialization Error:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException(error.response?.data?.message || 'Failed to initialize payment with Chapa');
        }
    }
    async verifyTransaction(tx_ref) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/transaction/verify/${tx_ref}`, {
                headers: {
                    Authorization: `Bearer ${this.secretKey}`,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Chapa Verification Error:', error.response?.data || error.message);
            throw new common_1.InternalServerErrorException(error.response?.data?.message || 'Failed to verify payment with Chapa');
        }
    }
};
exports.ChapaService = ChapaService;
exports.ChapaService = ChapaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ChapaService);
//# sourceMappingURL=chapa.service.js.map