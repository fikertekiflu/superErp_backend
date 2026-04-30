# 🛡️ SuperERP Adaptive Backend

The core engine of the SuperERP ecosystem. Built for high-scale multi-tenancy, dynamic business logic, and localized Ethiopian SaaS billing.

## 🚀 Core Technologies
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL with TypeORM
- **Security**: JWT + Custom RBAC (Role-Based Access Control)
- **Payments**: Chapa (Ethiopian ETB Gateway)
- **Documentation**: Swagger UI

## ✨ Key Features
- **Adaptive Entity Builder**: Create dynamic data models on the fly.
- **Workflow Engine**: Automate business logic with a custom zap-style system.
- **SaaS Billing (ETB)**: End-to-end subscription lifecycle with Chapa integration.
- **14-Day Free Trials**: Automatic trial management for Pro/Enterprise tiers.
- **Super Admin Shield**: System-wide oversight and plan management.

## 🛠️ Getting Started

### 1. Installation
```bash
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
DATABASE_URL=postgres://user:password@localhost:5432/supererp
JWT_SECRET=your_ultra_secret_key
CHAPA_SECRET_KEY=CHASECK_TEST-your-key
FRONTEND_URL=http://localhost:3001
BACKEND_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run start:dev
```

## 🔑 Super Admin Setup
To initialize the system overlord account, run this once:
`GET http://localhost:3000/auth/setup-admin`

**Default Credentials:**
- **Email**: `admin@supererp.com`
- **Password**: `admin123456`

## 📊 API Documentation
Once running, visit: `http://localhost:3000/api`
