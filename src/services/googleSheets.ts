import { Invoice, Medicine, Expense, Shift } from '../types';

export interface SheetCreationResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Creates a dedicated, formatted Google Sheets spreadsheet for the pharmacy
 */
export async function createPharmacySpreadsheet(
  accessToken: string,
  pharmacyName: string = 'صيدلية النور - Al-Noor Pharmacy'
): Promise<SheetCreationResult> {
  const title = `سجل حسابات ومبيعات - ${pharmacyName} (${new Date().toLocaleDateString('ar-EG')})`;

  const requestBody = {
    properties: {
      title,
      locale: 'ar_SA',
      timeZone: 'Asia/Riyadh',
    },
    sheets: [
      {
        properties: {
          title: 'المبيعات_Sales',
          gridProperties: { rowCount: 100, columnCount: 12 },
        },
      },
      {
        properties: {
          title: 'المخزون_Inventory',
          gridProperties: { rowCount: 100, columnCount: 12 },
        },
      },
      {
        properties: {
          title: 'المصروفات_Expenses',
          gridProperties: { rowCount: 100, columnCount: 7 },
        },
      },
      {
        properties: {
          title: 'الأرباح_اليومية_P&L',
          gridProperties: { rowCount: 100, columnCount: 6 },
        },
      },
      {
        properties: {
          title: 'الورديات_Shifts',
          gridProperties: { rowCount: 50, columnCount: 12 },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل إنشاء جدول بيانات Google Sheets: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl;

  // Add initial column headers with styling
  await initializeSheetHeaders(accessToken, spreadsheetId);

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Populates header rows for all tabs in the pharmacy spreadsheet
 */
export async function initializeSheetHeaders(accessToken: string, spreadsheetId: string) {
  const headerData = [
    {
      range: 'المبيعات_Sales!A1:L1',
      values: [
        [
          'رقم الفاتورة',
          'التاريخ والوقت',
          'عدد الأصناف',
          'الإجمالي قبل الخصم (ر.ي)',
          'الخصم (ر.ي)',
          'الضريبة 15% (ر.ي)',
          'الإجمالي النهائي (ر.ي)',
          'التكلفة الإجمالية (ر.ي)',
          'مجمل الربح (ر.ي)',
          'طريقة الدفع',
          'العميل / التأمين',
          'الصيدلي المسؤول',
        ],
      ],
    },
    {
      range: 'المخزون_Inventory!A1:L1',
      values: [
        [
          'الباركود',
          'الاسم التجاري',
          'الاسم العلمي',
          'التصنيف',
          'الشكل والعبوة',
          'سعر التكلفة (ر.ي)',
          'سعر البيع (ر.ي)',
          'الكمية بالمخزن',
          'حد إعادة الطلب',
          'تاريخ انتهاء الصلاحية',
          'رقم التشغيلة Batch',
          'وصفة طبية Rx',
        ],
      ],
    },
    {
      range: 'المصروفات_Expenses!A1:G1',
      values: [
        [
          'رقم الحركة',
          'التاريخ',
          'نوع المصروف',
          'بيان المصروف',
          'المبلغ (ر.ي)',
          'طريقة الدفع',
          'مسجل الحركة',
        ],
      ],
    },
    {
      range: 'الأرباح_اليومية_P&L!A1:F1',
      values: [
        [
          'التاريخ',
          'إجمالي المبيعات (ر.ي)',
          'تكلفة البضاعة المباعة COGS',
          'مجمل الأرباح (ر.ي)',
          'إجمالي المصروفات (ر.ي)',
          'صافي الربح (ر.ي)',
        ],
      ],
    },
    {
      range: 'الورديات_Shifts!A1:L1',
      values: [
        [
          'رقم الوردية',
          'الصيدلي',
          'وقت البدء',
          'وقت الإغلاق',
          'رصيد الافتتاح (ر.ي)',
          'مبيعات نقداً (ر.ي)',
          'مبيعات محافظ إلكترونية (ر.ي)',
          'إجمالي المبيعات (ر.ي)',
          'مصروفات نقدية (ر.ي)',
          'المتوقع بالدرج (ر.ي)',
          'الفعلي المستلم (ر.ي)',
          'الفائض / العجز (ر.ي)',
        ],
      ],
    },
  ];

  for (const item of headerData) {
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
        item.range
      )}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: item.values }),
      }
    );
  }
}

/**
 * Appends a completed sales invoice row into Google Sheets
 */
export async function appendInvoiceToSheet(
  accessToken: string,
  spreadsheetId: string,
  invoice: Invoice
) {
  const row = [
    invoice.invoiceNumber,
    new Date(invoice.date).toLocaleString('ar-EG'),
    invoice.items.reduce((acc, i) => acc + i.quantity, 0),
    invoice.subtotal.toFixed(2),
    invoice.discountTotal.toFixed(2),
    invoice.taxAmount.toFixed(2),
    invoice.grandTotal.toFixed(2),
    invoice.costTotal.toFixed(2),
    invoice.grossProfit.toFixed(2),
    getPaymentMethodLabel(invoice.paymentMethod),
    invoice.customer?.name || 'عميل نقدي سريع',
    invoice.pharmacistName,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'المبيعات_Sales!A:L'
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل تسجيل الفاتورة في Google Sheets: ${errorText}`);
  }

  return await response.json();
}

/**
 * Appends an expense row into Google Sheets
 */
export async function appendExpenseToSheet(
  accessToken: string,
  spreadsheetId: string,
  expense: Expense
) {
  const row = [
    expense.id,
    new Date(expense.date).toLocaleDateString('ar-EG'),
    getExpenseCategoryLabel(expense.category),
    expense.title + (expense.notes ? ` (${expense.notes})` : ''),
    expense.amount.toFixed(2),
    expense.paymentMethod === 'cash' ? 'نقدي (صندوق)' : 'تحويل بنكي / بطاقة',
    expense.recordedBy,
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'المصروفات_Expenses!A:G'
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل تسجيل المصروف في Google Sheets: ${errorText}`);
  }

  return await response.json();
}

/**
 * Appends or updates shift closing details in Google Sheets
 */
export async function appendShiftToSheet(
  accessToken: string,
  spreadsheetId: string,
  shift: Shift
) {
  const row = [
    shift.id,
    shift.pharmacistName,
    new Date(shift.startTime).toLocaleString('ar-EG'),
    shift.endTime ? new Date(shift.endTime).toLocaleString('ar-EG') : 'جارية',
    shift.openingCash.toFixed(2),
    shift.cashSales.toFixed(2),
    shift.cardSales.toFixed(2),
    shift.totalSales.toFixed(2),
    shift.cashExpenses.toFixed(2),
    shift.expectedClosingCash.toFixed(2),
    shift.actualClosingCash !== undefined ? shift.actualClosingCash.toFixed(2) : '-',
    shift.cashVariance !== undefined ? shift.cashVariance.toFixed(2) : '-',
  ];

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'الورديات_Shifts!A:L'
    )}:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل حفظ بيانات الوردية في Google Sheets: ${errorText}`);
  }

  return await response.json();
}

/**
 * Full sync of current medicines inventory into Google Sheets
 */
export async function syncInventoryToSheet(
  accessToken: string,
  spreadsheetId: string,
  medicines: Medicine[]
) {
  const rows = medicines.map((m) => [
    m.barcode,
    m.tradeName,
    m.genericName,
    getCategoryLabel(m.category),
    `${m.form} - ${m.strength} (${m.packageSize})`,
    m.costPrice.toFixed(2),
    m.sellingPrice.toFixed(2),
    m.stock,
    m.minStockLevel,
    m.expiryDate,
    m.batchNumber,
    m.requiresPrescription ? 'نعم (Rx)' : 'لا (OTC)',
  ]);

  // First clear existing data below headers
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'المخزون_Inventory!A2:L500'
    )}:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }
  );

  // Write new inventory rows
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
      'المخزون_Inventory!A2:L'
    )}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`فشل مزامنة المخزون مع Google Sheets: ${errorText}`);
  }

  return await response.json();
}

// Helpers
function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cash':
      return 'نقداً';
    case 'card':
      return 'محفظة إلكترونية (جيب / كاش / محفظتي / وان كاش)';
    case 'credit':
      return 'آجل (حساب عميل)';
    case 'insurance':
      return 'تأمين طبي';
    default:
      return method;
  }
}

function getExpenseCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    rent: 'إيجار الصيدلية',
    salaries: 'رواتب ومكافآت',
    utilities: 'كهرباء وتبريد ومياه',
    cleaning: 'نظافة ومطهرات',
    supplies: 'أكياس ومطبوعات ومستلزمات',
    repairs: 'صيانة وأجهزة',
    other: 'مصروفات عامة أخرى',
  };
  return map[cat] || cat;
}

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    antibiotics: 'مضادات حيوية',
    analgesics: 'مسكنات وخافضات حرارة',
    chronic: 'أمراض مزمنة (ضغط/سكر/قلب)',
    respiratory: 'جهاز تنفسي وحساسية',
    gastro: 'جهاز هضمي ومعدة',
    vitamins: 'فيتامينات ومكملات',
    pediatric: 'أدوية أطفال',
    dermatology: 'جلدية وتجميل',
    first_aid: 'إسعافات ومستلزمات',
  };
  return map[cat] || cat;
}
