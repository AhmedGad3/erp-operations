# 📊 تقرير تحليل Backend - Mega Build Construction

## 🎯 معلومات عامة

- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB (Mongoose)
- **Port**: `3000` (default, configurable via `process.env.PORT`)
- **Base URL**: `http://localhost:3000` (أو حسب الـ PORT المحدد)
- **Authentication**: JWT (Bearer Token)
- **Validation**: class-validator + class-transformer
- **i18n**: nestjs-i18n (دعم العربية والإنجليزية)
- **File Upload**: Multer (للملفات)
- **Cloud Storage**: Cloudinary

---

## 🔐 نظام Authentication

### **نوع الـ Authentication:**
- **JWT (JSON Web Token)**
- **Token Format**: `Bearer {token}`
- **Token Expiry**: `1 day` (24 ساعة)
- **Token Secret**: `process.env.JWT_SECRET`

### **Auth Flow:**

#### 1. **Signup Process (خطوتين):**
   - **Step 1**: `POST /auth/signup` - طلب OTP
   - **Step 2**: `POST /auth/verify-signup` - التحقق من OTP وإنشاء الحساب

#### 2. **Login Process (خطوتين):**
   - **Step 1**: `POST /auth/login` - طلب OTP
   - **Step 2**: `POST /auth/verify-login` - التحقق من OTP والحصول على Token

### **Guards & Decorators:**
- `@Auth('admin')` - يتطلب authentication + role
- `@Public()` - يجعل الـ route عام (لا يحتاج auth)
- **AuthGuard**: يتحقق من JWT token
- **RoleGuard**: يتحقق من الـ role

### **User Roles:**
```typescript
enum UserRoles {
  USER = 'user',
  ADMIN = 'admin',
  MANAGER = 'manager',
  ACCOUNTANT = 'accountant'
}
```

---

## 📡 API Endpoints

### 🔹 **Authentication Endpoints**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/auth/signup` | ✅ Admin | طلب OTP للتسجيل | `{ name, email }` | `{ message: string }` |
| POST | `/auth/verify-signup` | ❌ | التحقق من OTP وإنشاء حساب | `{ name, email, password, code }` | `{ message: string, data: User }` |
| POST | `/auth/login` | ❌ | طلب OTP للدخول | `{ email }` | `{ message: string }` |
| POST | `/auth/verify-login` | ❌ | التحقق من OTP والدخول | `{ email, code }` | `{ message: string, token: string }` |

---

### 🔹 **User Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/create-user` | ✅ Admin | إنشاء مستخدم جديد | `{ name, email, password, role? }` | `{ message: { result, message } }` |

---

### 🔹 **Clients Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/clients` | ✅ Admin | إنشاء عميل جديد | `CreateClientDto` | `{ result: Client, message: string }` |
| GET | `/admin/clients` | ✅ Admin | جلب جميع العملاء | - | `{ result: Client[], message: string }` |
| GET | `/admin/clients/search?q={term}` | ✅ Admin | البحث عن عملاء | - | `{ result: Client[], message: string }` |
| GET | `/admin/clients/:id` | ✅ Admin | جلب عميل محدد | - | `{ result: Client, message: string }` |
| PUT | `/admin/clients/:id` | ✅ Admin | تحديث عميل | `UpdateClientDto` | `{ result: Client, message: string }` |
| PATCH | `/admin/clients/:id/activate` | ✅ Admin | تفعيل/إلغاء تفعيل عميل | - | `{ result: Client, message: string }` |
| DELETE | `/admin/clients/:id` | ✅ Admin | حذف عميل | - | `{ message: string }` |

**Client DTO:**
```typescript
CreateClientDto {
  nameAr: string;           // required
  nameEn: string;           // required
  code: string;             // required, unique, uppercase
  phone?: string;
  address?: string;
  email?: string;
  taxNumber?: string;
  commercialRegister?: string;
  type?: ClientType;        // INDIVIDUAL | COMPANY
  notes?: string;
}
```

---

### 🔹 **Suppliers Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/suppliers` | ✅ Admin | إنشاء مورد جديد | `CreateSupplierDto` | `{ result: Supplier, message: string }` |
| GET | `/admin/suppliers` | ✅ Admin | جلب جميع الموردين | - | `{ result: Supplier[], message: string }` |
| GET | `/admin/suppliers/search?q={term}` | ✅ Admin | البحث عن موردين | - | `{ result: Supplier[], message: string }` |
| GET | `/admin/suppliers/:id` | ✅ Admin | جلب مورد محدد | - | `{ result: Supplier, message: string }` |
| PUT | `/admin/suppliers/:id` | ✅ Admin | تحديث مورد | `UpdateSupplierDto` | `{ result: Supplier, message: string }` |
| PATCH | `/admin/suppliers/:id/activate` | ✅ Admin | تفعيل/إلغاء تفعيل مورد | - | `{ result: Supplier, message: string }` |
| DELETE | `/admin/suppliers/:id` | ✅ Admin | حذف مورد | - | `{ message: string }` |

**Supplier DTO:**
```typescript
CreateSupplierDto {
  nameAr: string;           // required, max 100
  nameEn: string;           // required, max 100
  code: string;             // required, unique, uppercase, max 20
  address?: string;
  phone?: string;
  email?: string;
  notes?: string;
}
```

---

### 🔹 **Projects Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/projects` | ✅ Admin | إنشاء مشروع جديد | `CreateProjectDto` | `{ result: Project, message: string }` |
| GET | `/admin/projects` | ✅ Admin | جلب جميع المشاريع | - | `{ result: Project[], message: string }` |
| GET | `/admin/projects/search?q={term}` | ✅ Admin | البحث عن مشاريع | - | `{ result: Project[], message: string }` |
| GET | `/admin/projects/status/:status` | ✅ Admin | جلب مشاريع حسب الحالة | - | `{ result: Project[], message: string }` |
| GET | `/admin/projects/client/:clientId` | ✅ Admin | جلب مشاريع عميل محدد | - | `{ result: Project[], message: string }` |
| GET | `/admin/projects/client/:clientId/stats` | ✅ Admin | إحصائيات مشاريع عميل | - | `{ result: Stats, message: string }` |
| GET | `/admin/projects/:id` | ✅ Admin | جلب مشروع محدد | - | `{ result: Project, message: string }` |
| GET | `/admin/projects/:id/stats` | ✅ Admin | إحصائيات مشروع | - | `{ result: Stats, message: string }` |
| PUT | `/admin/projects/:id` | ✅ Admin | تحديث مشروع | `UpdateProjectDto` | `{ result: Project, message: string }` |
| PATCH | `/admin/projects/:id/equipment-costs/add` | ✅ Admin | إضافة تكاليف معدات | `UpdateEquipmentCostsDto` | `{ result: Project, message: string }` |
| PATCH | `/admin/projects/:id/labor-costs` | ✅ Admin | تحديث تكاليف العمالة | `UpdateLaborCostsDto` | `{ result: Project, message: string }` |
| PATCH | `/admin/projects/:id/activate` | ✅ Admin | تفعيل/إلغاء تفعيل مشروع | - | `{ result: Project, message: string }` |
| DELETE | `/admin/projects/:id` | ✅ Admin | حذف مشروع | - | `{ message: string }` |

**Project DTO:**
```typescript
CreateProjectDto {
  nameAr: string;                    // required
  nameEn: string;                    // required
  code: string;                      // required, unique, uppercase, 3-20 chars, A-Z0-9-
  clientId: ObjectId;                // required
  projectManager?: string;
  siteEngineer?: string;
  location?: string;
  startDate: string;                  // ISO date string, required
  expectedEndDate?: string;           // ISO date string
  contractAmount: number;            // required, min 0
  laborDetails?: {                    // optional
    numberOfWorkers: number;          // min 0
    monthlyCost: number;             // min 0
    numberOfMonths: number;          // min 0
    notes?: string;
  };
  otherCosts?: number;               // min 0
  status?: ProjectStatus;            // PLANNED | IN_PROGRESS | ON_HOLD | COMPLETED | CANCELLED | CLOSED
  notes?: string;
}
```

**Project Status:**
```typescript
enum ProjectStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED'
}
```

---

### 🔹 **Materials Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/materials` | ✅ Admin | إنشاء مادة جديدة | `CreateMaterialDto` | `{ result: Material, message: string }` |
| GET | `/admin/materials` | ✅ Admin | جلب جميع المواد | - | `{ result: Material[], message: string }` |
| GET | `/admin/materials/main-categories` | ✅ Admin | جلب الفئات الرئيسية | - | `{ result: string[], message: string }` |
| GET | `/admin/materials/sub-categories?main-category={cat}&sub-category={sub}` | ✅ Admin | جلب المواد حسب الفئة | - | `{ result: Material[], message: string }` |
| GET | `/admin/materials/search?q={term}` | ✅ Admin | البحث عن مواد | - | `{ result: Material[], message: string }` |
| GET | `/admin/materials/:id` | ✅ Admin | جلب مادة محددة | - | `{ result: Material, message: string }` |
| PUT | `/admin/materials/:id` | ✅ Admin | تحديث مادة | `UpdateMaterialDto` | `{ result: Material, message: string }` |
| PATCH | `/admin/materials/:id/activate` | ✅ Admin | تفعيل/إلغاء تفعيل مادة | - | `{ result: Material, message: string }` |
| DELETE | `/admin/materials/:id` | ✅ Admin | حذف مادة | - | `{ result: Material, message: string }` |

**Material DTO:**
```typescript
CreateMaterialDto {
  nameAr: string;                    // required
  nameEn: string;                    // required
  code: string;                      // required, unique, uppercase, 3-20 chars, A-Z0-9-
  mainCategory: MainCategory;        // required, enum
  subCategory: string;               // required
  baseUnit: string;                   // ObjectId, required
  alternativeUnits?: AlternativeUnitDto[];  // optional
  minLevelStock?: number;            // min 0
  lastPurchasedPrice?: number;       // min 0
  lastPurchasedDate?: string;         // ISO date string
  description?: string;
}

AlternativeUnitDto {
  unitId: string;                    // ObjectId, required
  conversionFactor: number;          // required, min 0.000001
  isDefaultPurchase?: boolean;       // default false
  isDefaultIssue?: boolean;         // default false
}
```

**Main Categories:**
```typescript
enum MainCategory {
  CONSTRUCTION_MATERIALS = "Construction-Materials",
  MEP = "Mechanical-Electrical-Plumbing",
  FINISHING_MATERIALS = "Finishing-Materials",
  TOOLS_EQUIPMENT = "Tools-Equipment",
  SAFETY_LOGISTICS = "Safety-Site-Logistics",
  ADMIN_SUPPLIES = "Administrative-Operational-Supplies",
  VEHICLES_TRANSPORT = "Vehicles-Transport",
  FURNITURE = "Furniture",
  FURNISHING_MATERIALS = "Furnishing-Materials",
  CONSUMABLES = "Consumables",
  OFFICE_EQUIPMENT = "Office-Equipment",
  OTHERS = "Others"
}
```

---

### 🔹 **Units Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/units` | ✅ Admin | إنشاء وحدة جديدة | `CreateUnitDto` | `{ result: Unit, message: string }` |
| GET | `/admin/units` | ✅ Admin | جلب جميع الوحدات | `?category={category}` | `{ result: Unit[], message: string }` |
| GET | `/admin/units/base` | ✅ Admin | جلب الوحدات الأساسية | - | `{ result: Unit[], message: string }` |
| GET | `/admin/units/dropdown?category={cat}` | ✅ Admin | جلب وحدات للقائمة المنسدلة | - | `{ result: Unit[], message: string }` |
| GET | `/admin/units/search?q={term}` | ✅ Admin | البحث عن وحدات | - | `{ result: Unit[], message: string }` |
| POST | `/admin/units/convert` | ✅ Admin | تحويل بين وحدات | `ConvertUnitDto` | `{ result: number, message: string }` |
| GET | `/admin/units/:id` | ✅ Admin | جلب وحدة محددة | - | `{ result: Unit, message: string }` |
| GET | `/admin/units/:id/derived` | ✅ Admin | جلب الوحدات المشتقة | - | `{ result: Unit[], message: string }` |
| PUT | `/admin/units/:id` | ✅ Admin | تحديث وحدة | `UpdateUnitDto` | `{ result: Unit, message: string }` |
| PATCH | `/admin/units/:id/activate` | ✅ Admin | تفعيل/إلغاء تفعيل وحدة | - | `{ result: Unit, message: string }` |
| DELETE | `/admin/units/:id` | ✅ Admin | حذف وحدة | - | `{ message: string }` |

**Unit Categories:**
```typescript
enum UnitCategory {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  LENGTH = 'length',
  AREA = 'area',
  COUNT = 'count'
}
```

---

### 🔹 **Purchases Management**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/purchases` | ✅ Admin | إنشاء فاتورة شراء | `CreatePurchaseDto` | `{ result: PurchaseInvoice, message: string }` |
| POST | `/admin/purchases/return` | ✅ Admin | إنشاء إرجاع شراء | `CreatePurchaseReturnDto` | `{ result: PurchaseReturn, message: string }` |
| GET | `/admin/purchases` | ✅ Admin | جلب جميع فواتير الشراء | - | `{ result: PurchaseInvoice[], message: string }` |
| GET | `/admin/purchases/supplier/:supplierId` | ✅ Admin | جلب فواتير مورد محدد | - | `{ result: PurchaseInvoice[], message: string }` |
| GET | `/admin/purchases/supplier/:supplierId/open` | ✅ Admin | جلب الفواتير المفتوحة لمورد | - | `{ result: PurchaseInvoice[], message: string }` |
| GET | `/admin/purchases/:id` | ✅ Admin | جلب فاتورة شراء محددة | - | `{ invoice: PurchaseInvoice, message: string }` |

**Purchase DTO:**
```typescript
CreatePurchaseDto {
  supplierId: ObjectId;               // required
  invoiceDate: string;                // ISO date string, required
  supplierInvoiceNo?: string;
  creditDays?: number;                // min 0
  items: PurchaseItemDto[];          // required, min 1 item
  notes?: string;
}

PurchaseItemDto {
  materialId: ObjectId;               // required
  unitId: ObjectId;                   // required
  quantity: number;                   // required, min 0.0001
  unitPrice: number;                   // required, min 0
}
```

---

### 🔹 **Supplier Payments**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/supplier/payments` | ✅ Admin | إنشاء دفعة لمورد | `CreatePaymentDto` | `{ result: Payment, message: string }` |
| POST | `/admin/supplier/payments/refund` | ✅ Admin | إنشاء استرداد لمورد | `CreateSupplierRefundDto` | `{ refundedPayment: Refund, message: string }` |
| GET | `/admin/supplier/payments` | ✅ Admin | جلب جميع الدفعات | - | `{ result: Payment[], message: string }` |
| GET | `/admin/supplier/payments/supplier/:supplierId` | ✅ Admin | جلب دفعات مورد محدد | - | `{ result: Payment[], message: string }` |
| GET | `/admin/supplier/payments/:id` | ✅ Admin | جلب دفعة محددة | - | `{ result: Payment, message: string }` |

**Payment DTO:**
```typescript
CreatePaymentDto {
  supplierId: ObjectId;               // required
  amount: number;                    // required, min 0.01
  method: PaymentMethod;              // required, enum: CASH | TRANSFER | CHEQUE
  transferRef?: string;              // required if method = TRANSFER
  chequeNo?: string;                 // required if method = CHEQUE
  paymentDate: string;                // ISO date string, required
  notes?: string;
}

PaymentMethod {
  CASH = 'CASH',
  TRANSFER = 'TRANSFER',
  CHEQUE = 'CHEQUE'
}
```

---

### 🔹 **Client Payments**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/projects/payments` | ✅ Admin | إنشاء دفعة من عميل | `CreateClientPaymentDto` | `{ result: ClientPayment, message: string }` |
| GET | `/admin/projects/payments` | ✅ Admin | جلب جميع دفعات العملاء | - | `{ result: ClientPayment[], message: string }` |
| GET | `/admin/projects/payments/project/:projectId` | ✅ Admin | جلب دفعات مشروع محدد | - | `{ result: ClientPayment[], message: string }` |
| GET | `/admin/projects/payments/client/:clientId` | ✅ Admin | جلب دفعات عميل محدد | - | `{ result: ClientPayment[], message: string }` |
| GET | `/admin/projects/payments/:id` | ✅ Admin | جلب دفعة محددة | - | `{ result: ClientPayment, message: string }` |

**Client Payment DTO:**
```typescript
CreateClientPaymentDto {
  projectId: ObjectId;               // required
  totalAmount: number;                // required, min 0.01
  contractPayment: number;            // required, min 0
  additionalPayment: number;         // required, min 0
  method: PaymentMethod;              // required, enum: CASH | TRANSFER | CHEQUE
  transferRef?: string;              // required if method = TRANSFER
  chequeNo?: string;                 // required if method = CHEQUE
  paymentDate: string;                // ISO date string, required
  notes?: string;
}
```

---

### 🔹 **Material Issues (Transfer Orders)**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/projects/material-issue` | ✅ Admin | إنشاء إصدار مواد لمشروع | `CreateMaterialIssueDto` | `{ result: MaterialIssue, message: string }` |
| GET | `/admin/projects/material-issue` | ✅ Admin | جلب جميع إصدارات المواد | - | `{ result: MaterialIssue[], message: string }` |
| GET | `/admin/projects/material-issue/project/:projectId` | ✅ Admin | جلب إصدارات مشروع محدد | - | `{ result: MaterialIssue[], message: string }` |
| GET | `/admin/projects/material-issue/client/:clientId` | ✅ Admin | جلب إصدارات عميل محدد | - | `{ result: MaterialIssue[], message: string }` |
| GET | `/admin/projects/material-issue/:id` | ✅ Admin | جلب إصدار محدد | - | `{ result: MaterialIssue, message: string }` |

**Material Issue DTO:**
```typescript
CreateMaterialIssueDto {
  projectId: ObjectId;               // required
  issueDate: string;                 // ISO date string, required
  items: MaterialIssueItemDto[];     // required, min 1 item
  notes?: string;
}

MaterialIssueItemDto {
  materialId: ObjectId;             // required
  unitId: ObjectId;                 // required
  quantity: number;                 // required, min 0.0001
  unitPrice: number;                 // required, min 0
}
```

---

### 🔹 **Stock Movements**

| Method | Path | Auth Required | Description | Request Body | Response |
|--------|------|---------------|-------------|--------------|----------|
| POST | `/admin/stock-movement/adjustment` | ✅ Admin | إنشاء تعديل مخزون | `CreateAdjustmentDto` | `{ result: StockAdjustment, message: string }` |

**Adjustment DTO:**
```typescript
CreateAdjustmentDto {
  materialId: ObjectId;             // required
  unitId: ObjectId;                  // required
  actualQuantity: number;            // required, min 0
  reason: string;                   // required
}
```

---

### 🔹 **Ledgers**

#### **Client Ledger**

| Method | Path | Auth Required | Description | Response |
|--------|------|---------------|-------------|----------|
| GET | `/admin/ledger/clients` | ✅ Admin | جلب جميع سجلات العملاء | `{ result: ClientLedger[], message: string }` |
| GET | `/admin/ledger/clients/:clientId` | ✅ Admin | جلب سجل عميل محدد | `{ result: ClientLedger[], message: string }` |
| GET | `/admin/ledger/clients/:clientId/total-balance` | ✅ Admin | الرصيد الإجمالي للعميل | `{ result: { totalBalance: number }, message: string }` |
| GET | `/admin/ledger/clients/:clientId/breakdown` | ✅ Admin | تفصيل رصيد العميل | `{ result: Breakdown, message: string }` |
| GET | `/admin/ledger/clients/:clientId/project/:projectId/balance` | ✅ Admin | رصيد مشروع محدد لعميل | `{ result: { amountDue: number }, message: string }` |

#### **Supplier Ledger**

| Method | Path | Auth Required | Description | Response |
|--------|------|---------------|-------------|----------|
| GET | `/admin/ledger/supplier` | ✅ Admin | جلب جميع سجلات الموردين | `{ result: SupplierLedger[], message: string }` |
| GET | `/admin/ledger/supplier/:supplierId` | ✅ Admin | جلب سجل مورد محدد | `{ result: SupplierLedger[], message: string }` |
| GET | `/admin/ledger/supplier/:supplierId/balance` | ✅ Admin | رصيد مورد محدد | `{ result: { amountDue: number }, message: string }` |

---

### 🔹 **Reports**

#### **Supplier Statement**

| Method | Path | Auth Required | Description | Query Params | Response |
|--------|------|---------------|-------------|--------------|----------|
| GET | `/admin/reports/supplier-statement` | ✅ Admin | كشف حساب جميع الموردين | `?startDate={date}&endDate={date}` | `{ result: Statement[], message: string }` |
| GET | `/admin/reports/supplier-statement/:supplierId` | ✅ Admin | كشف حساب مورد محدد | `?startDate={date}&endDate={date}` | `{ result: Statement, message: string }` |

---

## 📦 Data Models (TypeScript Interfaces)

### **User**
```typescript
interface User {
  _id: ObjectId;
  name: string;                    // min 3 chars
  email: string;                    // unique
  password: string;                 // hashed, min 6 chars
  role: UserRoles;                  // user | admin | manager | accountant
  createdAt: Date;
  updatedAt: Date;
}
```

### **Client**
```typescript
interface Client {
  _id: ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;                     // unique, uppercase
  phone?: string;
  address?: string;
  email?: string;
  taxNumber?: string;
  commercialRegister?: string;
  type: ClientType;                 // INDIVIDUAL | COMPANY
  notes?: string;
  isActive: boolean;                // default true
  createdBy: ObjectId;              // User reference
  updatedBy?: ObjectId;              // User reference
  createdAt: Date;
  updatedAt: Date;
  projects?: Project[];            // virtual populate
}
```

### **Supplier**
```typescript
interface Supplier {
  _id: ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;                     // unique, uppercase
  phone?: string;
  email?: string;
  address?: string;
  defaultCreditDays: number;        // default 30, min 0
  taxId?: string;
  commercialRegister?: string;
  bankAccount?: string;
  notes?: string;
  isActive: boolean;                // default true
  createdBy: ObjectId;              // User reference
  updatedBy?: ObjectId;             // User reference
  createdAt: Date;
  updatedAt: Date;
}
```

### **Project**
```typescript
interface Project {
  _id: ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;                     // unique, uppercase
  clientId: ObjectId;               // Client reference
  projectManager?: string;
  siteEngineer?: string;
  location?: string;
  startDate: Date;
  expectedEndDate?: Date;
  actualEndDate?: Date;
  
  // Financial
  contractAmount: number;           // min 0
  totalPaid: number;                // default 0, min 0
  totalInvoiced: number;             // default 0, min 0
  
  // Costs
  materialCosts: number;             // default 0, min 0
  laborCosts: number;                // default 0, min 0
  equipmentCosts: number;            // default 0, min 0
  otherCosts: number;                // default 0, min 0
  totalCosts: number;                // default 0, min 0
  
  // Labor Details
  laborDetails?: {
    numberOfWorkers: number;        // default 0, min 0
    monthlyCost: number;             // default 0, min 0
    numberOfMonths: number;          // default 0, min 0
    totalCost: number;               // default 0, min 0
    notes?: string;
  };
  
  status: ProjectStatus;             // default PLANNED
  notes?: string;
  isActive: boolean;                 // default true
  createdBy: ObjectId;               // User reference
  updatedBy?: ObjectId;              // User reference
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  contractRemaining: number;         // contractAmount - totalPaid
  expectedProfit: number;            // contractAmount - totalCosts
  realizedProfit: number;            // totalPaid - totalCosts
  completionPercentage: number;      // (totalPaid / contractAmount) * 100
  profitMargin: number;              // (expectedProfit / contractAmount) * 100
  realizedProfitMargin: number;      // (realizedProfit / totalPaid) * 100
}
```

### **Material**
```typescript
interface Material {
  _id: ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;                      // unique, uppercase
  mainCategory: MainCategory;        // enum
  subCategory: string;
  baseUnit: ObjectId;                // Unit reference
  alternativeUnits: MaterialUnit[]; // array
  currentStock: number;              // default 0, min 0
  minStockLevel: number;             // default 0, min 0
  lastPurchasePrice: number;         // default 0, min 0
  lastPurchaseDate?: Date;
  description?: string;
  isActive: boolean;                  // default true
  createdBy: ObjectId;               // User reference
  updatedBy?: ObjectId;              // User reference
  createdAt: Date;
  updatedAt: Date;
}

interface MaterialUnit {
  unitId: ObjectId;                  // Unit reference
  conversionFactor: number;          // min 0.000001
  isDefaultPurchase: boolean;        // default false
  isDefaultIssue: boolean;           // default false
}
```

### **Unit**
```typescript
interface Unit {
  _id: ObjectId;
  nameAr: string;
  nameEn: string;
  code: string;                      // unique, uppercase
  symbol: string;
  category: UnitCategory;            // enum: weight | volume | length | area | count
  description?: string;
  conversionFactor: number;          // default 1
  isBase: boolean;                   // default false
  baseUnitId?: ObjectId;             // Unit reference (if derived)
  isActive: boolean;                 // default true
  createdBy: ObjectId;               // User reference
  updatedBy?: ObjectId;              // User reference
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔄 Response Structure

### **Success Response:**
```typescript
{
  result: T | T[],                  // البيانات الفعلية
  message: string                   // رسالة مترجمة (ar/en)
}
```

### **Error Response:**
```typescript
{
  statusCode: number;               // 400, 401, 403, 404, 500, etc.
  message: string | string[];        // رسالة الخطأ
  error?: string;                   // نوع الخطأ
}
```

### **Common Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (Validation Error)
- `401` - Unauthorized (Invalid/Missing Token)
- `403` - Forbidden (Insufficient Permissions)
- `404` - Not Found
- `409` - Conflict (Duplicate Entry)
- `500` - Internal Server Error

---

## 🔒 Security Features

### **Authentication:**
- JWT Bearer Token
- Token expiry: 1 day
- Automatic token validation via `AuthGuard`
- Token stored in `Authorization` header: `Bearer {token}`

### **Authorization:**
- Role-based access control (RBAC)
- `@Auth('admin')` decorator for role checking
- `RoleGuard` validates user roles

### **Validation:**
- `class-validator` for DTO validation
- `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`
- Automatic validation error responses

### **Password Security:**
- Bcrypt hashing
- Strong password requirements (min 8 chars, uppercase, lowercase, numbers, symbols)

---

## 🌐 Internationalization (i18n)

- **Supported Languages**: Arabic (ar), English (en)
- **Default Language**: Arabic (ar)
- **Language Detection**:
  - Query parameter: `?lang=ar` or `?lang=en`
  - Header: `x-lang: ar` or `x-lang: en`
  - Accept-Language header

### **Translation Files:**
- Located in: `src/i18n/{lang}/`
- Files: `clients.json`, `suppliers.json`, `projects.json`, `materials.json`, `units.json`, `purchases.json`, `payments.json`, `ledger.json`, `reports.json`

---

## 📝 Important Notes

### **1. Request Headers:**
```typescript
{
  "Authorization": "Bearer {token}",    // Required for protected routes
  "Content-Type": "application/json",     // For JSON requests
  "x-lang": "ar" | "en"                  // Optional: language preference
}
```

### **2. Date Format:**
- All dates should be sent as **ISO 8601 strings**: `"2024-01-15T10:30:00.000Z"`
- Or simple date: `"2024-01-15"`

### **3. ObjectId Format:**
- MongoDB ObjectIds as strings: `"507f1f77bcf86cd799439011"`

### **4. Code Format:**
- All codes (Client, Supplier, Project, Material, Unit) are:
  - **Uppercase**
  - **Unique**
  - **3-20 characters**
  - **Alphanumeric + hyphens only**: `A-Z0-9-`

### **5. Search Endpoints:**
- Search parameter: `?q={searchTerm}`
- Case-insensitive search
- Searches in nameAr, nameEn, and code fields

### **6. Activation Endpoints:**
- `PATCH /resource/:id/activate` - Toggles `isActive` field
- Used for soft delete/restore functionality

### **7. Virtual Fields:**
- Project virtuals (contractRemaining, expectedProfit, etc.) are calculated automatically
- Included in JSON responses when using `.toJSON()` or `.toObject()`

### **8. Pagination:**
- **Not implemented** in current version
- All GET endpoints return full arrays

### **9. File Uploads:**
- Multer configured for file uploads
- Cloudinary integration available
- No specific file upload endpoints found in current controllers

### **10. CORS:**
- CORS package installed but not explicitly configured in `main.ts`
- **⚠️ Important**: You may need to enable CORS for frontend:
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
});
```

---

## 🚨 Error Handling

### **Validation Errors:**
```typescript
{
  statusCode: 400,
  message: [
    "nameAr must be a string",
    "code must be unique"
  ],
  error: "Bad Request"
}
```

### **Authentication Errors:**
```typescript
{
  statusCode: 401,
  message: "Invalid or missing bearer token",
  error: "Unauthorized"
}
```

### **Authorization Errors:**
```typescript
{
  statusCode: 403,
  message: "Access denied. Required roles: admin",
  error: "Forbidden"
}
```

### **Not Found Errors:**
```typescript
{
  statusCode: 404,
  message: "User not found",
  error: "Not Found"
}
```

### **Conflict Errors:**
```typescript
{
  statusCode: 409,
  message: "User already exists",
  error: "Conflict"
}
```

---

## 📋 Summary Checklist

### ✅ **Completed Analysis:**
- [x] All API endpoints documented
- [x] Request/Response structures defined
- [x] Data models (TypeScript interfaces) created
- [x] Authentication system analyzed
- [x] Authorization (RBAC) documented
- [x] Validation rules extracted
- [x] Error responses documented
- [x] i18n system documented
- [x] Enums and constants listed

### ⚠️ **Notes for Frontend Implementation:**
1. **CORS**: May need to be enabled on backend
2. **Pagination**: Not implemented - all endpoints return full arrays
3. **File Uploads**: Available but no specific endpoints found
4. **Token Storage**: Store JWT in localStorage or secure storage
5. **Language**: Support Arabic and English via headers/query params
6. **Date Format**: Use ISO 8601 strings for all dates
7. **ObjectId**: Use string format for MongoDB ObjectIds

---

## 🎯 Next Steps

1. ✅ **Backend Analysis Complete** - هذا التقرير
2. ⏭️ **Frontend Setup** - إنشاء مشروع Vite + React + TypeScript
3. ⏭️ **Axios Configuration** - Setup مع interceptors
4. ⏭️ **Authentication System** - Login/Signup flows
5. ⏭️ **Type Definitions** - إنشاء TypeScript interfaces من هذا التقرير
6. ⏭️ **API Services** - إنشاء services لكل resource
7. ⏭️ **React Query Hooks** - Custom hooks للـ data fetching
8. ⏭️ **UI Components** - shadcn/ui components
9. ⏭️ **Pages & Features** - Implementation لكل feature
10. ⏭️ **Testing & Integration** - Testing الربط مع الـ backend

---

**📅 تاريخ التقرير**: اليوم  
**👤 المحلل**: AI Assistant  
**📌 الحالة**: ✅ مكتمل وجاهز للتنفيذ

