import * as XLSX from 'xlsx';
import { Invoice, Expense, Medicine, PharmacySettings, Supplier } from '../types';

export interface FinancialReportData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  totalSales: number;
  totalCOGS: number;
  grossProfit: number;
  grossMarginPercent: number;
  totalExpenses: number;
  netProfit: number;
  invoicesCount: number;
  averageInvoiceValue: number;
  cashSales: number;
  cardSales: number;
  insuranceSales: number;
  insuranceCompanySales?: number;
  insuranceCopaySales?: number;
  creditSales: number;
  inventoryValuationCost: number;
  inventoryValuationRetail: number;
  potentialProfitInStock: number;
  invoices: Invoice[];
  expenses: Expense[];
  medicines: Medicine[];
}

/**
 * Generates and downloads a multi-sheet formatted Excel (.xlsx) workbook
 */
export function exportFinancialReportToExcel(
  data: FinancialReportData,
  filename?: string,
  pharmacySettings?: PharmacySettings
) {
  const wb = XLSX.utils.book_new();

  const pharmacyName = pharmacySettings?.name || 'الصيدلية';
  // Sheet 1: Executive Financial Summary (الملخص المالي والربح والخسارة)
  const summaryRows = [
    [`تقرير الأداء المالي والأرباح والخسائر - ${pharmacyName}`],
    ['المنشأة الطبية', pharmacyName],
    ['العنوان', pharmacySettings?.address || '-'],
    ['الرقم الضريبي VAT', pharmacySettings?.taxNumber || '-'],
    ['السجل التجاري CR', pharmacySettings?.commercialRegister || '-'],
    ['رقم الترخيص', pharmacySettings?.licenseNumber || '-'],
    ['تاريخ استخراج التقرير', new Date().toLocaleString('ar-EG')],
    ['الفترة المحددة', data.periodLabel],
    ['من تاريخ', data.startDate],
    ['إلى تاريخ', data.endDate],
    [],
    ['=== قائمة الدخل والربحية (Profit & Loss Statement) ==='],
    ['البند المالي', 'المبلغ (ريال يمني)'],
    ['إجمالي إيرادات المبيعات (Gross Sales)', data.totalSales],
    ['تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)', data.totalCOGS],
    ['مجمل الربح التشغيلي (Gross Profit)', data.grossProfit],
    ['نسبة هامش مجمل الربح (Gross Margin %)', `${data.grossMarginPercent.toFixed(1)}%`],
    ['إجمالي المصروفات التشغيلية (Operating Expenses)', data.totalExpenses],
    ['صافي الربح النهائي (Net Profit)', data.netProfit],
    [],
    ['=== مؤشرات المبيعات وطرق التحصيل (Sales Breakdown) ==='],
    ['عدد الفواتير الصادرة', data.invoicesCount],
    ['متوسط قيمة الفاتورة (Average Order Value)', data.averageInvoiceValue],
    ['مبيعات نقدية (درج الكاشير)', data.cashSales],
    ['مبيعات المحافظ الإلكترونية (جيب / كاش / محفظتي / وان كاش)', data.cardSales],
    ['مبيعات تأمين طبي (إجمالي)', data.insuranceSales],
    ['  - المستحق على شركات التأمين (مطالبات)', data.insuranceCompanySales ?? (data.insuranceSales * 0.8)],
    ['  - المحصل من عملاء التأمين (تحمل المريض)', data.insuranceCopaySales ?? (data.insuranceSales * 0.2)],
    ['مبيعات آجل (ذمم عملاء)', data.creditSales],
    [],
    ['=== تقييم المخزون الدوائي الحالي (Inventory Valuation) ==='],
    ['إجمالي قيمة المخزون بسعر الشراء والتكلفة', data.inventoryValuationCost],
    ['إجمالي قيمة المخزون بسعر البيع للجمهور', data.inventoryValuationRetail],
    ['الأرباح المتوقعة الكامنة في المخزون', data.potentialProfitInStock],
    ['إجمالي عدد الأصناف المسجلة', data.medicines.length],
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
  // Auto-fit column widths
  wsSummary['!cols'] = [{ wch: 45 }, { wch: 25 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص_المالي');

  // Sheet 2: Invoices Breakdown (تفاصيل فواتير المبيعات)
  const invoiceHeaders = [
    'رقم الفاتورة',
    'التاريخ والوقت',
    'اسم العميل',
    'طريقة الدفع',
    'عدد الأصناف',
    'المجموع قبل الضريبة',
    'الخصم',
    'ضريبة القيمة المضافة',
    'الإجمالي النهائي (ر.ي)',
    'التكلفة (ر.ي)',
    'الربح (ر.ي)',
    'الصيدلي المسؤول',
  ];

  const invoiceRows = data.invoices.map((inv) => [
    inv.invoiceNumber,
    new Date(inv.date).toLocaleString('ar-EG'),
    inv.customer?.name || 'عميل نقدي',
    inv.paymentMethod === 'cash'
      ? 'نقداً'
      : inv.paymentMethod === 'card'
      ? (inv.walletProvider ? `محفظة (${inv.walletProvider})` : 'محفظة إلكترونية (جيب/كاش/محفظتي/وان كاش)')
      : inv.paymentMethod === 'insurance'
      ? 'تأمين طبي'
      : 'آجل',
    inv.items.reduce((s, i) => s + i.quantity, 0),
    inv.subtotal,
    inv.discountTotal,
    inv.taxAmount,
    inv.grandTotal,
    inv.costTotal,
    inv.grossProfit,
    inv.pharmacistName,
  ]);

  const wsInvoices = XLSX.utils.aoa_to_sheet([invoiceHeaders, ...invoiceRows]);
  wsInvoices['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInvoices, 'فواتير_المبيعات');

  // Sheet 3: Expenses Breakdown (تفاصيل المصروفات)
  const expenseHeaders = [
    'رقم السند',
    'التاريخ',
    'تصنيف المصروف',
    'البيان والتفاصيل',
    'المبلغ (ر.ي)',
    'طريقة الصرف',
    'المسؤول',
    'ملاحظات',
  ];

  const expenseRows = data.expenses.map((exp) => [
    exp.id,
    new Date(exp.date).toLocaleDateString('ar-EG'),
    translateExpenseCategory(exp.category),
    exp.title,
    exp.amount,
    exp.paymentMethod === 'cash' ? 'نقدي من الصندوق' : 'تحويل بنكي',
    exp.recordedBy,
    exp.notes || '',
  ]);

  const wsExpenses = XLSX.utils.aoa_to_sheet([expenseHeaders, ...expenseRows]);
  wsExpenses['!cols'] = [
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 28 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(wb, wsExpenses, 'المصروفات_التشغيلية');

  // Sheet 4: Inventory Snapshot (جرد المخزون)
  const inventoryHeaders = [
    'الباركود',
    'الاسم التجاري',
    'الاسم العلمي',
    'التصنيف',
    'الشكل والتركيز',
    'الرصيد الحالي',
    'حد إعادة الطلب',
    'سعر الشراء (ر.ي)',
    'سعر البيع (ر.ي)',
    'إجمالي قيمة التكلفة',
    'إجمالي قيمة البيع',
    'رقم التشغيلة',
    'تاريخ انتهاء الصلاحية',
    'مكان الرف',
  ];

  const inventoryRows = data.medicines.map((m) => [
    m.barcode,
    m.tradeName,
    m.genericName,
    m.category,
    `${m.form} - ${m.strength}`,
    m.stock,
    m.minStockLevel,
    m.costPrice,
    m.sellingPrice,
    m.stock * m.costPrice,
    m.stock * m.sellingPrice,
    m.batchNumber,
    m.expiryDate,
    m.locationRack || '',
  ]);

  const wsInventory = XLSX.utils.aoa_to_sheet([inventoryHeaders, ...inventoryRows]);
  wsInventory['!cols'] = [
    { wch: 15 },
    { wch: 24 },
    { wch: 24 },
    { wch: 15 },
    { wch: 18 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, wsInventory, 'جرد_المخزون');

  // Trigger download
  const outFilename = filename || `تقرير_مالي_صيدلية_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, outFilename);
}

/**
 * Exports just the Medicine Inventory to Excel (.xlsx)
 */
export function exportInventoryToExcel(medicines: Medicine[], filename?: string) {
  const wb = XLSX.utils.book_new();

  const headers = [
    'الباركود',
    'الاسم التجاري',
    'الاسم العلمي',
    'التصنيف',
    'الشكل الدوائي',
    'التركيز',
    'حجم العبوة',
    'الرصيد المتاح',
    'حد إعادة الطلب (النواقص)',
    'سعر الشراء / التكلفة (ر.ي)',
    'سعر البيع للجمهور (ر.ي)',
    'إجمالي قيمة المخزون تكلفة (ر.ي)',
    'إجمالي قيمة المخزون بيع (ر.ي)',
    'هامش الربح %',
    'رقم التشغيلة Batch',
    'تاريخ انتهاء الصلاحية',
    'يتطلب وصفة Rx',
    'مكان الرف',
    'المورد / المستودع',
    'نوع الحساب والتوريد',
  ];

  const rows = medicines.map((m) => {
    const margin = (((m.sellingPrice - m.costPrice) / m.costPrice) * 100).toFixed(1);
    const supplierDisp = m.supplierName || m.supplier || 'غير محدد';
    const paymentDisp = m.purchasePaymentType === 'cash' ? 'نقداً' : 'آجل (ذمم دائنة)';
    return [
      m.barcode,
      m.tradeName,
      m.genericName,
      m.category,
      m.form,
      m.strength,
      m.packageSize,
      m.stock,
      m.minStockLevel,
      m.costPrice,
      m.sellingPrice,
      m.stock * m.costPrice,
      m.stock * m.sellingPrice,
      `${margin}%`,
      m.batchNumber,
      m.expiryDate,
      m.requiresPrescription ? 'نعم (Rx)' : 'لا',
      m.locationRack || '',
      supplierDisp,
      paymentDisp,
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [
    { wch: 15 },
    { wch: 25 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 14 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 20 },
    { wch: 20 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 12 },
    { wch: 20 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'مخزون_الأدوية');
  const outName = filename || `مخزون_الأدوية_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, outName);
}

function translateExpenseCategory(cat: string): string {
  const map: Record<string, string> = {
    rent: 'إيجار الصيدلية',
    salaries: 'رواتب ومكافآت',
    utilities: 'كهرباء وتبريد ومياه',
    cleaning: 'نظافة ومطهرات',
    supplies: 'أكياس ومطبوعات ومستلزمات',
    repairs: 'صيانة وثلاجات',
    other: 'مصروفات أخرى',
  };
  return map[cat] || cat;
}

/**
 * Exports Accounts Payable and Warehouses / Suppliers ledger to Excel
 */
export function exportSuppliersReportToExcel(
  suppliers: Supplier[],
  pharmacySettings?: PharmacySettings,
  filename?: string
) {
  const wb = XLSX.utils.book_new();
  const pharmacyName = pharmacySettings?.name || 'الصيدلية';

  const headers = [
    'كود المورد',
    'اسم المستودع / شركة التوزيع',
    'نوع الكيان',
    'المندوب / المسؤول',
    'رقم الهاتف',
    'رقم الجوال',
    'البريد الإلكتروني',
    'المدينة / العنوان',
    'الرقم الضريبي',
    'شروط السداد',
    'سقف الائتمان (ر.ي)',
    'الرصيد الدائن المستحق (الذمم الدائنة ر.ي)',
    'الحالة',
    'ملاحظات',
  ];

  const typeMap: Record<string, string> = {
    warehouse: 'مستودع أدوية مركزي',
    distributor: 'شركة توزيع أدوية',
    manufacturer: 'مصنع دوائي',
    agent: 'وكيل معتمد',
  };

  const termsMap: Record<string, string> = {
    cash: 'سداد نقدي عند الاستلام',
    credit_15: 'آجل 15 يوماً',
    credit_30: 'آجل 30 يوماً',
    credit_60: 'آجل 60 يوماً',
    consignment: 'بضاعة أمانة (تصريف)',
  };

  const rows = suppliers.map((s) => [
    s.id,
    s.name,
    s.companyType ? typeMap[s.companyType] || s.companyType : 'مورد أدوية',
    s.contactPerson,
    s.phone,
    s.mobile || '',
    s.email || '',
    s.address || '',
    s.taxNumber || '',
    s.paymentTerms ? termsMap[s.paymentTerms] || s.paymentTerms : 'آجل 30 يوماً',
    s.creditLimit || 0,
    s.balanceDue,
    s.isActive !== false ? 'نشط' : 'موقف',
    s.notes || '',
  ]);

  const totalDue = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

  const topRows = [
    [`كشف حساب الذمم الدائنة والمستودعات - ${pharmacyName}`],
    ['تاريخ التقرير', new Date().toLocaleString('ar-EG')],
    ['إجمالي الموردين والشركات', suppliers.length],
    ['إجمالي الذمم الدائنة المستحقة للمستودعات', totalDue],
    [],
  ];

  const ws = XLSX.utils.aoa_to_sheet([...topRows, headers, ...rows]);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 32 },
    { wch: 20 },
    { wch: 20 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 25 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 24 },
    { wch: 12 },
    { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'الذمم_الدائنة_والمستودعات');
  const outName = filename || `الذمم_الدائنة_للمستودعات_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, outName);
}

