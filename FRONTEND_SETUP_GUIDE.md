# Frontend Setup Guide

## 📋 Prerequisites
- Node.js (v16 or higher)
- npm or yarn

## 🚀 Installation Steps

### 1. Install Dependencies
```bash
npm install axios
# or
yarn add axios
```

### 2. Create Environment File
Create `.env` file in the root of your frontend project:

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 3. Copy Services Folder
Copy the entire `frontend-services` folder to your `src` directory:
```
src/
  ├── services/
  │   ├── api.js
  │   ├── auth.service.js
  │   ├── users.service.js
  │   ├── suppliers.service.js
  │   ├── clients.service.js
  │   ├── materials.service.js
  │   ├── units.service.js
  │   ├── projects.service.js
  │   ├── purchases.service.js
  │   ├── reports.service.js
  │   └── index.js
```

### 4. Copy Hooks Folder (Optional but Recommended)
Copy the `frontend-hooks` folder to your `src` directory:
```
src/
  ├── hooks/
  │   ├── useApi.js
  │   ├── useSuppliers.js
  │   └── ... (other hooks)
```

## 📝 Usage Examples

### Basic API Usage
```javascript
import { suppliersService } from './services';

// In your component
const fetchSuppliers = async () => {
  try {
    const response = await suppliersService.getAllSuppliers();
    console.log(response.result);
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Using Custom Hooks
```javascript
import { useSuppliers } from './hooks/useSuppliers';

function SuppliersPage() {
  const {
    suppliers,
    loading,
    error,
    createSupplier,
    updateSupplier,
    deleteSupplier,
  } = useSuppliers();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {suppliers.map(supplier => (
        <div key={supplier._id}>{supplier.nameAr}</div>
      ))}
    </div>
  );
}
```

### Using useApi Hook
```javascript
import { useApi } from './hooks/useApi';
import { suppliersService } from './services';

function CreateSupplierForm() {
  const { loading, error, execute } = useApi(suppliersService.createSupplier);

  const handleSubmit = async (formData) => {
    try {
      const result = await execute(formData);
      console.log('Supplier created:', result);
    } catch (err) {
      console.error('Failed to create supplier');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Supplier'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

## 🔐 Authentication

### Login Example
```javascript
import { authService } from './services';

const handleLogin = async (email, password) => {
  try {
    const response = await authService.login(email, password);
    console.log('Logged in:', response);
    // Token is automatically saved to localStorage
    // Redirect to dashboard
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Logout Example
```javascript
import { authService } from './services';

const handleLogout = () => {
  authService.logout();
  // User will be redirected to /login automatically
};
```

### Protected Routes
```javascript
import { authService } from './services';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" />;
  }
  return children;
}
```

## 🌐 Language Support
The API supports both Arabic and English. Language is automatically sent with each request based on localStorage:

```javascript
// Set language
localStorage.setItem('language', 'ar'); // or 'en'

// The api.js interceptor will automatically add Accept-Language header
```

## 📊 All Available Services

### 1. Auth Service
- `login(email, password)`
- `logout()`
- `getCurrentUser()`
- `isAuthenticated()`

### 2. Users Service
- `createUser(userData)`
- `getAllUsers()`
- `getUserById(id)`
- `updateUser(id, userData)`
- `deleteUser(id)`

### 3. Suppliers Service
- `createSupplier(supplierData)`
- `getAllSuppliers()`
- `searchSuppliers(searchTerm)`
- `getSupplierById(id)`
- `updateSupplier(id, supplierData)`
- `deleteSupplier(id)`
- `activateSupplier(id)`

### 4. Clients Service
- `createClient(clientData)`
- `getAllClients()`
- `searchClients(searchTerm)`
- `getClientById(id)`
- `updateClient(id, clientData)`
- `deleteClient(id)`
- `activateClient(id)`

### 5. Materials Service
- `createMaterial(materialData)`
- `getAllMaterials()`
- `getMainCategories()`
- `getSubCategories(mainCategory, subCategory)`
- `searchMaterials(searchTerm)`
- `getMaterialById(id)`
- `updateMaterial(id, materialData)`
- `deleteMaterial(id)`
- `activateMaterial(id)`

### 6. Units Service
- `createUnit(unitData)`
- `getAllUnits(category)`
- `getBaseUnits()`
- `getUnitsForDropdown(category)`
- `searchUnits(searchTerm)`
- `convertUnits(conversionData)`
- `getUnitById(id)`
- `getDerivedUnits(id)`
- `updateUnit(id, unitData)`
- `deleteUnit(id)`
- `activateUnit(id)`

### 7. Projects Service
- `createProject(projectData)`
- `getAllProjects()`
- `searchProjects(searchTerm)`
- `getProjectsByStatus(status)`
- `getProjectsByClient(clientId)`
- `getClientStats(clientId)`
- `getProjectById(id)`
- `getProjectStats(id)`
- `updateProject(id, projectData)`
- `addEquipmentCosts(id, costsData)`
- `updateLaborCosts(id, costsData)`
- `deleteProject(id)`
- `activateProject(id)`

### 8. Purchases Service
- `createPurchase(purchaseData)`
- `createPurchaseReturn(returnData)`
- `getAllPurchases()`
- `getOpenInvoices(supplierId)`
- `getPurchasesBySupplier(supplierId)`
- `getPurchaseById(id)`

### 9. Reports Service
- `getSupplierStatement(supplierId, startDate, endDate)`
- `getAllSuppliersStatement(startDate, endDate)`

## 🐛 Error Handling

All services throw errors that you can catch:

```javascript
try {
  const response = await suppliersService.createSupplier(data);
} catch (error) {
  // error.response.data.message contains the error message from backend
  console.error(error.response?.data?.message || 'Unknown error');
}
```

## 🔄 API Response Format

All API responses follow this format:
```javascript
{
  result: {...}, // or []
  message: "Success message in Arabic or English"
}
```

## 📞 Support

If you encounter any issues:
1. Make sure backend is running on `http://localhost:3000`
2. Check that CORS is enabled in backend
3. Verify token is stored in localStorage
4. Check browser console for errors

## 🎯 Next Steps

1. Copy all files to your React project
2. Install axios
3. Create .env file
4. Start using the services!

Happy coding! 🚀
