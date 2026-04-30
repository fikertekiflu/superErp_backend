export const jwtConfig = {
  secret: process.env.JWT_SECRET || 'super-secret-key-123',
  expiresIn: '24h',
};
