import { Medicine, Invoice, Expense, Shift, Supplier, SupplierPayment, SystemUser, PharmacySettings } from '../types';

export const INITIAL_MEDICINES: Medicine[] = [];

export const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_INVOICES: Invoice[] = [];

export const INITIAL_CURRENT_SHIFT: Shift = {
  id: 'shift-1',
  pharmacistName: 'المدير المسؤول',
  startTime: new Date().toISOString(),
  openingCash: 0,
  cashSales: 0,
  cardSales: 0,
  creditSales: 0,
  insuranceSales: 0,
  totalSales: 0,
  cashExpenses: 0,
  expectedClosingCash: 0,
  status: 'open',
};

export const INITIAL_SUPPLIERS: Supplier[] = [];

export const INITIAL_SUPPLIER_PAYMENTS: SupplierPayment[] = [];

export const INITIAL_SYSTEM_USERS: SystemUser[] = [
  {
    id: 'usr-admin',
    name: 'المدير المسؤول',
    username: 'admin',
    role: 'admin',
    roleNameAr: 'مدير الصيدلية وصيدلي مسؤول',
    pin: '1234',
    password: 'admin',
    email: 'admin@pharmacy.com',
    phone: '',
    specialty: 'إدارة الصيدلية',
    shiftType: 'all',
    isActive: true,
    permissions: {
      canSell: true,
      canManageInventory: true,
      canManageExpenses: true,
      canCloseShift: true,
      canAccessAdmin: true,
      canViewReports: true,
    },
    notes: 'الحساب الرئيسي لإدارة الصيدلية',
    createdAt: new Date().toISOString().split('T')[0],
  },
];

export const INITIAL_PHARMACY_SETTINGS: PharmacySettings = {
  name: 'الصيدلية النموذجية',
  subtitle: 'أدوية ومستلزمات طبية ورعاية صيدلانية متكاملة',
  commercialRegister: '',
  taxNumber: '',
  licenseNumber: '',
  phone: '',
  mobile: '',
  email: '',
  address: '',
  branchName: 'المركز الرئيسي',
  currency: 'ر.ي',
  currencyFullName: 'ريال يمني',
  receiptHeader: 'الصيدلية النموذجية • خدمة طبية متكاملة',
  receiptFooter: 'شكراً لثقتكم بنا',
  lowStockThreshold: 10,
  expiryWarningDays: 60,
  taxRate: 0,
  workingHours: '24 ساعة / 7 أيام في الأسبوع',
  themeColor: 'teal',
  logoUrl: '',
};
