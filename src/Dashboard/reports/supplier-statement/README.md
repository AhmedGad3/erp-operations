# Supplier Statement Report API

## Overview
يوفر هذا التقرير كشف حساب مفصل للموردين يشمل جميع المعاملات المالية (مشتريات، مدفوعات، مرتجعات).

---

## Endpoints

### 1. Get Single Supplier Statement
**كشف حساب مورد واحد**

```http
GET /admin/reports/supplier-statement/:supplierId
```

#### Parameters:
- **supplierId** (required): معرف المورد
- **startDate** (optional): تاريخ البداية (YYYY-MM-DD)
- **endDate** (optional): تاريخ النهاية (YYYY-MM-DD)

#### Example Request:
```bash
GET /admin/reports/supplier-statement/507f1f77bcf86cd799439011?startDate=2024-01-01&endDate=2024-12-31
```

#### Response Example:
```json
{
  "result": {
    "supplier": {
      "_id": "507f1f77bcf86cd799439011",
      "nameAr": "شركة المواد الإنشائية",
      "nameEn": "Construction Materials Co.",
      "code": "SUP001",
      "phone": "01234567890",
      "email": "supplier@example.com",
      "address": "Cairo, Egypt"
    },
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "openingBalance": 5000,
    "transactions": [
      {
        "transactionNo": 1001,
        "date": "2024-01-15T10:00:00.000Z",
        "type": "purchase",
        "description": "فاتورة شراء رقم 1234",
        "referenceType": "PurchaseInvoice",
        "referenceId": "507f1f77bcf86cd799439012",
        "debit": 10000,
        "credit": 0,
        "balance": 15000,
        "createdBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Ahmed Ali"
        }
      },
      {
        "transactionNo": 1002,
        "date": "2024-01-20T14:30:00.000Z",
        "type": "payment",
        "description": "دفعة نقدية",
        "referenceType": "SupplierPayment",
        "referenceId": "507f1f77bcf86cd799439014",
        "debit": 0,
        "credit": 5000,
        "balance": 10000,
        "createdBy": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Ahmed Ali"
        }
      }
    ],
    "summary": {
      "totalDebit": 10000,
      "totalCredit": 5000,
      "closingBalance": 10000
    }
  },
  "message": "تم إنشاء كشف حساب المورد بنجاح"
}
```

---

### 2. Get All Suppliers Statement
**كشف حساب جميع الموردين**

```http
GET /admin/reports/supplier-statement
```

#### Parameters:
- **startDate** (optional): تاريخ البداية (YYYY-MM-DD)
- **endDate** (optional): تاريخ النهاية (YYYY-MM-DD)

#### Example Request:
```bash
GET /admin/reports/supplier-statement?startDate=2024-01-01&endDate=2024-12-31
```

#### Response Example:
```json
{
  "result": {
    "period": {
      "startDate": "2024-01-01",
      "endDate": "2024-12-31"
    },
    "statements": [
      {
        "supplier": {
          "_id": "507f1f77bcf86cd799439011",
          "nameAr": "شركة المواد الإنشائية",
          "nameEn": "Construction Materials Co.",
          "code": "SUP001"
        },
        "openingBalance": 5000,
        "totalDebit": 10000,
        "totalCredit": 5000,
        "closingBalance": 10000,
        "transactionsCount": 15
      },
      {
        "supplier": {
          "_id": "507f1f77bcf86cd799439015",
          "nameAr": "مورد الحديد والصلب",
          "nameEn": "Steel Supplier",
          "code": "SUP002"
        },
        "openingBalance": 0,
        "totalDebit": 25000,
        "totalCredit": 15000,
        "closingBalance": 10000,
        "transactionsCount": 8
      }
    ],
    "summary": {
      "totalSuppliers": 2,
      "totalDebit": 35000,
      "totalCredit": 20000
    }
  },
  "message": "تم إنشاء كشوف حسابات الموردين بنجاح"
}
```

---

## Transaction Types

| Type | Description (AR) | Description (EN) |
|------|-----------------|------------------|
| `purchase` | فاتورة شراء | Purchase Invoice |
| `payment` | دفعة للمورد | Payment to Supplier |
| `return` | مرتجع مشتريات | Purchase Return |
| `refund` | مرتجع مدفوعات | Payment Refund |
| `opening` | رصيد افتتاحي | Opening Balance |
| `adjustment` | تسوية | Adjustment |

---

## Balance Calculation

### Opening Balance (الرصيد الافتتاحي)
الرصيد قبل تاريخ البداية المحدد

### Closing Balance (الرصيد الختامي)
```
Closing Balance = Opening Balance + Total Debit - Total Credit
```

### Debit (مدين)
- Purchase invoices (فواتير الشراء)
- Purchase returns (مرتجعات الشراء)

### Credit (دائن)
- Payments to supplier (المدفوعات للمورد)
- Refunds (المرتجعات المالية)

---

## Features

✅ **فترة زمنية مخصصة**: يمكن تحديد فترة زمنية محددة أو عرض جميع المعاملات
✅ **Opening Balance**: حساب الرصيد الافتتاحي قبل الفترة المحددة
✅ **Detailed Transactions**: عرض تفصيلي لكل معاملة
✅ **Summary**: ملخص المعاملات والأرصدة
✅ **Multi-language**: دعم اللغة العربية والإنجليزية
✅ **Authentication**: محمي بنظام المصادقة (Admin only)

---

## Error Responses

### Invalid Supplier ID
```json
{
  "statusCode": 400,
  "message": "معرف المورد غير صالح",
  "error": "Bad Request"
}
```

### Supplier Not Found
```json
{
  "statusCode": 404,
  "message": "المورد غير موجود",
  "error": "Not Found"
}
```

---

## Notes

⚠️ **Authentication Required**: جميع الـ endpoints تتطلب authentication token
⚠️ **Admin Only**: متاح فقط للمستخدمين بصلاحيات Admin
⚠️ **Date Format**: التواريخ يجب أن تكون بصيغة ISO 8601 (YYYY-MM-DD)
⚠️ **Timezone**: جميع التواريخ محفوظة بتوقيت UTC

---

## Usage Examples

### Using Postman
```
1. Set Authorization: Bearer {your_token}
2. Set Accept-Language: ar or en
3. Make GET request to the endpoint
```

### Using cURL
```bash
curl -X GET \
  'http://localhost:3000/admin/reports/supplier-statement/507f1f77bcf86cd799439011?startDate=2024-01-01&endDate=2024-12-31' \
  -H 'Authorization: Bearer your_token_here' \
  -H 'Accept-Language: ar'
```

### Using Axios (JavaScript)
```javascript
const axios = require('axios');

const getSupplierStatement = async (supplierId, startDate, endDate) => {
  try {
    const response = await axios.get(
      `http://localhost:3000/admin/reports/supplier-statement/${supplierId}`,
      {
        params: { startDate, endDate },
        headers: {
          'Authorization': 'Bearer your_token_here',
          'Accept-Language': 'ar'
        }
      }
    );
    
    console.log(response.data);
  } catch (error) {
    console.error(error.response.data);
  }
};

// Example usage
getSupplierStatement('507f1f77bcf86cd799439011', '2024-01-01', '2024-12-31');
```

---

## Future Enhancements

🔜 Export to PDF
🔜 Export to Excel
🔜 Email statement to supplier
🔜 Scheduled reports
🔜 Aging analysis
