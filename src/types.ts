export type MedicineCategory =
  | 'antibiotics' // مضادات حيوية
  | 'analgesics' // مسكنات وخافضات حرارة
  | 'chronic' // أمراض مزمنة (ضغط وسكر وقلب)
  | 'respiratory' // جهاز تنفسي وحساسية
  | 'gastro' // جهاز هضمي ومعدة
  | 'vitamins' // فيتامينات ومكملات
  | 'pediatric' // أدوية أطفال
  | 'dermatology' // جلدية ومستحضرات
  | 'first_aid'; // إسعافات أولية ومستلزمات

export interface Medicine {
  id: string;
  barcode: string;
  tradeName: string; // الاسم التجاري
  genericName: string; // الاسم العلمي
  category: MedicineCategory;
  form: string; // أقراص، شراب، حقن، مرهم، بخاخ
  strength: string; // 500mg, 10mg, 100ml
  packageSize: string; // 20 قرص / 100 مل
  costPrice: number; // سعر التكلفة / الشراء
  sellingPrice: number; // سعر البيع للجمهور
  stock: number; // الرصيد الحالي
  minStockLevel: number; // حد إعادة الطلب
  batchNumber: string; // رقم التشغيلة
  expiryDate: string; // YYYY-MM-DD
  requiresPrescription: boolean; // يحتاج وصفة طبية Rx
  locationRack?: string; // الرف أو المكان (مثال: A-12)
  supplier?: string; // المورد الأساسي
  supplierId?: string; // معرّف المورد أو المستودع
  supplierName?: string; // اسم المورد أو المستودع
  purchasePaymentType?: 'credit' | 'cash'; // نوع الحساب: آجل (ذمم دائنة) أو نقد
}

export interface CartItem {
  medicine: Medicine;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  total: number;
  dosageNotes?: string;
}

export type ElectronicWalletProvider = 'جيب' | 'كاش' | 'محفظتي' | 'وان كاش';

export type PaymentMethod = 'cash' | 'card' | 'credit' | 'insurance';

export interface CustomerInfo {
  name: string;
  phone?: string;
  nationalId?: string;
  insuranceCompany?: string;
  insuranceCardNumber?: string;
  insuranceApprovalNumber?: string; // رقم الموافقة الطبية
  insuranceDeductible?: number; // نسبة التحمل %
  customerCopayAmount?: number; // كم على العميل
  insuranceCompanyAmount?: number; // كم على شركة التأمين
  copayPaymentMethod?: 'cash' | 'card'; // طريقة دفع التحمل (نقداً / محفظة إلكترونية)
  walletProvider?: ElectronicWalletProvider | string; // جيب، كاش، محفظتي، وان كاش
  walletReferenceNumber?: string; // رقم الحوالة أو العملية
}

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. INV-2026-0001
  date: string; // ISO date string
  items: CartItem[];
  subtotal: number;
  discountTotal: number;
  taxAmount: number; // ضريبة القيمة المضافة إن وجدت
  grandTotal: number;
  costTotal: number; // إجمالي التكلفة لحساب الربح
  grossProfit: number; // صافي الربح من الفاتورة
  paymentMethod: PaymentMethod;
  walletProvider?: ElectronicWalletProvider | string; // جيب، كاش، محفظتي، وان كاش
  walletReferenceNumber?: string; // رقم الحوالة أو العملية
  amountPaid: number;
  amountChange: number;
  customer?: CustomerInfo;
  customerCopayAmount?: number; // كم على العميل
  insuranceCompanyAmount?: number; // كم على شركة التأمين
  insuranceApprovalNumber?: string; // رقم الموافقة الطبية
  pharmacistName: string;
  shiftId: string;
  notes?: string;
  syncedToSheets?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: 'rent' | 'salaries' | 'utilities' | 'cleaning' | 'supplies' | 'repairs' | 'other';
  title: string;
  amount: number;
  paymentMethod: 'cash' | 'bank';
  notes?: string;
  recordedBy: string;
  syncedToSheets?: boolean;
}

export interface Shift {
  id: string;
  pharmacistName: string;
  startTime: string;
  endTime?: string;
  openingCash: number; // رصيد البداية
  cashSales: number;
  cardSales: number;
  creditSales: number;
  insuranceSales: number;
  totalSales: number;
  cashExpenses: number;
  expectedClosingCash: number;
  actualClosingCash?: number;
  cashVariance?: number; // فرق الصندوق (عجز أو فائض)
  status: 'open' | 'closed';
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string; // اسم الشركة أو المستودع
  companyType?: 'warehouse' | 'distributor' | 'manufacturer' | 'agent'; // نوع الكيان
  contactPerson: string; // مسؤول المبيعات / المندوب
  phone: string;
  mobile?: string;
  email?: string;
  address?: string; // العنوان أو المدينة
  taxNumber?: string; // الرقم الضريبي للمورد
  commercialRegister?: string; // السجل التجاري
  paymentTerms?: 'cash' | 'credit_15' | 'credit_30' | 'credit_60' | 'consignment'; // شروط الدفع والآجل
  creditLimit?: number; // سقف الائتمان المسموح
  balanceDue: number; // الرصيد الدائن الحالي (المستحق للمستودع / الذمم الدائنة)
  notes?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface SupplierPayment {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  amount: number;
  paymentMethod: 'cash' | 'bank' | 'cheque';
  receiptVoucherNumber?: string;
  notes?: string;
  recordedBy: string;
}

export interface SalesReturnItem {
  medicineId: string;
  tradeName: string;
  genericName?: string;
  barcode: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
  reason: 'wrong_medicine' | 'customer_mind' | 'doctor_change' | 'near_expiry' | 'damaged' | 'other';
  reasonText?: string;
}

export interface SalesReturn {
  id: string;
  returnNumber: string; // RET-S-2026-0001
  invoiceId?: string;
  invoiceNumber?: string;
  date: string;
  items: SalesReturnItem[];
  totalAmount: number;
  refundMethod: 'cash' | 'card' | 'credit';
  customerName?: string;
  customerPhone?: string;
  pharmacistName: string;
  shiftId?: string;
  notes?: string;
}

export interface PurchaseReturnItem {
  medicineId: string;
  tradeName: string;
  genericName?: string;
  barcode: string;
  batchNumber?: string;
  quantity: number;
  costPrice: number; // سعر التكلفة المرتجع به
  total: number;
  reason: 'near_expiry' | 'damaged_shipment' | 'overstock' | 'recalled' | 'wrong_batch' | 'other';
  reasonText?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string; // RET-P-2026-0001
  supplierId: string; // معرف المستودع أو شركة التوزيع
  supplierName: string;
  date: string;
  items: PurchaseReturnItem[];
  totalAmount: number; // إجمالي القيمة المستردة
  settlementMethod: 'deduct_balance' | 'cash_refund' | 'bank_refund'; // خصم من الذمة الدائنة أو استرداد
  pharmacistName: string;
  notes?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  lastSyncedAt?: string;
  isAutoSyncEnabled: boolean;
}

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface StockAdjustment {
  id: string;
  medicineId: string;
  medicineName: string;
  date: string;
  type: 'add' | 'remove' | 'set';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: 'purchase' | 'return_supplier' | 'damage' | 'expired' | 'inventory_count' | 'return_customer' | 'other';
  notes?: string;
  pharmacistName: string;
}

export const CURRENCY = 'ر.ي';
export const CURRENCY_FULL = 'ريال يمني';

export type UserRole = 'admin' | 'pharmacist' | 'cashier' | 'accountant';

export interface UserPermissions {
  canSell?: boolean;
  canManageInventory?: boolean;
  canManageExpenses?: boolean;
  canCloseShift?: boolean;
  canAccessAdmin?: boolean;
  canViewReports?: boolean;
}

export interface SystemUser {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  roleNameAr: string;
  pin: string;
  password?: string;
  email?: string;
  avatarUrl?: string;
  phone?: string;
  licenseNumber?: string;
  specialty?: string;
  shiftType?: 'morning' | 'evening' | 'night' | 'all';
  isActive?: boolean;
  permissions?: UserPermissions;
  notes?: string;
  createdAt?: string;
}

export interface PharmacySettings {
  name: string;
  subtitle: string;
  commercialRegister: string;
  taxNumber: string;
  licenseNumber: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  branchName: string;
  currency: string;
  currencyFullName: string;
  receiptHeader: string;
  receiptFooter: string;
  lowStockThreshold: number;
  expiryWarningDays: number;
  taxRate: number;
  workingHours: string;
  themeColor?: string;
  logoUrl?: string;
}

export type MainTabType = 'pos' | 'inventory' | 'expenses' | 'daily-income' | 'accounting' | 'invoices' | 'reports' | 'admin';

