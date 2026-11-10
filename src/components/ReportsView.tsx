import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Package,
  Layers,
  CreditCard,
  Banknote,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Building,
  Wallet,
} from 'lucide-react';
import { Invoice, Expense, Medicine, ReportPeriod, PharmacySettings, Supplier } from '../types';
import { exportFinancialReportToExcel, FinancialReportData } from '../utils/exportUtils';

interface ReportsViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  medicines: Medicine[];
  onOpenPdfReportModal: (data: FinancialReportData) => void;
  pharmacySettings?: PharmacySettings;
  suppliers?: Supplier[];
  onOpenSuppliersReportModal?: (supplierId?: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  expenses,
  medicines,
  onOpenPdfReportModal,
  pharmacySettings,
  suppliers,
  onOpenSuppliersReportModal,
}) => {
  const [period, setPeriod] = useState<ReportPeriod>('monthly');

  // Custom date ranges (default to current month)
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [customStartDate, setCustomStartDate] = useState(firstDayOfMonth);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Compute date boundaries based on period
  const { startDate, endDate, periodLabel } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let label = 'هذا الشهر';

    if (period === 'daily') {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      label = `تقرير اليوم (${now.toLocaleDateString('ar-EG')})`;
    } else if (period === 'weekly') {
      // Last 7 days
      start = new Date();
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      label = 'التقرير الأسبوعي (آخر 7 أيام)';
    } else if (period === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      label = `التقرير الشهري (${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'yearly') {
      start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      label = `التقرير السنوي لعام (${now.getFullYear()})`;
    } else {
      start = new Date(customStartDate + 'T00:00:00');
      end = new Date(customEndDate + 'T23:59:59');
      label = `فترة مخصصة من ${customStartDate} إلى ${customEndDate}`;
    }

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      periodLabel: label,
    };
  }, [period, customStartDate, customEndDate]);

  // Filter invoices within period
  const filteredInvoices = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    return invoices.filter((inv) => {
      const t = new Date(inv.date).getTime();
      return t >= s && t <= e;
    });
  }, [invoices, startDate, endDate]);

  // Filter expenses within period
  const filteredExpenses = useMemo(() => {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    return expenses.filter((exp) => {
      const t = new Date(exp.date).getTime();
      return t >= s && t <= e;
    });
  }, [expenses, startDate, endDate]);

  // Financial aggregates
  const totalSales = filteredInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCOGS = filteredInvoices.reduce((sum, inv) => sum + inv.costTotal, 0);
  const grossProfit = totalSales - totalCOGS;
  const grossMarginPercent = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  const invoicesCount = filteredInvoices.length;
  const averageInvoiceValue = invoicesCount > 0 ? totalSales / invoicesCount : 0;

  const totalTaxAmount = filteredInvoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
  const totalDiscount = filteredInvoices.reduce((sum, inv) => sum + inv.discountTotal, 0);

  // Payment Breakdown
  const cashSales = filteredInvoices.filter((i) => i.paymentMethod === 'cash').reduce((sum, i) => sum + i.grandTotal, 0);
  const cardSales = filteredInvoices.filter((i) => i.paymentMethod === 'card').reduce((sum, i) => sum + i.grandTotal, 0);
  const insuranceSales = filteredInvoices.filter((i) => i.paymentMethod === 'insurance').reduce((sum, i) => sum + i.grandTotal, 0);
  const insuranceCompanySales = filteredInvoices
    .filter((i) => i.paymentMethod === 'insurance')
    .reduce((sum, i) => sum + (i.insuranceCompanyAmount ?? (i.grandTotal - (i.customerCopayAmount ?? 0))), 0);
  const insuranceCopaySales = filteredInvoices
    .filter((i) => i.paymentMethod === 'insurance')
    .reduce((sum, i) => sum + (i.customerCopayAmount ?? 0), 0);
  const creditSales = filteredInvoices.filter((i) => i.paymentMethod === 'credit').reduce((sum, i) => sum + i.grandTotal, 0);

  // Inventory Metrics
  const inventoryValuationCost = medicines.reduce((sum, m) => sum + m.stock * m.costPrice, 0);
  const inventoryValuationRetail = medicines.reduce((sum, m) => sum + m.stock * m.sellingPrice, 0);
  const potentialProfitInStock = inventoryValuationRetail - inventoryValuationCost;
  const lowStockCount = medicines.filter((m) => m.stock <= m.minStockLevel).length;
  const expiringCount = medicines.filter((m) => {
    const expiry = new Date(m.expiryDate);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return expiry <= sixMonths;
  }).length;

  // Report bundle data for export
  const reportData: FinancialReportData = {
    periodLabel,
    startDate: startDate.split('T')[0],
    endDate: endDate.split('T')[0],
    totalSales,
    totalCOGS,
    grossProfit,
    grossMarginPercent,
    totalExpenses,
    netProfit,
    invoicesCount,
    averageInvoiceValue,
    cashSales,
    cardSales,
    insuranceSales,
    insuranceCompanySales,
    insuranceCopaySales,
    creditSales,
    inventoryValuationCost,
    inventoryValuationRetail,
    potentialProfitInStock,
    invoices: filteredInvoices,
    expenses: filteredExpenses,
    medicines,
  };

  const handleExportExcel = () => {
    exportFinancialReportToExcel(
      reportData,
      `تقرير_${pharmacySettings?.name ? pharmacySettings.name.replace(/\s+/g, '_') : 'صيدلية'}_${period}_${new Date().toISOString().split('T')[0]}.xlsx`,
      pharmacySettings
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header & Periodic Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">التقارير المالية والتحليل الدوري للصيدلية</h2>
              <p className="text-xs text-slate-500">{periodLabel}</p>
            </div>
          </div>
        </div>

        {/* Periodic Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('daily')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'daily' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              يومي
            </button>
            <button
              onClick={() => setPeriod('weekly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'weekly' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              أسبوعي
            </button>
            <button
              onClick={() => setPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'monthly' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              شهري
            </button>
            <button
              onClick={() => setPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'yearly' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              سنوي
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                period === 'custom' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              فترة مخصصة
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="تصدير ملف إكسل منسق بـ 4 أوراق عمل"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>تصدير Excel (.xlsx)</span>
            </button>

            <button
              onClick={() => onOpenPdfReportModal(reportData)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              title="معاينة وطباعة تقرير A4 رسمي بصيغة PDF"
            >
              <Printer className="w-4 h-4 text-teal-400" />
              <span>طباعة / حفظ PDF</span>
            </button>

            {onOpenSuppliersReportModal && (
              <button
                onClick={() => onOpenSuppliersReportModal()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                title="معاينة وطباعة تقرير كشف حسابات المستودعات والشركات (الذمم الدائنة)"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                <span>معاينة وطباعة تقرير الشركات والمستودعات</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Custom Date Pickers (Shown only when custom period selected) */}
      {period === 'custom' && (
        <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">من تاريخ:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 bg-white outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">إلى تاريخ:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="border border-slate-300 rounded-lg p-1.5 bg-white outline-none"
            />
          </div>
        </div>
      )}

      {/* Top Key Financial Indicators (P&L KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>إجمالي المبيعات (Gross Sales)</span>
            <TrendingUp className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {totalSales.toFixed(2)} <span className="text-xs font-normal">ر.ي</span>
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
            <span>{invoicesCount} فاتورة صادرة</span>
            <span>متوسط: {averageInvoiceValue.toFixed(2)} ر.ي</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>تكلفة البضاعة المباعة (COGS)</span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-2xl font-black text-slate-700">
            {totalCOGS.toFixed(2)} <span className="text-xs font-normal">ر.ي</span>
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">سعر الشراء من شركات ومستودعات الأدوية</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>مجمل الربح (Gross Profit)</span>
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-teal-700">
            {grossProfit.toFixed(2)} <span className="text-xs font-normal">ر.ي</span>
          </p>
          <span className="text-[11px] text-emerald-600 font-bold block pt-1">
            هامش الربح الإجمالي: {grossMarginPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>صافي الربح النهائي (Net Profit)</span>
            {netProfit >= 0 ? (
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
            {netProfit.toFixed(2)} <span className="text-xs font-normal">ر.ي</span>
          </p>
          <span className="text-[11px] text-slate-400 block pt-1">
            بعد خصم المصروفات ({totalExpenses.toFixed(2)} ر.ي)
          </span>
        </div>
      </div>

      {/* Main Analysis Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Detailed P&L Statement */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center justify-between">
            <span>قائمة الدخل والربحية المفصلة للفترة (P&L Statement)</span>
            <span className="text-xs text-teal-700 font-medium">{periodLabel}</span>
          </h3>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 font-extrabold text-slate-900 text-sm">
              <span>(+) إجمالي مبيعات الأدوية والمستلزمات</span>
              <span>{totalSales.toFixed(2)} ر.ي</span>
            </div>

            <div className="flex justify-between py-1.5 text-slate-600 pr-3">
              <span>(-) تكلفة الشراء من الموردين (COGS)</span>
              <span className="text-rose-600 font-semibold">- {totalCOGS.toFixed(2)} ر.ي</span>
            </div>

            <div className="flex justify-between py-2.5 bg-teal-50/70 text-teal-900 px-3 rounded-xl font-bold">
              <span>(=) مجمل الربح من المبيعات</span>
              <span className="text-teal-800 text-sm font-black">{grossProfit.toFixed(2)} ر.ي</span>
            </div>

            <div className="pt-2 font-bold text-slate-700">(-) المصروفات التشغيلية والإدارية في الفترة:</div>

            {filteredExpenses.length === 0 ? (
              <p className="text-slate-400 pr-3 text-[11px]">لا توجد سندات صرف مسجلة خلال هذه الفترة</p>
            ) : (
              filteredExpenses.map((exp) => (
                <div key={exp.id} className="flex justify-between py-1 text-slate-500 pr-3 text-[11px]">
                  <span>• {exp.title} ({new Date(exp.date).toLocaleDateString('ar-EG')})</span>
                  <span className="text-rose-600 font-semibold">- {exp.amount.toFixed(2)} ر.ي</span>
                </div>
              ))
            )}

            <div className="flex justify-between py-2 text-slate-700 pr-3 border-t border-slate-200 font-bold">
              <span>إجمالي المصروفات في الفترة</span>
              <span className="text-rose-700">- {totalExpenses.toFixed(2)} ر.ي</span>
            </div>

            <div
              className={`flex justify-between py-3 px-4 rounded-xl font-black text-sm border ${
                netProfit >= 0
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}
            >
              <span>(=) صافي الدخل / الربح النهائي للصيدلية</span>
              <span className="text-base">{netProfit.toFixed(2)} ر.ي</span>
            </div>
          </div>
        </div>

        {/* Right: Payment Channels & Inventory Valuation */}
        <div className="lg:col-span-5 space-y-4">
          {/* Payment Methods Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>توزيع المبيعات حسب طريقة التحصيل</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-700">مبيعات نقدية (كاش):</span>
                </div>
                <span className="font-extrabold text-slate-900">{cashSales.toFixed(2)} ر.ي</span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <span className="font-semibold text-slate-700">محافظ إلكترونية (جيب / كاش / محفظتي / وان كاش):</span>
                </div>
                <span className="font-extrabold text-slate-900">{cardSales.toFixed(2)} ر.ي</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span className="font-semibold text-slate-700">مبيعات التأمين الطبي:</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{insuranceSales.toFixed(2)} ر.ي</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-600 border-t border-slate-200/60 pt-1 pr-6">
                  <span>• كم على شركة التأمين (المطالبة):</span>
                  <span className="font-mono font-bold text-indigo-700">{insuranceCompanySales.toFixed(2)} ر.ي</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-600 pr-6">
                  <span>• كم على العميل (نسبة التحمل):</span>
                  <span className="font-mono font-bold text-teal-700">{insuranceCopaySales.toFixed(2)} ر.ي</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="font-semibold text-slate-700">مبيعات آجلة (ذمم عملاء):</span>
                </div>
                <span className="font-extrabold text-slate-900">{creditSales.toFixed(2)} ر.ي</span>
              </div>
            </div>
          </div>

          {/* Inventory Valuation Snapshot */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-800 text-sm border-b pb-2 flex items-center gap-2">
              <Package className="w-4 h-4 text-teal-600" />
              <span>تقييم وصحة المخزون الصيدلاني</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">قيمة المخزون الإجمالية (تكلفة الشراء):</span>
                <span className="font-bold text-slate-800">{inventoryValuationCost.toFixed(2)} ر.ي</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">قيمة المخزون المقدرة (بسعر البيع):</span>
                <span className="font-bold text-emerald-700">{inventoryValuationRetail.toFixed(2)} ر.ي</span>
              </div>

              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">الأرباح المتوقعة الكامنة في البضاعة:</span>
                <span className="font-extrabold text-teal-800">+{potentialProfitInStock.toFixed(2)} ر.ي</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-amber-700 font-semibold">أصناف أوشكت على النفاد (تحت حد الطلب):</span>
                <span className="font-bold text-amber-800">{lowStockCount} دواء</span>
              </div>

              <div className="flex justify-between py-1">
                <span className="text-rose-700 font-semibold">أصناف قريبة من انتهاء الصلاحية:</span>
                <span className="font-bold text-rose-800">{expiringCount} دواء</span>
              </div>
            </div>
          </div>

          {/* Suppliers & Warehouses Accounts (Accounts Payable) Report Card */}
          {suppliers && suppliers.length > 0 && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Building className="w-4 h-4 text-indigo-600" />
                  <span>حسابات شركات ومستودعات الأدوية (الذمم الدائنة)</span>
                </h3>
                {onOpenSuppliersReportModal && (
                  <button
                    onClick={() => onOpenSuppliersReportModal()}
                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="معاينة وطباعة التقرير الشامل"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>معاينة وطباعة التقرير</span>
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">إجمالي الذمم الدائنة للمستودعات:</span>
                  <span className="font-black text-rose-700 text-sm font-mono">
                    {suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0).toFixed(2)} ر.ي
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">عدد الشركات والمستودعات المسجلة:</span>
                  <span className="font-bold text-slate-800">{suppliers.length} جهة توريد</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-amber-700 font-semibold">شركات لها ذمم مستحقة غير مسددة:</span>
                  <span className="font-bold text-amber-800">
                    {suppliers.filter((s) => s.balanceDue > 0).length} شركة ومستودع
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Invoices List for Selected Period */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <span>فواتير المبيعات الصادرة في الفترة ({filteredInvoices.length} فاتورة)</span>
          </h3>
          <span className="text-xs text-slate-500">إجمالي المبيعات: <strong>{totalSales.toFixed(2)} ر.ي</strong></span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="p-2.5">رقم الفاتورة</th>
                <th className="p-2.5">التاريخ والوقت</th>
                <th className="p-2.5">العميل</th>
                <th className="p-2.5">طريقة الدفع</th>
                <th className="p-2.5">الأصناف</th>
                <th className="p-2.5">المجموع قبل الضريبة</th>
                <th className="p-2.5">الضريبة 15%</th>
                <th className="p-2.5">الإجمالي (ر.ي)</th>
                <th className="p-2.5">الربح المحقق</th>
                <th className="p-2.5">الصيدلي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    لا توجد فواتير مبيعات في الفترة المحددة
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70">
                    <td className="p-2.5 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                    <td className="p-2.5 text-slate-600">{new Date(inv.date).toLocaleString('ar-EG')}</td>
                    <td className="p-2.5 font-medium text-slate-800">{inv.customer?.name || 'عميل نقدي'}</td>
                    <td className="p-2.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-semibold">
                        {inv.paymentMethod === 'cash'
                          ? 'نقداً'
                          : inv.paymentMethod === 'card'
                          ? inv.walletProvider
                            ? `محفظة ${inv.walletProvider}`
                            : 'محفظة إلكترونية'
                          : inv.paymentMethod === 'insurance'
                          ? 'تأمين'
                          : 'آجل'}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-600">{inv.items.length} صنف</td>
                    <td className="p-2.5 text-slate-600">{inv.subtotal.toFixed(2)}</td>
                    <td className="p-2.5 text-slate-600">{inv.taxAmount.toFixed(2)}</td>
                    <td className="p-2.5 font-extrabold text-slate-900">{inv.grandTotal.toFixed(2)} ر.ي</td>
                    <td className="p-2.5 font-bold text-emerald-700">+{inv.grossProfit.toFixed(2)} ر.ي</td>
                    <td className="p-2.5 text-slate-500">{inv.pharmacistName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
