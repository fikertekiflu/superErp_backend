"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.jwtConfig = void 0;
exports.jwtConfig = {
    secret: process.env.JWT_SECRET || 'super-secret-key-123',
    expiresIn: '24h',
};
//# sourceMappingURL=jwt.config.js.map