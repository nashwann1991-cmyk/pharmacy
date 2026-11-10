import React from 'react';
import { Printer, X, FileText, CheckCircle2, AlertTriangle, Building, Pill, ArrowUpRight, TrendingUp, TrendingDown, DollarSign, Package, ShieldCheck, Receipt } from 'lucide-react';
import { FinancialReportData } from '../utils/exportUtils';
import { PharmacySettings } from '../types';

interface PDFReportModalProps {
  data: FinancialReportData | null;
  onClose: () => void;
  pharmacySettings?: PharmacySettings;
}

export const PDFReportModal: React.FC<PDFReportModalProps> = ({ data, onClose, pharmacySettings }) => {
  if (!data) return null;

  const handlePrint = () => {
    window.print();
  };

  const pharmacyName = pharmacySettings?.name || 'الصيدلية النموذجية';
  const subtitle = pharmacySettings?.subtitle || 'رعاية صيدلانية متكاملة ومستلزمات طبية';
  const address = pharmacySettings?.address || '';
  const taxNumber = pharmacySettings?.taxNumber;
  const commercialRegister = pharmacySettings?.commercialRegister;
  const licenseNumber = pharmacySettings?.licenseNumber;
  const phone = pharmacySettings?.phone || pharmacySettings?.mobile;
  const currency = pharmacySettings?.currency || 'ر.ي';
  const currencyFullName = pharmacySettings?.currencyFullName || 'ريال يمني';

  const reportSerial = `REP-FIN-${data.startDate.replace(/-/g, '')}-${data.endDate.replace(/-/g, '')}`;
  const printTimestamp = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

  // Expiry & low stock counts
  const lowStockCount = data.medicines.filter((m) => m.stock <= m.minStockLevel).length;
  const nearExpiryCount = data.medicines.filter((m) => {
    const exp = new Date(m.expiryDate);
    const six = new Date();
    six.setMonth(six.getMonth() + 6);
    return exp <= six;
  }).length;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:block print:w-full">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:block print:m-0">
        {/* Controls Bar (Hidden in print) */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-xs block">
                معاينة التقرير المالي والمحاسبي الدوري (A4) - {pharmacyName}
              </span>
              <span className="text-[10px] text-slate-400">
                قوائم مالية مجدولة مطابقة لمعايير التقارير المؤسسية للشركات
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-md"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة / حفظ بصيغة PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official A4 Document Container */}
        <div
          id="pharmacy-official-report-print"
          className="p-6 sm:p-8 overflow-y-auto bg-white text-slate-900 text-xs leading-relaxed space-y-4 print:p-2 print:space-y-3.5 print:overflow-visible print:block print:w-full"
        >
          {/* ========================================================= */}
          {/* 1. CORPORATE LETTERHEAD (ترويسة الشركات الرسمية)            */}
          {/* ========================================================= */}
          <div className="border-b-2 border-slate-900 pb-3 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              {pharmacySettings?.logoUrl ? (
                <div className="w-16 h-16 rounded-2xl border border-slate-300 p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={pharmacySettings.logoUrl}
                    alt={pharmacyName}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-teal-800 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
                  <Building className="w-7 h-7 text-teal-200" />
                </div>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  {pharmacyName}
                </h1>
                <p className="text-[11px] text-slate-600 font-medium">
                  {subtitle} {address && `• ${address}`}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-slate-600 mt-1 font-semibold">
                  {commercialRegister && <span>سجل تجاري: <strong className="font-mono text-slate-800">{commercialRegister}</strong></span>}
                  {taxNumber && <span>• الرقم الضريبي: <strong className="font-mono text-slate-800">{taxNumber}</strong></span>}
                  {licenseNumber && <span>• ترخيص المنشأة: <strong className="font-mono text-slate-800">{licenseNumber}</strong></span>}
                  {phone && <span>• هاتف: <strong className="font-mono text-slate-800">{phone}</strong></span>}
                </div>
              </div>
            </div>

            {/* Document Reference Box */}
            <div className="text-left flex flex-col items-end flex-shrink-0">
              <span className="bg-slate-900 text-white px-3 py-1 rounded-lg font-black text-xs inline-block tracking-wide shadow-xs">
                تقرير الأداء المالي والأرباح الدوري
              </span>
              <span className="text-[9px] text-slate-500 font-mono mt-0.5 font-bold tracking-wider">
                AUDITED FINANCIAL & OPERATING STATEMENT
              </span>
              <div className="text-[10px] text-slate-700 mt-1 space-y-0.5 text-left border border-slate-200 bg-slate-50 px-2.5 py-1 rounded-lg">
                <div>المرجع: <strong className="font-mono text-slate-900">{reportSerial}</strong></div>
                <div>الفترة: <strong className="text-teal-900">{data.periodLabel}</strong></div>
                <div>تاريخ الاستخراج: <strong>{printTimestamp} ({printTime})</strong></div>
                <div>العملة: <strong>{currencyFullName} ({currency})</strong></div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. EXECUTIVE KPI SUMMARY RIBBON (شريط المؤشرات التنفيذية) */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900">
                أولاً: ملخص الأداء المالي والتنفيذي للفترة (Executive Financial Highlights)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">
                الفترة من {data.startDate} إلى {data.endDate}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Gross Sales */}
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-slate-600 block">
                  1. إجمالي المبيعات (Revenue)
                </span>
                <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                  {data.totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-sans text-teal-700 font-bold">{currency}</span>
                </div>
                <span className="text-[10px] text-slate-500 block">
                  عدد {data.invoicesCount} فاتورة صادرة
                </span>
              </div>

              {/* Operating Expenses */}
              <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-rose-800 block">
                  2. المصروفات التشغيلية (Expenses)
                </span>
                <div className="text-base sm:text-lg font-black text-rose-900 font-mono">
                  -{data.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-sans text-rose-700 font-bold">{currency}</span>
                </div>
                <span className="text-[10px] text-rose-700 block">
                  نسبة {data.totalSales > 0 ? ((data.totalExpenses / data.totalSales) * 100).toFixed(1) : '0.0'}% من المبيعات
                </span>
              </div>

              {/* Net Profit */}
              <div className={`border rounded-xl p-2.5 space-y-1 ${data.netProfit >= 0 ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950' : 'bg-rose-50/70 border-rose-300 text-rose-950'}`}>
                <span className="text-[10px] font-bold block">
                  3. صافي الأرباح (Net Profit)
                </span>
                <div className="text-base sm:text-lg font-black font-mono">
                  {data.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-sans font-bold">{currency}</span>
                </div>
                <span className="text-[10px] font-bold block">
                  هامش ربح: {data.totalSales > 0 ? ((data.netProfit / data.totalSales) * 100).toFixed(1) : '0.0'}%
                </span>
              </div>

              {/* Inventory Valuation */}
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-xl p-2.5 space-y-1">
                <span className="text-[10px] font-bold text-indigo-900 block">
                  4. تقييم المخزون (Inventory Cost)
                </span>
                <div className="text-base sm:text-lg font-black text-indigo-950 font-mono">
                  {data.inventoryValuationCost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  <span className="text-[10px] font-sans text-indigo-700 font-bold">{currency}</span>
                </div>
                <span className="text-[10px] text-indigo-700 block">
                  {data.medicines.length} صنف مسجل بالرفوف
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. AUDITED INCOME STATEMENT TABLE (قائمة الدخل المجدولة)  */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900">
                ثانياً: قائمة الأرباح والخسائر والدخل التشغيلي (Statement of Profit & Loss)
              </h3>
              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono border border-slate-200">
                معيار GAAP / IFRS
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-16 text-center font-mono">الكود</th>
                    <th className="py-2 px-3">البيان والتفاصيل المحاسبية</th>
                    <th className="py-2 px-3 text-left font-mono">المخصوم (-)</th>
                    <th className="py-2 px-3 text-left font-mono">المحصل (+)</th>
                    <th className="py-2 px-3 text-left font-mono">الرصيد ({currency})</th>
                    <th className="py-2 px-3 text-left font-mono w-20">النسبة %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {/* Row 1: Gross Sales */}
                  <tr className="hover:bg-slate-50/70 font-semibold text-slate-900">
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">4010</td>
                    <td className="py-2 px-3">
                      <span className="font-bold block">(+) إجمالي إيرادات مبيعات الأدوية والمستلزمات (Gross Revenue)</span>
                      <span className="text-[10px] text-slate-500 block font-normal">
                        إجمالي فواتير المبيعات الصادرة خلال فترة التقرير ({data.invoicesCount} فاتورة)
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                      {data.totalSales.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-black text-slate-900">
                      {data.totalSales.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold">100.0%</td>
                  </tr>

                  {/* Row 2: COGS */}
                  <tr className="hover:bg-slate-50/70 text-slate-700">
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">5010</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold block">(-) تكلفة البضاعة المباعة (Cost of Goods Sold - COGS)</span>
                      <span className="text-[10px] text-slate-500 block">
                        التكلفة الشرائية المعتمدة للأدوية والمواد المباعة من المستودعات والموردين
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                      -{data.totalCOGS.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                      -{data.totalCOGS.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-600">
                      {data.totalSales > 0 ? ((data.totalCOGS / data.totalSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>

                  {/* Subtotal: Gross Profit */}
                  <tr className="bg-teal-50/80 font-black text-teal-950 border-t border-b border-teal-200">
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-teal-800">4000</td>
                    <td className="py-2 px-3">
                      <span className="block">(=) مجمل الربح التشغيلي للفترة (Gross Operating Profit)</span>
                      <span className="text-[10px] text-teal-700 font-normal block">
                        الفائض الإيرادي الناتج من حركة البيع بعد تغطية تكلفة الأدوية المباعة
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-left font-mono text-teal-900 font-black text-sm">
                      {data.grossProfit.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-teal-900">
                      {data.grossMarginPercent.toFixed(1)}%
                    </td>
                  </tr>

                  {/* Row 4: Operating Expenses */}
                  <tr className="hover:bg-slate-50/70 text-slate-700">
                    <td className="py-2 px-3 text-center font-mono text-[11px] text-slate-500">6010</td>
                    <td className="py-2 px-3">
                      <span className="font-semibold block">(-) المصروفات التشغيلية والإدارية (Operating Expenses)</span>
                      <span className="text-[10px] text-slate-500 block">
                        إجمالي سندات الصرف المنفذة (إيجار، رواتب، كهرباء، صيانة، نثريات) ({data.expenses.length} سند صرف)
                      </span>
                    </td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                      -{data.totalExpenses.toFixed(2)}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2 px-3 text-left font-mono font-bold text-rose-700">
                      -{data.totalExpenses.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-3 text-left font-mono text-slate-600">
                      {data.totalSales > 0 ? ((data.totalExpenses / data.totalSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>

                  {/* Grand Total: Net Profit */}
                  <tr className={`border-t-2 border-b-4 border-double border-slate-900 font-black text-xs ${data.netProfit >= 0 ? 'bg-emerald-50 text-emerald-950' : 'bg-rose-50 text-rose-950'}`}>
                    <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-800">3000</td>
                    <td className="py-2.5 px-3 text-xs sm:text-sm">
                      <span className="block font-black">(=) صافي الربح المحقق للفترة (Net Profit for Period)</span>
                      <span className="text-[10px] font-semibold block text-slate-600">
                        {data.netProfit >= 0 ? 'فائض أرباح نظامية ومحققة خاضعة للتوزيع والترحيل' : 'عجز مالي صافٍ للفترة المحددة'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left font-mono text-slate-400">-</td>
                    <td className="py-2.5 px-3 text-left font-mono text-slate-400">-</td>
                    <td className={`py-2.5 px-3 text-left font-mono text-sm sm:text-base font-black ${data.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {data.netProfit.toFixed(2)} {currency}
                    </td>
                    <td className={`py-2.5 px-3 text-left font-mono text-xs sm:text-sm font-black ${data.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-700'}`}>
                      {data.totalSales > 0 ? ((data.netProfit / data.totalSales) * 100).toFixed(1) : '0.0'}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 4. TABULATED REVENUE CHANNELS & INVENTORY VALUATION        */}
          {/* ========================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 print:grid-cols-2">
            {/* Table 4A: Sales Channels Breakdown */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
                <h3 className="font-black text-xs text-slate-900">
                  ثالثاً: جدول تحليل قنوات المبيعات والتحصيل (Revenue Channels)
                </h3>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2.5">قناة التحصيل</th>
                      <th className="py-1.5 px-2.5 text-left font-mono">المبلغ ({currency})</th>
                      <th className="py-1.5 px-2.5 text-left font-mono">النسبة %</th>
                      <th className="py-1.5 px-2.5 text-center">طبيعة القيد</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px]">
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        مبيعات نقدية (درج الكاشير Cash)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                        {data.cashSales.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                        {data.totalSales > 0 ? ((data.cashSales / data.totalSales) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-emerald-700 font-bold">
                        نقد فوري
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        مبيعات المحافظ الإلكترونية (جيب / كاش / محفظتي / وان كاش)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                        {data.cardSales.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                        {data.totalSales > 0 ? ((data.cardSales / data.totalSales) * 100).toFixed(1) : '0.0'}%
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
                        {(data.insuranceCompanySales ?? data.insuranceSales).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                        {data.totalSales > 0 ? (((data.insuranceCompanySales ?? data.insuranceSales) / data.totalSales) * 100).toFixed(1) : '0.0'}%
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
                        {(data.insuranceCopaySales ?? 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                        {data.totalSales > 0 ? (((data.insuranceCopaySales ?? 0) / data.totalSales) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-teal-700 font-bold">
                        تحمل مريض
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        مبيعات آجلة وذمم عملاء (Customer Credit)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                        {data.creditSales.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-600">
                        {data.totalSales > 0 ? ((data.creditSales / data.totalSales) * 100).toFixed(1) : '0.0'}%
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-rose-700 font-bold">
                        ذمم مدينة
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t border-slate-300 text-[11px]">
                    <tr>
                      <td className="py-1.5 px-2.5 font-bold">
                        إجمالي المبيعات ({data.invoicesCount} فاتورة):
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-black text-slate-900">
                        {data.totalSales.toFixed(2)} {currency}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-black">100.0%</td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-500 font-mono">
                        متوسط: {data.averageInvoiceValue.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Table 4B: Inventory Health & Valuation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
                <h3 className="font-black text-xs text-slate-900">
                  رابعاً: جدول تقييم ومؤشرات المخزون الدوائي (Inventory Valuation)
                </h3>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[10px]">
                    <tr>
                      <th className="py-1.5 px-2.5">مؤشر وتقييم المخزون</th>
                      <th className="py-1.5 px-2.5 text-left font-mono">القيمة ({currency})</th>
                      <th className="py-1.5 px-2.5 text-center">الكمية / النسبة</th>
                      <th className="py-1.5 px-2.5 text-center">مؤشر الرقابة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-[11px]">
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        قيمة المخزون بسعر الشراء (التكلفة Cost)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                        {data.inventoryValuationCost.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-600">
                        {data.medicines.length} صنف مسجل
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-teal-700 font-bold">
                        أصول متداولة
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        قيمة المخزون بسعر البيع (السوق Retail)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-slate-900">
                        {data.inventoryValuationRetail.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-600">
                        سعر الجمهور
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-slate-600">
                        قيمة البيع المتوقعة
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-teal-50/40">
                      <td className="py-1.5 px-2.5 font-bold text-teal-950">
                        الأرباح الكامنة في المخزون (Potential Profit)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-teal-800">
                        +{data.potentialProfitInStock.toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] font-bold text-teal-800">
                        {data.inventoryValuationCost > 0 ? ((data.potentialProfitInStock / data.inventoryValuationCost) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-emerald-700 font-bold">
                        فائض أرباح مرتقب
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        أصناف قاربت الانتهاء (خلال 6 أشهر)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-rose-700">
                        {nearExpiryCount} صنف
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-rose-600">
                        {data.medicines.length > 0 ? ((nearExpiryCount / data.medicines.length) * 100).toFixed(1) : 0}%
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-rose-700 font-bold">
                        {nearExpiryCount > 0 ? 'مخاطر ركود' : 'آمن تماماً'}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="py-1.5 px-2.5 font-semibold text-slate-900">
                        أصناف وصلت لحد إعادة الطلب (نقص مخزون)
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-amber-700">
                        {lowStockCount} صنف
                      </td>
                      <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-amber-600">
                        حد أدنى
                      </td>
                      <td className="py-1.5 px-2.5 text-center text-[10px] text-amber-700 font-bold">
                        {lowStockCount > 0 ? 'يتطلب طلبية' : 'مخزون كافٍ'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. TABULATED OPERATING EXPENSES SCHEDULE                   */}
          {/* ========================================================= */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between border-r-4 border-teal-700 pr-2">
              <h3 className="font-black text-xs sm:text-sm text-slate-900">
                خامساً: جدول تفاصيل سندات المصروفات وسندات الصرف ({data.expenses.length} سند صرف)
              </h3>
              <span className="text-[11px] font-bold text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                مجموع المصروفات: -{data.totalExpenses.toFixed(2)} {currency}
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-right text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300 text-[11px]">
                  <tr>
                    <th className="py-1.5 px-2.5 w-10 text-center font-mono">#</th>
                    <th className="py-1.5 px-2.5 w-24">رقم السند</th>
                    <th className="py-1.5 px-2.5 w-24">التاريخ</th>
                    <th className="py-1.5 px-2.5">بند وتصنيف المصروف</th>
                    <th className="py-1.5 px-2.5">البيان والملاحظات</th>
                    <th className="py-1.5 px-2.5 w-24">طريقة الصرف</th>
                    <th className="py-1.5 px-2.5 text-left font-mono w-28">المبلغ ({currency})</th>
                    <th className="py-1.5 px-2.5 text-left font-mono w-16">النسبة %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {data.expenses.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-4 text-center text-slate-400">
                        لا توجد أي سندات صرف أو مصروفات مسجلة في هذه الفترة المحددة
                      </td>
                    </tr>
                  ) : (
                    data.expenses.slice(0, 10).map((exp, idx) => (
                      <tr key={exp.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                        <td className="py-1.5 px-2.5 text-center font-mono text-[10px] text-slate-400">{idx + 1}</td>
                        <td className="py-1.5 px-2.5 font-mono font-bold text-slate-700">{exp.id}</td>
                        <td className="py-1.5 px-2.5 text-slate-600 font-mono text-[10px]">
                          {new Date(exp.date).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="py-1.5 px-2.5 font-semibold text-slate-900">{exp.title}</td>
                        <td className="py-1.5 px-2.5 text-slate-500 text-[10px]">{exp.notes || '-'}</td>
                        <td className="py-1.5 px-2.5 text-slate-600">
                          {exp.paymentMethod === 'cash' ? (
                            <span className="text-emerald-700 font-semibold">💵 نقدي (درج)</span>
                          ) : (
                            <span className="text-indigo-700 font-semibold">💳 تحويل بنكي</span>
                          )}
                        </td>
                        <td className="py-1.5 px-2.5 font-bold text-rose-700 font-mono text-left">
                          -{exp.amount.toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2.5 text-left font-mono text-slate-500 text-[10px]">
                          {data.totalExpenses > 0 ? ((exp.amount / data.totalExpenses) * 100).toFixed(1) : 0}%
                        </td>
                      </tr>
                    ))
                  )}
                  {data.expenses.length > 10 && (
                    <tr className="bg-slate-50 text-slate-600 font-semibold text-[10px]">
                      <td colSpan={6} className="py-1.5 px-2.5 text-right">
                        ... وباقي عدد ({data.expenses.length - 10}) سندات مصروفات إضافية مسجلة ومدرجة ضمن الإجمالي العام
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono font-bold text-rose-700">
                        -{data.expenses.slice(10).reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                      </td>
                      <td className="py-1.5 px-2.5 text-left font-mono text-slate-500">
                        {data.totalExpenses > 0 ? (((data.expenses.slice(10).reduce((sum, e) => sum + e.amount, 0)) / data.totalExpenses) * 100).toFixed(1) : 0}%
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-900 text-xs">
                  <tr>
                    <td colSpan={6} className="py-2 px-2.5 text-right">
                      إجمالي المصروفات وسندات الصرف المعتمدة للفترة:
                    </td>
                    <td className="py-2 px-2.5 text-left font-mono font-black text-rose-800 text-sm">
                      -{data.totalExpenses.toFixed(2)} {currency}
                    </td>
                    <td className="py-2 px-2.5 text-left font-mono font-black">100.0%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 6. CORPORATE SIGNATURES & AUTHORIZATION                   */}
          {/* ========================================================= */}
          <div className="pt-2 border-t border-slate-300 grid grid-cols-3 gap-4 text-center text-xs print:pt-2">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800 mb-1 text-[11px]">المحاسب المالي والمدقق</p>
              <p className="text-[10px] text-slate-500 mb-4">تم تدقيق القيود ومطابقة الحسابات</p>
              <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 text-[10px] text-slate-400 font-bold">
                التوقيع والمراجعة
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800 mb-1 text-[11px]">الصيدلي المدير المسؤول</p>
              <p className="text-[10px] text-slate-500 mb-4">مصادقة حركة الأدوية والمخزون</p>
              <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 text-[10px] text-slate-400 font-bold">
                التوقيع والختم المهني
              </div>
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <p className="font-bold text-slate-800 mb-1 text-[11px]">اعتماد الإدارة العامة والختم</p>
              <p className="text-[10px] text-slate-500 mb-4">اعتماد القوائم المالية الرسمية</p>
              <div className="border-t border-dashed border-slate-400 w-32 mx-auto pt-1 text-[10px] text-slate-400 font-bold">
                الختم الرسمي للمنشأة
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 7. DOCUMENT FOOTER & SECURITY AUDIT WATERMARK             */}
          {/* ========================================================= */}
          <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400 print:flex">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
              <span>نظام إدارة الصيدلية المتكامل • كشف مالي وقوائم محاسبية رسمية معتمدة برقم مرجعي ({reportSerial})</span>
            </span>
            <span className="font-mono">وثيقة رسمية صادرة آلياً • ص 1 من 1</span>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3 bg-slate-50 border-t flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            إغلاق
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة التقرير (Ctrl+P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
