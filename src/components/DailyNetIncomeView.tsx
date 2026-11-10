import React, { useState, useMemo } from 'react';
import {
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingBag,
  Receipt,
  CreditCard,
  Building,
  Printer,
  ChevronLeft,
  ChevronRight,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info,
  ShieldCheck,
  Eye,
  X,
  FileText,
  Pill,
  RotateCcw,
} from 'lucide-react';
import { Invoice, Expense, Shift, CURRENCY, PharmacySettings, SalesReturn } from '../types';

interface DailyNetIncomeViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  salesReturns?: SalesReturn[];
  currentShift: Shift;
  onSyncToSheets?: () => void;
  onViewInvoice?: (invoice: Invoice) => void;
  onOpenReturnReceipt?: (salesReturn: SalesReturn) => void;
  pharmacySettings?: PharmacySettings;
}

export const DailyNetIncomeView: React.FC<DailyNetIncomeViewProps> = ({
  invoices,
  expenses,
  salesReturns = [],
  currentShift,
  onSyncToSheets,
  onViewInvoice,
  onOpenReturnReceipt,
  pharmacySettings,
}) => {
  // Selected date in YYYY-MM-DD format (default: today)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });

  // Navigate date
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedDateStr);
    current.setDate(current.getDate() + days);
    setSelectedDateStr(current.toISOString().slice(0, 10));
  };

  const handleSetToday = () => {
    setSelectedDateStr(new Date().toISOString().slice(0, 10));
  };

  const handleSetYesterday = () => {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    setSelectedDateStr(y.toISOString().slice(0, 10));
  };

  // Filter invoices for selected day
  const dailyInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.date.slice(0, 10) === selectedDateStr);
  }, [invoices, selectedDateStr]);

  // Filter sales returns for selected day
  const dailySalesReturns = useMemo(() => {
    return (salesReturns || []).filter((ret) => ret.date.slice(0, 10) === selectedDateStr);
  }, [salesReturns, selectedDateStr]);

  // Filter expenses for selected day
  const dailyExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.date.slice(0, 10) === selectedDateStr);
  }, [expenses, selectedDateStr]);

  // Previous day data for trend comparison
  const previousDayStr = useMemo(() => {
    const d = new Date(selectedDateStr);
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }, [selectedDateStr]);

  const prevDayInvoices = useMemo(() => {
    return invoices.filter((inv) => inv.date.slice(0, 10) === previousDayStr);
  }, [invoices, previousDayStr]);

  const prevDaySalesReturns = useMemo(() => {
    return (salesReturns || []).filter((ret) => ret.date.slice(0, 10) === previousDayStr);
  }, [salesReturns, previousDayStr]);

  const prevDayExpenses = useMemo(() => {
    return expenses.filter((exp) => exp.date.slice(0, 10) === previousDayStr);
  }, [expenses, previousDayStr]);

  // Financial calculations for selected day:
  // Net Income = (Gross Sales - Sales Returns) - Expenses (بدون تكلفة البضاعة المباعة وبخصم مرتجعات المبيعات)
  const grossSales = dailyInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalSalesReturns = dailySalesReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
  const totalSales = Math.max(0, grossSales - totalSalesReturns); // صافي المبيعات بعد خصم المرتجعات
  const totalCOGS = dailyInvoices.reduce((sum, inv) => sum + inv.costTotal, 0);

  const totalDailyExpenses = dailyExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const cashDailyExpenses = dailyExpenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const bankDailyExpenses = dailyExpenses
    .filter((e) => e.paymentMethod === 'bank')
    .reduce((sum, e) => sum + e.amount, 0);

  // THE KEY METRIC: Daily Net Income (إجمالي مبيعات اليوم - مرتجع مبيعات اليوم - إجمالي المصروفات)
  const dailyNetIncome = grossSales - totalSalesReturns - totalDailyExpenses;
  const netIncomeMarginPercent = grossSales > 0 ? (dailyNetIncome / grossSales) * 100 : 0;

  // Comparison with previous day
  const prevGrossSales = prevDayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const prevSalesReturns = prevDaySalesReturns.reduce((sum, ret) => sum + ret.totalAmount, 0);
  const prevExpenses = prevDayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const prevNetIncome = prevGrossSales - prevSalesReturns - prevExpenses;

  const netIncomeChange = prevNetIncome !== 0 ? ((dailyNetIncome - prevNetIncome) / Math.abs(prevNetIncome)) * 100 : 0;

  // Payment Breakdown taking sales returns into account
  const cashSalesReturns = dailySalesReturns
    .filter((r) => r.refundMethod === 'cash')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const cardSalesReturns = dailySalesReturns
    .filter((r) => r.refundMethod === 'card')
    .reduce((sum, r) => sum + r.totalAmount, 0);
  const creditSalesReturns = dailySalesReturns
    .filter((r) => r.refundMethod === 'credit')
    .reduce((sum, r) => sum + r.totalAmount, 0);

  // Medical insurance breakdown (على الشركة وعلى العميل)
  const insuranceCompanySales = dailyInvoices
    .filter((i) => i.paymentMethod === 'insurance')
    .reduce((sum, i) => sum + (i.insuranceCompanyAmount ?? (i.grandTotal - (i.customerCopayAmount ?? 0))), 0);

  const insuranceCopaySales = dailyInvoices
    .filter((i) => i.paymentMethod === 'insurance')
    .reduce((sum, i) => sum + (i.customerCopayAmount ?? 0), 0);

  const cashSales = Math.max(
    0,
    dailyInvoices
      .filter((i) => i.paymentMethod === 'cash')
      .reduce((sum, i) => sum + i.grandTotal, 0) - cashSalesReturns
  );
  const cardSales = Math.max(
    0,
    dailyInvoices
      .filter((i) => i.paymentMethod === 'card')
      .reduce((sum, i) => sum + i.grandTotal, 0) - cardSalesReturns
  );
  const creditSales = Math.max(
    0,
    dailyInvoices
      .filter((i) => i.paymentMethod === 'credit')
      .reduce((sum, i) => sum + i.grandTotal, 0) - creditSalesReturns
  );
  const insuranceSales = dailyInvoices
    .filter((i) => i.paymentMethod === 'insurance')
    .reduce((sum, i) => sum + i.grandTotal, 0);

  // Medicines sold today summary (deducting returned medicines)
  const medicinesSoldMap = useMemo(() => {
    const map = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
    dailyInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const current = map.get(item.medicine.id) || {
          name: item.medicine.tradeName,
          quantity: 0,
          revenue: 0,
          profit: 0,
        };
        const itemProfit = item.total - (item.medicine.costPrice * item.quantity);
        map.set(item.medicine.id, {
          name: item.medicine.tradeName,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + item.total,
          profit: current.profit + itemProfit,
        });
      });
    });

    // Deduct returned medicines
    dailySalesReturns.forEach((ret) => {
      ret.items.forEach((item) => {
        const current = map.get(item.medicineId);
        if (current) {
          const itemRefund = item.total;
          const itemCostRefund = item.costPrice * item.quantity;
          map.set(item.medicineId, {
            name: current.name,
            quantity: Math.max(0, current.quantity - item.quantity),
            revenue: Math.max(0, current.revenue - itemRefund),
            profit: Math.max(0, current.profit - (itemRefund - itemCostRefund)),
          });
        }
      });
    });

    return Array.from(map.values())
      .filter((m) => m.quantity > 0 || m.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue);
  }, [dailyInvoices, dailySalesReturns]);

  // Formatted date string in Arabic
  const formattedSelectedDate = new Date(selectedDateStr).toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const isToday = selectedDateStr === new Date().toISOString().slice(0, 10);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Render official formal printable A4 report
  const renderOfficialPrintableReport = (isModalPreview = false) => {
    const pharmacyName = pharmacySettings?.name || 'الصيدلية النموذجية';
    const subtitle = pharmacySettings?.subtitle || 'تقرير التحليل المالي وصافي الدخل اليومي والأرباح';
    const address = pharmacySettings?.address || '';
    const phone = pharmacySettings?.phone || pharmacySettings?.mobile;
    const taxNumber = pharmacySettings?.taxNumber;
    const commercialRegister = pharmacySettings?.commercialRegister;
    const licenseNumber = pharmacySettings?.licenseNumber;
    const currency = pharmacySettings?.currency || CURRENCY;
    const currencyFullName = pharmacySettings?.currencyFullName || 'ريال يمني';

    return (
      <div
        id={isModalPreview ? 'pharmacy-daily-income-preview' : 'pharmacy-daily-income-print'}
        className="bg-white text-slate-800 text-xs leading-relaxed space-y-3.5 p-4 sm:p-6 print:p-2 print:space-y-3 print:overflow-visible print:block print:w-full"
      >
        {/* Formal Header */}
        <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {pharmacySettings?.logoUrl ? (
              <div className="w-14 h-14 rounded-2xl border border-slate-200 p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src={pharmacySettings.logoUrl}
                  alt="Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-teal-700 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                <DollarSign className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900">
                {pharmacyName}
              </h1>
              <p className="text-[11px] text-slate-600 font-medium">
                {subtitle} {address && `| ${address}`}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 text-[10px] text-slate-500 mt-0.5">
                {taxNumber && <span>الرقم الضريبي: <span className="font-mono">{taxNumber}</span></span>}
                {commercialRegister && <span>سجل تجاري: <span className="font-mono">{commercialRegister}</span></span>}
                {licenseNumber && <span>ترخيص: <span className="font-mono">{licenseNumber}</span></span>}
                {phone && <span>هاتف: <span className="font-mono">{phone}</span></span>}
              </div>
            </div>
          </div>

          <div className="text-left flex flex-col items-end">
            <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs inline-block tracking-wide">
              تقرير وتدقيق صافي الدخل اليومي
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5 font-mono">
              DAILY STATEMENT OF NET INCOME & P&L
            </span>
            <div className="text-[10px] text-slate-600 mt-0.5 space-y-0.5 text-left">
              <div>تاريخ التقرير: <strong>{formattedSelectedDate}</strong></div>
              <div>الوقت: <strong>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</strong></div>
              <div>الوردية: <strong>{currentShift.pharmacistName}</strong></div>
              <div>العملة: <strong>{currencyFullName} ({currency})</strong></div>
            </div>
          </div>
        </div>

        {/* Executive Daily Highlights Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 space-y-1">
            <span className="text-[10px] font-bold text-slate-600 block">إجمالي مبيعات اليوم</span>
            <div className="text-base font-black text-slate-900 font-mono">
              {grossSales.toFixed(2)} <span className="text-[10px] font-sans font-bold text-teal-700">{currency}</span>
            </div>
            <span className="text-[10px] text-slate-500 block">{dailyInvoices.length} فاتورة بيع</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-2.5 space-y-1">
            <span className="text-[10px] font-bold text-amber-900 block">مرتجع مبيعات اليوم</span>
            <div className="text-base font-black text-amber-900 font-mono">
              -{totalSalesReturns.toFixed(2)} <span className="text-[10px] font-sans font-bold text-amber-700">{currency}</span>
            </div>
            <span className="text-[10px] text-amber-700 block">{dailySalesReturns.length} سند إرجاع</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 space-y-1">
            <span className="text-[10px] font-bold text-rose-800 block">إجمالي المصروفات</span>
            <div className="text-base font-black text-rose-900 font-mono">
              -{totalDailyExpenses.toFixed(2)} <span className="text-[10px] font-sans font-bold text-rose-700">{currency}</span>
            </div>
            <span className="text-[10px] text-rose-700 block">{dailyExpenses.length} سند صرف</span>
          </div>

          <div className={`border rounded-xl p-2.5 space-y-1 ${dailyNetIncome >= 0 ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' : 'bg-rose-50/80 border-rose-300 text-rose-950'}`}>
            <span className="text-[10px] font-bold block">صافي الدخل اليومي</span>
            <div className="text-base font-black font-mono">
              {dailyNetIncome.toFixed(2)} <span className="text-[10px] font-sans font-bold">{currency}</span>
            </div>
            <span className="text-[10px] font-bold block">
              هامش: {netIncomeMarginPercent.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Section 1: Official Daily Income Statement Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
            <h3 className="font-black text-xs sm:text-sm text-slate-900">
              أولاً: قائمة الدخل اليومية التشغيلية (Daily Profit & Loss Statement)
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
              {dailyInvoices.length} فاتورة صيدلانية
            </span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b text-[11px]">
                <tr>
                  <th className="py-1.5 px-3">البند المحاسبي</th>
                  <th className="py-1.5 px-3">البيان والتفاصيل المحاسبية</th>
                  <th className="py-1.5 px-3 text-left">المبلغ بالريال ({currency})</th>
                  <th className="py-1.5 px-3 text-left">النسبة المئوية</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                <tr className="font-bold text-slate-900">
                  <td className="py-2 px-3">(+) إجمالي مبيعات اليوم</td>
                  <td className="py-2 px-3 text-slate-600 text-[11px]">
                    إجمالي فواتير مبيعات اليوم الصادرة خلال يوم ({formattedSelectedDate})
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-black text-slate-900">
                    {grossSales.toFixed(2)} {currency}
                  </td>
                  <td className="py-2 px-3 text-left font-mono">100%</td>
                </tr>
                {totalSalesReturns > 0 && (
                  <tr className="text-amber-800 bg-amber-50/60 font-semibold">
                    <td className="py-2 px-3">(-) مرتجع مبيعات اليوم (سندات إرجاع مبيعات)</td>
                    <td className="py-2 px-3 text-amber-700 text-[11px]">
                      مردودات مبيعات الأدوية المسترجعة من العملاء لليوم ({dailySalesReturns.length} عملية إرجاع)
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-amber-800">
                      -{totalSalesReturns.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-amber-700">
                      {grossSales > 0 ? ((totalSalesReturns / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                )}
                <tr className="text-slate-700">
                  <td className="py-2 px-3">(-) إجمالي مصروفات اليوم (سندات الصرف)</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">
                    المصاريف التشغيلية والإدارية وسندات الصرف المنفذة لليوم ({dailyExpenses.length} سند صرف)
                  </td>
                  <td className="py-2 px-3 text-left font-mono font-bold text-rose-600">
                    -{totalDailyExpenses.toFixed(2)} {currency}
                  </td>
                  <td className="py-2 px-3 text-left font-mono text-slate-500">
                    {grossSales > 0 ? ((totalDailyExpenses / grossSales) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
                <tr className={`border-t-2 border-slate-900 font-black text-xs ${dailyNetIncome >= 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'}`}>
                  <td className="py-2.5 px-3 text-xs sm:text-sm">
                    (=) صافي الدخل اليومي {totalSalesReturns > 0 ? '(المبيعات - المرتجعات - المصروفات)' : '(المبيعات - المصروفات)'}
                  </td>
                  <td className="py-2.5 px-3 text-[11px] font-semibold">
                    {dailyNetIncome >= 0 ? 'صافي دخل إيجابي لليوم (فائض ربحي)' : 'عجز في دخل اليوم بعد المصروفات والمرتجعات'}
                  </td>
                  <td className={`py-2.5 px-3 text-left font-mono text-sm sm:text-base font-black ${dailyNetIncome >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {dailyNetIncome.toFixed(2)} {currency}
                  </td>
                  <td className={`py-2.5 px-3 text-left font-mono text-xs sm:text-sm font-black ${dailyNetIncome >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                    {netIncomeMarginPercent.toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Tabulated Sales Channels & Cash Flow Schedules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2">
          {/* Table 1: Sales Channels Schedule */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
              <h3 className="font-black text-xs text-slate-900">
                ثانياً: جدول قنوات مبيعات وتحصيل اليوم (Sales Channels)
              </h3>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2.5">قناة التحصيل</th>
                    <th className="py-1.5 px-2.5 text-left font-mono">المبلغ ({currency})</th>
                    <th className="py-1.5 px-2.5 text-left font-mono">النسبة %</th>
                    <th className="py-1.5 px-2.5 text-center">نوع القيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مبيعات نقدية (درج الكاشير Cash)
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                      {cashSales.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                      {grossSales > 0 ? ((cashSales / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-emerald-700 font-bold">
                      نقد الصندوق
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مبيعات المحافظ الإلكترونية (جيب / كاش / محفظتي / وان كاش)
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                      {cardSales.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                      {grossSales > 0 ? ((cardSales / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-teal-700 font-bold">
                      محافظ إلكترونية
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مطالبات شركات التأمين الطبي (المبلغ على الشركة)
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                      {insuranceCompanySales.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                      {grossSales > 0 ? ((insuranceCompanySales / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-indigo-700 font-bold">
                      مطالبة شركة
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      تحمل ومساهمة عملاء التأمين (المبلغ على العميل)
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                      {insuranceCopaySales.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                      {grossSales > 0 ? ((insuranceCopaySales / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-teal-700 font-bold">
                      تحمل مريض
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مبيعات آجلة وذمم عملاء (Credit)
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                      {creditSales.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                      {grossSales > 0 ? ((creditSales / grossSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-rose-700 font-bold">
                      ذمم مدينة
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-[11px]">
                  <tr>
                    <td className="py-1.5 px-2.5 font-bold">
                      صافي مبيعات اليوم ({dailyInvoices.length} فاتورة):
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-black text-slate-900">
                      {totalSales.toFixed(2)} {currency}
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-black">100.0%</td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-500 font-mono">
                      متوسط: {(dailyInvoices.length > 0 ? grossSales / dailyInvoices.length : 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Table 2: Cash Outflow & Comparison Schedule */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
              <h3 className="font-black text-xs text-slate-900">
                ثالثاً: جدول التدفقات الخارجة والمقارنة اليومية
              </h3>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                  <tr>
                    <th className="py-1.5 px-2.5">البند المحاسبي</th>
                    <th className="py-1.5 px-2.5 text-left font-mono">المبلغ ({currency})</th>
                    <th className="py-1.5 px-2.5 text-center">طريقة السداد</th>
                    <th className="py-1.5 px-2.5 text-center">البيان والأثر</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مصروفات نقدية مدفوعة من الدرج
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-rose-700">
                      -{cashDailyExpenses.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-700">
                      💵 نقد فوري
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-rose-600 font-semibold">
                      خصم من رصيد الصندوق
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      مصروفات مسددة بحوالات بنكية
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-700">
                      -{bankDailyExpenses.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-700">
                      💳 تحويل بنكي
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-600">
                      خصم بنكي
                    </td>
                  </tr>
                  {totalSalesReturns > 0 && (
                    <tr className="hover:bg-slate-50 bg-amber-50/50">
                      <td className="py-1.5 px-2.5 font-bold text-amber-900">
                        مردودات مبيعات اليوم المستردة
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-amber-800">
                        -{totalSalesReturns.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-amber-800 font-bold">
                        {dailySalesReturns.length} سند إرجاع
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-amber-700 font-semibold">
                        مخصوم من إيراد اليوم
                      </td>
                    </tr>
                  )}
                  <tr className="hover:bg-slate-50">
                    <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                      صافي دخل يوم أمس للمقارنة
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-800">
                      {prevNetIncome.toFixed(2)}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-500 font-mono">
                      يوم أمس
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] font-bold">
                      <span className={netIncomeChange >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {netIncomeChange >= 0 ? `+${netIncomeChange.toFixed(1)}% نمو` : `${netIncomeChange.toFixed(1)}% انخفاض`}
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-[11px]">
                  <tr>
                    <td className="py-1.5 px-2.5 font-bold">
                      إجمالي سندات الصرف المنفذة:
                    </td>
                    <td className="py-1.5 px-2.5 text-left font-mono font-black text-rose-800">
                      -{totalDailyExpenses.toFixed(2)} {currency}
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-700 font-bold">
                      {dailyExpenses.length} سند صرف
                    </td>
                    <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-600 font-mono">
                      اعتماد الصيدلي
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Section 3: Expenses Ledger Table */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
            <h3 className="font-black text-xs text-slate-900">
              رابعاً: بيان سندات الصرف والمصروفات المنصرفة لليوم ({dailyExpenses.length} سند)
            </h3>
            <span className="text-[11px] font-bold text-rose-700 font-mono">
              المجموع: {totalDailyExpenses.toFixed(2)} {currency}
            </span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b text-[11px]">
                <tr>
                  <th className="py-1 px-2.5">رقم السند</th>
                  <th className="py-1 px-2.5">الوقت</th>
                  <th className="py-1 px-2.5">بند المصروف</th>
                  <th className="py-1 px-2.5">البيان والملاحظات</th>
                  <th className="py-1 px-2.5">طريقة الصرف</th>
                  <th className="py-1 px-2.5 text-left">المبلغ بالريال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[11px]">
                {dailyExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-slate-400">
                      لم تُسجل أي سندات مصروفات في هذا اليوم المحدد
                    </td>
                  </tr>
                ) : (
                  dailyExpenses.slice(0, 6).map((exp) => (
                    <tr key={exp.id}>
                      <td className="py-1 px-2.5 font-mono text-slate-500">{exp.id}</td>
                      <td className="py-1 px-2.5 text-slate-600">
                        {new Date(exp.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-1 px-2.5 font-semibold text-slate-800">{exp.title}</td>
                      <td className="py-1 px-2.5 text-slate-500">{exp.notes || '-'}</td>
                      <td className="py-1 px-2.5 text-slate-600">
                        {exp.paymentMethod === 'cash' ? 'نقدي (من الدرج)' : 'تحويل بنكي'}
                      </td>
                      <td className="py-1 px-2.5 font-bold text-rose-700 font-mono text-left">
                        -{exp.amount.toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))
                )}
                {dailyExpenses.length > 6 && (
                  <tr className="bg-slate-50 text-slate-500 font-semibold text-[10px]">
                    <td colSpan={5} className="py-1 px-2.5 text-right">
                      ... وباقي عدد ({dailyExpenses.length - 6}) سندات مصروفات إضافية (مضمنة في إجمالي المصروفات أعلاه)
                    </td>
                    <td className="py-1 px-2.5 text-left font-mono font-bold text-rose-700">
                      -{dailyExpenses.slice(6).reduce((sum, e) => sum + e.amount, 0).toFixed(2)} {currency}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Top Sold Medicines */}
        {medicinesSoldMap.length > 0 && (
          <div className="space-y-1.5">
            <h3 className="font-black text-xs text-slate-900 border-r-4 border-teal-700 pr-2">
              خامساً: أعلى الأصناف الدوائية مساهمة في دخل وأرباح اليوم ({medicinesSoldMap.length} صنف تم بيعه)
            </h3>
            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b text-[11px]">
                  <tr>
                    <th className="py-1 px-2.5 w-8 text-center">#</th>
                    <th className="py-1 px-2.5">اسم الصنف الدوائي</th>
                    <th className="py-1 px-2.5 text-center">الكمية المباعة</th>
                    <th className="py-1 px-2.5 text-left">إجمالي المبيعات ({currency})</th>
                    <th className="py-1 px-2.5 text-left">مجمل ربح الصنف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {medicinesSoldMap.slice(0, 5).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1 px-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-1 px-2.5 font-bold text-slate-800">{item.name}</td>
                      <td className="py-1 px-2.5 text-center font-mono font-semibold">{item.quantity}</td>
                      <td className="py-1 px-2.5 text-left font-mono font-bold text-slate-900">{item.revenue.toFixed(2)} {currency}</td>
                      <td className="py-1 px-2.5 text-left font-mono font-bold text-emerald-700">+{item.profit.toFixed(2)} {currency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 5: Signatures & Stamp */}
        <div className="pt-3 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs print:pt-2">
          <div>
            <p className="font-bold text-slate-700 mb-2">إعداد وتدقيق الصيدلي المناوب</p>
            <div className="border-t border-dashed border-slate-400 w-28 mx-auto pt-0.5 text-[10px] text-slate-400 font-bold">
              {currentShift.pharmacistName}
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-700 mb-2">المحاسب والمدير المالي</p>
            <div className="border-t border-dashed border-slate-400 w-28 mx-auto pt-0.5 text-[10px] text-slate-400">
              التوقيع والمراجعة
            </div>
          </div>

          <div>
            <p className="font-bold text-slate-700 mb-2">اعتماد إدارة الصيدلية وختمها</p>
            <div className="border-t border-dashed border-slate-400 w-28 mx-auto pt-0.5 text-[10px] text-slate-400">
              الختم الرسمي
            </div>
          </div>
        </div>

        {/* Section 6: Document Verification Footer */}
        <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 print:flex">
          <span>نظام إدارة الصيدلية المتكامل • كشف وتدقيق صافي الدخل اليومي والأرباح المعتمد</span>
          <span>نسخة رسمية معتمدة • صفحة 1 من 1</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 bg-white">
      {/* Top Controls & Date Bar (Hidden during print) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">حساب وتحليل صافي الدخل اليومي</h2>
              {isToday && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  اليوم المباشر (Today)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              حساب دقيق لصافي دخل اليوم: إجمالي مبيعات اليوم ناقصاً إجمالي المصروفات
            </p>
          </div>
        </div>

        {/* Date Selector Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleShiftDate(1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="اليوم التالي"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Calendar className="w-4 h-4 text-teal-600" />
            <input
              type="date"
              value={selectedDateStr}
              onChange={(e) => setSelectedDateStr(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => handleShiftDate(-1)}
            className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition cursor-pointer"
            title="اليوم السابق"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetToday}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isToday ? 'bg-teal-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            اليوم
          </button>

          <button
            onClick={handleSetYesterday}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            أمس
          </button>

          <button
            onClick={() => setIsPreviewModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            title="معاينة التقرير الرسمي المنسق A4 وطباعته"
          >
            <Eye className="w-4 h-4" />
            <span>معاينة التقرير الرسمي (A4)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition cursor-pointer shadow-sm"
            title="طباعة التقرير الرسمي فوراً"
          >
            <Printer className="w-4 h-4 text-teal-400" />
            <span>طباعة التقرير</span>
          </button>
        </div>
      </div>

      {/* Screen Interactive Dashboard Layout (Hidden during print) */}
      <div className="space-y-6 print:hidden">
        {/* Date Title Banner */}
        <div className="text-center bg-teal-50/70 border border-teal-200/80 rounded-2xl py-2 px-4 text-xs font-bold text-teal-900 flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-600" />
            <span>تاريخ التقرير: <strong>{formattedSelectedDate}</strong></span>
          </span>
          <span className="text-[11px] text-teal-700 flex items-center gap-3 flex-wrap">
            <span>عدد الفواتير الصادرة: <strong>{dailyInvoices.length}</strong></span>
            {dailySalesReturns.length > 0 && (
              <span className="text-amber-800 font-bold bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                <RotateCcw className="w-3 h-3 text-amber-700" />
                <span>مرتجع المبيعات: <strong>{dailySalesReturns.length} سند (-{totalSalesReturns.toFixed(2)} {CURRENCY})</strong></span>
              </span>
            )}
            <span>عدد سندات الصرف: <strong>{dailyExpenses.length}</strong></span>
          </span>
        </div>

        {/* Daily Net Income HERO CARD */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-lg relative overflow-hidden transition ${
            dailyNetIncome >= 0
              ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 border-emerald-800/60 text-white'
              : 'bg-gradient-to-br from-rose-950 via-slate-900 to-amber-950 border-rose-800/60 text-white'
          }`}
        >
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-emerald-300">
                {dailyNetIncome >= 0 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>صافي أرباح يومية موجبة (فائض ربحي)</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>عجز في دخل اليوم (المصروفات تجاوزت هامش الربح)</span>
                  </>
                )}
              </div>

              <h3 className="text-sm font-semibold text-slate-300">
                صافي الدخل اليومي الحقيقي (Net Daily Income)
              </h3>

              <div className="flex items-baseline gap-3">
                <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight">
                  {dailyNetIncome.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-400 font-sans">
                  {CURRENCY}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                <span>
                  هامش صافي الدخل من المبيعات:{' '}
                  <strong className={dailyNetIncome >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {netIncomeMarginPercent.toFixed(1)}%
                  </strong>
                </span>
                <span>•</span>
                <span>
                  مقارنة بيوم أمس:{' '}
                  <strong className={netIncomeChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {netIncomeChange >= 0 ? `+${netIncomeChange.toFixed(1)}%` : `${netIncomeChange.toFixed(1)}%`}
                  </strong>
                </span>
              </div>
            </div>

            {/* Quick Financial Formula Summary Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-xs space-y-2 min-w-[280px]">
              <div className="font-bold text-slate-200 border-b border-white/10 pb-1.5 flex items-center justify-between">
                <span>معادلة صافي دخل اليوم:</span>
                <span className="text-[10px] text-teal-300 font-mono">Net Daily Income</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>(+) إجمالي مبيعات اليوم:</span>
                <span className="font-mono font-bold text-white">
                  {grossSales.toFixed(2)} {CURRENCY}
                </span>
              </div>
              {totalSalesReturns > 0 && (
                <div className="flex justify-between text-amber-300 font-semibold bg-amber-900/30 px-2 py-0.5 rounded">
                  <span>(-) مرتجع مبيعات اليوم ({dailySalesReturns.length}):</span>
                  <span className="font-mono font-bold">
                    -{totalSalesReturns.toFixed(2)} {CURRENCY}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-rose-300">
                <span>(-) إجمالي المصروفات:</span>
                <span className="font-mono font-bold">
                  -{totalDailyExpenses.toFixed(2)} {CURRENCY}
                </span>
              </div>
              <div className="flex justify-between text-emerald-300 font-extrabold border-t border-white/20 pt-2 text-sm">
                <span>(=) صافي الدخل اليومي:</span>
                <span className="font-mono font-bold">
                  {dailyNetIncome.toFixed(2)} {CURRENCY}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Accounting Breakdown 3-Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. Daily Revenue */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-teal-700 font-semibold">
              <span>1. إجمالي مبيعات اليوم {totalSalesReturns > 0 ? '(الصافي)' : ''}</span>
              <span className="p-1.5 rounded-xl bg-teal-50 text-teal-600">
                <ShoppingBag className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans text-teal-600 font-bold">{CURRENCY}</span>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-slate-100 pt-2 space-y-1">
              {totalSalesReturns > 0 && (
                <div className="flex justify-between text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                  <span>مرتجع مبيعات مخصوم:</span>
                  <span className="font-mono">-{totalSalesReturns.toFixed(2)} {CURRENCY} ({dailySalesReturns.length} سند)</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>نقد الكاشير: {cashSales.toFixed(2)} {CURRENCY}</span>
                <span>محافظ (جيب/كاش/محفظتي/وان كاش): {cardSales.toFixed(2)} {CURRENCY}</span>
              </div>
              {(creditSales > 0 || insuranceSales > 0) && (
                <div className="flex justify-between items-center text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                  <span>آجل: <strong className="font-mono text-slate-700">{creditSales.toFixed(2)}</strong></span>
                  <span className="flex items-center gap-1.5">
                    <span>تأمين:</span>
                    <span>على الشركة <strong className="font-mono text-indigo-700 font-bold">{insuranceCompanySales.toFixed(2)}</strong></span>
                    <span>•</span>
                    <span>على العميل <strong className="font-mono text-teal-700 font-bold">{insuranceCopaySales.toFixed(2)}</strong></span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Daily Operating Expenses */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-rose-700 font-semibold">
              <span>2. إجمالي المصروفات</span>
              <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
                <TrendingDown className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-rose-900 font-mono">
              {totalDailyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans text-rose-600 font-bold">{CURRENCY}</span>
            </div>
            <div className="text-[11px] text-rose-700 border-t border-rose-50 pt-2 flex justify-between">
              <span>من الدرج نقد: {cashDailyExpenses.toFixed(2)}</span>
              <span>بنكي: {bankDailyExpenses.toFixed(2)}</span>
            </div>
          </div>

          {/* 3. Daily Net Income */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
              <span>3. صافي الدخل اليومي {totalSalesReturns > 0 ? '(المبيعات - المرتجع - المصروفات)' : '(المبيعات - المصروفات)'}</span>
              <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className={`text-2xl font-black font-mono ${dailyNetIncome >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
              {dailyNetIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs font-sans text-emerald-600 font-bold">{CURRENCY}</span>
            </div>
            <div className="text-[11px] text-emerald-700 border-t border-emerald-50 pt-2 flex justify-between">
              <span>نسبة صافي الدخل من المبيعات:</span>
              <span className="font-bold text-emerald-800">{netIncomeMarginPercent.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Revenue Breakdown Proportional Bar */}
        {grossSales > 0 && (
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>توزيع مبيعات اليوم بين المصروفات والمرتجعات وصافي الدخل:</span>
              <span className="text-slate-500 font-normal text-[11px]">
                المبيعات = {totalSalesReturns > 0 ? 'المرتجعات + ' : ''}المصروفات + صافي الدخل
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-5 rounded-full overflow-hidden flex bg-slate-100 border border-slate-200">
              {totalSalesReturns > 0 && (
                <div
                  style={{ width: `${Math.min(100, Math.max(0, (totalSalesReturns / grossSales) * 100))}%` }}
                  className="bg-amber-500 hover:bg-amber-600 transition"
                  title={`مرتجع المبيعات: ${((totalSalesReturns / grossSales) * 100).toFixed(1)}%`}
                ></div>
              )}
              <div
                style={{ width: `${Math.min(100, Math.max(0, (totalDailyExpenses / grossSales) * 100))}%` }}
                className="bg-rose-500 hover:bg-rose-600 transition"
                title={`المصروفات: ${((totalDailyExpenses / grossSales) * 100).toFixed(1)}%`}
              ></div>
              <div
                style={{ width: `${Math.min(100, Math.max(0, (dailyNetIncome / grossSales) * 100))}%` }}
                className="bg-emerald-500 hover:bg-emerald-600 transition"
                title={`صافي الدخل: ${((dailyNetIncome / grossSales) * 100).toFixed(1)}%`}
              ></div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-1">
              {totalSalesReturns > 0 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="text-amber-800">
                    مرتجع المبيعات: <strong>{totalSalesReturns.toFixed(2)} {CURRENCY} ({((totalSalesReturns / grossSales) * 100).toFixed(1)}%)</strong>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                <span className="text-rose-700">
                  إجمالي المصروفات: <strong>{totalDailyExpenses.toFixed(2)} {CURRENCY} ({((totalDailyExpenses / grossSales) * 100).toFixed(1)}%)</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span className="text-emerald-700">
                  صافي الدخل اليومي: <strong>{dailyNetIncome.toFixed(2)} {CURRENCY} ({((dailyNetIncome / grossSales) * 100).toFixed(1)}%)</strong>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Daily Sales Returns List (Displayed when returns exist for the selected date) */}
        {dailySalesReturns.length > 0 && (
          <div className="bg-amber-50/70 rounded-3xl border border-amber-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">مرتجعات مبيعات اليوم المخصومة</h4>
                  <p className="text-[11px] text-amber-800">({dailySalesReturns.length} عملية إرجاع تم خصمها مباشرة من دخل اليوم)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-900 font-mono bg-white px-3 py-1 rounded-xl border border-amber-200">
                الإجمالي المسترد: -{totalSalesReturns.toFixed(2)} {CURRENCY}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {dailySalesReturns.map((ret) => (
                <div
                  key={ret.id}
                  onClick={() => onOpenReturnReceipt && onOpenReturnReceipt(ret)}
                  className="p-3 bg-white hover:bg-amber-50/50 rounded-2xl border border-amber-200 transition cursor-pointer flex items-center justify-between text-xs shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-950">{ret.returnNumber}</span>
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                        {ret.refundMethod === 'cash' ? 'نقدي' : 'بطاقة'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-600 block mt-0.5">
                      {new Date(ret.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} •{' '}
                      {ret.customerName || 'عميل'} • {ret.items.length} أصناف
                    </span>
                    {ret.invoiceNumber && (
                      <span className="text-[10px] text-slate-400 font-mono block">
                        فاتورة رقم: {ret.invoiceNumber}
                      </span>
                    )}
                  </div>
                  <div className="text-left font-mono font-bold text-amber-700">
                    -{ret.totalAmount.toFixed(2)} {CURRENCY}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Two Column Layout: Daily Invoices vs Daily Expenses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Invoices List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">فواتير مبيعات اليوم</h4>
                  <p className="text-[11px] text-slate-400">({dailyInvoices.length} فاتورة صيدلانية)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-teal-700">
                {totalSales.toFixed(2)} {CURRENCY}
              </span>
            </div>

            {dailyInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                لم تصدر أي فواتير مبيعات في هذا التاريخ المحدد
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {dailyInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => onViewInvoice && onViewInvoice(inv)}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200 transition cursor-pointer flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-800">{inv.invoiceNumber}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                          {inv.paymentMethod === 'cash'
                            ? 'نقدي'
                            : inv.paymentMethod === 'card'
                            ? `محفظة (${inv.walletProvider || 'جيب/كاش/محفظتي/وان كاش'})`
                            : inv.paymentMethod === 'insurance'
                            ? 'تأمين طبي'
                            : 'آجل'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {new Date(inv.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {inv.items.length} أصناف
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-slate-900 block font-mono">
                        {inv.grandTotal.toFixed(2)} {CURRENCY}
                      </span>
                      <span className="text-[10px] text-emerald-600 block">
                        ربح: +{inv.grossProfit.toFixed(2)} {CURRENCY}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Daily Expenses List */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">مصروفات اليوم المخصومة</h4>
                  <p className="text-[11px] text-slate-400">({dailyExpenses.length} سند صرف)</p>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-700">
                {totalDailyExpenses.toFixed(2)} {CURRENCY}
              </span>
            </div>

            {dailyExpenses.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">
                لم تُسجل أي سندات مصروفات في هذا التاريخ المحدد
              </p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {dailyExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{exp.title}</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {new Date(exp.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {exp.paymentMethod === 'cash' ? '💵 نقد من الدرج' : '💳 تحويل بنكي'}
                      </span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-rose-700 font-mono text-sm block">
                        -{exp.amount.toFixed(2)} {CURRENCY}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">{exp.id}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Medicines Today */}
        {medicinesSoldMap.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-3">
            <h4 className="font-bold text-sm text-slate-800">
              أعلى الأصناف الدوائية مساهمة في دخل وأرباح اليوم ({medicinesSoldMap.length} صنف تم بيعه)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {medicinesSoldMap.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800 block">{item.name}</span>
                    <span className="text-[11px] text-slate-500">الكمية المباعة: {item.quantity}</span>
                  </div>
                  <div className="text-left font-mono">
                    <span className="font-bold text-slate-900 block">{item.revenue.toFixed(2)} {CURRENCY}</span>
                    <span className="text-[10px] text-emerald-600 block">ربح: +{item.profit.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Official Printable Report (The single authoritative report rendered during print) */}
      <div className="hidden print:block w-full">
        {renderOfficialPrintableReport(false)}
      </div>

      {/* Official A4 Report Preview Modal (On-screen preview only, hidden in print to prevent duplication) */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 print:hidden">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
            {/* Modal Top Bar */}
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                <span className="font-bold text-xs">
                  معاينة تقرير صافي الدخل اليومي الرسمي (A4 PDF) - {pharmacySettings?.name || 'الصيدلية النموذجية'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>طباعة / حفظ PDF</span>
                </button>
                <button
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body (Screen Preview) */}
            <div className="overflow-y-auto max-h-[85vh] p-2">
              {renderOfficialPrintableReport(true)}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-3 bg-slate-50 border-t flex justify-end gap-2">
              <button
                onClick={() => setIsPreviewModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة التقرير (Ctrl+P)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
