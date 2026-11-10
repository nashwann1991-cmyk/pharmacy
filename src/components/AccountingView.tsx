import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  CreditCard,
  Clock,
  Plus,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Building,
  UserCheck,
  Scale,
  Calendar,
  Lock,
  Unlock,
  Printer
} from 'lucide-react';
import { Invoice, Expense, Shift, Supplier, PharmacySettings } from '../types';

interface AccountingViewProps {
  invoices: Invoice[];
  expenses: Expense[];
  currentShift: Shift;
  suppliers: Supplier[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onCloseShift: (actualCash: number, notes?: string) => void;
  onOpenNewShift: (pharmacistName: string, openingCash: number) => void;
  onSyncAccountingToSheets?: () => void;
  onOpenSuppliersReport?: (supplierId?: string) => void;
  pharmacySettings?: PharmacySettings;
}

export const AccountingView: React.FC<AccountingViewProps> = ({
  invoices,
  expenses,
  currentShift,
  suppliers,
  onAddExpense,
  onCloseShift,
  onOpenNewShift,
  onSyncAccountingToSheets,
  onOpenSuppliersReport,
  pharmacySettings,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'income' | 'expenses' | 'shifts' | 'suppliers'>('income');
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isCloseShiftOpen, setIsCloseShiftOpen] = useState(false);
  const [isOpenNewShiftOpen, setIsOpenNewShiftOpen] = useState(false);

  // Add Expense Form
  const [expenseForm, setExpenseForm] = useState({
    category: 'utilities' as Expense['category'],
    title: '',
    amount: 0,
    paymentMethod: 'cash' as Expense['paymentMethod'],
    notes: '',
  });

  // Close shift form
  const [countedCash, setCountedCash] = useState<number>(currentShift.expectedClosingCash);
  const [shiftNotes, setShiftNotes] = useState('');

  // Open new shift form
  const [newShiftPharmacist, setNewShiftPharmacist] = useState('د. أحمد الصيدلي');
  const [newShiftOpeningCash, setNewShiftOpeningCash] = useState<number>(500);

  // Accounting aggregates
  const totalSales = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
  const totalCOGS = invoices.reduce((sum, inv) => sum + inv.costTotal, 0);
  const grossProfit = totalSales - totalCOGS;
  const grossMarginPercent = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0';

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const netProfit = grossProfit - totalExpenses;

  // Payment Breakdown
  const cashSalesTotal = invoices.filter((i) => i.paymentMethod === 'cash').reduce((sum, i) => sum + i.grandTotal, 0);
  const cardSalesTotal = invoices.filter((i) => i.paymentMethod === 'card').reduce((sum, i) => sum + i.grandTotal, 0);
  const creditSalesTotal = invoices.filter((i) => i.paymentMethod === 'credit').reduce((sum, i) => sum + i.grandTotal, 0);
  const insuranceSalesTotal = invoices.filter((i) => i.paymentMethod === 'insurance').reduce((sum, i) => sum + i.grandTotal, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.title || expenseForm.amount <= 0) {
      alert('يرجى كتابة عنوان المصروف وإدخال مبلغ صحيح');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category: expenseForm.category,
      title: expenseForm.title,
      amount: expenseForm.amount,
      paymentMethod: expenseForm.paymentMethod,
      notes: expenseForm.notes,
      recordedBy: currentShift.pharmacistName,
    });

    setExpenseForm({
      category: 'utilities',
      title: '',
      amount: 0,
      paymentMethod: 'cash',
      notes: '',
    });
    setIsAddExpenseOpen(false);
  };

  const handleConfirmCloseShift = () => {
    onCloseShift(countedCash, shiftNotes);
    setIsCloseShiftOpen(false);
  };

  const handleConfirmOpenShift = () => {
    onOpenNewShift(newShiftPharmacist, newShiftOpeningCash);
    setIsOpenNewShiftOpen(false);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Sub tabs and quick actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <button
            onClick={() => setActiveSubTab('income')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'income'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>قائمة الدخل والأرباح (P&L)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('expenses')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'expenses'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>المصروفات اليومية ({expenses.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('shifts')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'shifts'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>إغلاق الوردية وجرد الكاشير</span>
          </button>

          <button
            onClick={() => setActiveSubTab('suppliers')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'suppliers'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>مستودعات وشركات الأدوية</span>
          </button>
        </div>

        {onSyncAccountingToSheets && (
          <button
            onClick={onSyncAccountingToSheets}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>تحديث تقرير الأرباح في Sheets</span>
          </button>
        )}
      </div>

      {/* SUBTAB 1: Income Statement / P&L */}
      {activeSubTab === 'income' && (
        <div className="space-y-4">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">إجمالي الإيرادات (المبيعات)</span>
              <p className="text-2xl font-black text-slate-900">{totalSales.toFixed(2)} <span className="text-xs font-normal">ر.ي</span></p>
              <span className="text-[11px] text-teal-600 mt-1 block font-medium">من {invoices.length} فاتورة صيدلانية</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">تكلفة الأدوية المباعة (COGS)</span>
              <p className="text-2xl font-black text-slate-700">{totalCOGS.toFixed(2)} <span className="text-xs font-normal">ر.ي</span></p>
              <span className="text-[11px] text-slate-400 mt-1 block">تكلفة الشراء من الموردين</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">مجمل الربح (Gross Profit)</span>
              <p className="text-2xl font-black text-teal-700">{grossProfit.toFixed(2)} <span className="text-xs font-normal">ر.ي</span></p>
              <span className="text-[11px] text-emerald-600 mt-1 block font-bold">هامش ربح إجمالي {grossMarginPercent}%</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 block mb-1">صافي الأرباح (Net Profit)</span>
              <p className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {netProfit.toFixed(2)} <span className="text-xs font-normal">ر.ي</span>
              </p>
              <span className="text-[11px] text-slate-400 mt-1 block">بعد خصم المصروفات ({totalExpenses.toFixed(0)} ر.ي)</span>
            </div>
          </div>

          {/* Income Statement Table & Payment Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Detailed Statement */}
            <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 mb-4 pb-2 border-b flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-600" />
                <span>قائمة الدخل المفصلة للصيدلية (Income Statement)</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-slate-100 font-bold text-slate-800 text-sm">
                  <span>(+) إجمالي مبيعات الأدوية والمستلزمات</span>
                  <span className="text-slate-900">{totalSales.toFixed(2)} ر.ي</span>
                </div>

                <div className="flex justify-between py-1.5 text-slate-600 pr-4">
                  <span>(-) تكلفة البضاعة المباعة (سعر شراء الأدوية)</span>
                  <span className="text-rose-600 font-semibold">- {totalCOGS.toFixed(2)} ر.ي</span>
                </div>

                <div className="flex justify-between py-2.5 bg-slate-50 px-3 rounded-xl font-extrabold text-slate-800">
                  <span>(=) مجمل الربح التشغيلي</span>
                  <span className="text-teal-700">{grossProfit.toFixed(2)} ر.ي</span>
                </div>

                <div className="pt-2 text-slate-700 font-bold">المصروفات التشغيلية والإدارية:</div>

                {expenses.map((exp) => (
                  <div key={exp.id} className="flex justify-between py-1 text-slate-500 pr-4 text-[11px]">
                    <span>• {exp.title} ({exp.date.split('T')[0]})</span>
                    <span className="text-rose-600">- {exp.amount.toFixed(2)} ر.ي</span>
                  </div>
                ))}

                <div className="flex justify-between py-1.5 text-slate-600 pr-4 border-t border-slate-100 font-semibold">
                  <span>إجمالي المصروفات التشغيلية</span>
                  <span className="text-rose-700">- {totalExpenses.toFixed(2)} ر.ي</span>
                </div>

                <div className="flex justify-between py-3 bg-emerald-50 border border-emerald-200 px-4 rounded-xl font-black text-sm text-emerald-900">
                  <span>(=) صافي الربح النهائي للصيدلية</span>
                  <span className="text-base font-black text-emerald-800">{netProfit.toFixed(2)} ر.ي</span>
                </div>
              </div>
            </div>

            {/* Payment Method Distribution */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b">
                توزيع طرق التحصيل والمبيعات
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-teal-500"></div>
                    <span className="font-semibold text-slate-700">نقداً (في الصندوق):</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{cashSalesTotal.toFixed(2)} ر.ي</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="font-semibold text-slate-700">محافظ إلكترونية (جيب / كاش / محفظتي / وان كاش):</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{cardSalesTotal.toFixed(2)} ر.ي</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    <span className="font-semibold text-slate-700">تأمين طبي (تحمل):</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{insuranceSalesTotal.toFixed(2)} ر.ي</span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                    <span className="font-semibold text-slate-700">آجل (ذمم عملاء):</span>
                  </div>
                  <span className="font-extrabold text-slate-900">{creditSalesTotal.toFixed(2)} ر.ي</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: Expenses Registry */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-3.5 rounded-2xl border border-slate-200">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">سجل المصروفات والنثريات</h3>
              <p className="text-xs text-slate-400">تسجيل فواتير الكهرباء، إيجار الصيدلية، مطبوعات، وأدوات النظافة</p>
            </div>
            <button
              onClick={() => setIsAddExpenseOpen(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>تسجيل مصروف جديد</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                <tr>
                  <th className="p-3">رقم الحركة</th>
                  <th className="p-3">التاريخ</th>
                  <th className="p-3">بند المصروف</th>
                  <th className="p-3">التفاصيل والبيان</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">طريقة الدفع</th>
                  <th className="p-3">المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono text-slate-400">{exp.id}</td>
                    <td className="p-3 text-slate-600">{new Date(exp.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 font-semibold text-slate-800">{getExpenseCategoryTitle(exp.category)}</td>
                    <td className="p-3 text-slate-600">
                      {exp.title}
                      {exp.notes && <span className="text-[10px] text-slate-400 block">{exp.notes}</span>}
                    </td>
                    <td className="p-3 font-extrabold text-rose-600">{exp.amount.toFixed(2)} ر.ي</td>
                    <td className="p-3">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                        {exp.paymentMethod === 'cash' ? 'نقدي من الصندوق' : 'تحويل بنكي'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">{exp.recordedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 3: Shifts & Cash Register Reconciliation */}
      {activeSubTab === 'shifts' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                  <h3 className="font-bold text-base text-slate-800">بيانات الوردية الحالية</h3>
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs px-2.5 py-0.5 rounded-full font-bold">
                    {currentShift.status === 'open' ? 'نشطة الآن' : 'مغلقة'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  بدأت في: {new Date(currentShift.startTime).toLocaleTimeString('ar-EG')} • الصيدلي المسؤول: <strong>{currentShift.pharmacistName}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {currentShift.status === 'open' ? (
                  <button
                    onClick={() => {
                      setCountedCash(currentShift.expectedClosingCash);
                      setIsCloseShiftOpen(true);
                    }}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
                  >
                    <Lock className="w-4 h-4" />
                    <span>إغلاق الوردية وجرد الدرج (Z-Report)</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOpenNewShiftOpen(true)}
                    className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer transition"
                  >
                    <Unlock className="w-4 h-4" />
                    <span>بدء وردية جديدة</span>
                  </button>
                )}
              </div>
            </div>

            {/* Shift Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">عهدة الافتتاح (Opening Cash):</span>
                <span className="text-base font-extrabold text-slate-800">{currentShift.openingCash.toFixed(2)} ر.ي</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">مبيعات نقدية (درج الكاشير):</span>
                <span className="text-base font-extrabold text-teal-700">+{currentShift.cashSales.toFixed(2)} ر.ي</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-slate-500 block mb-1">مصروفات نقدية خرجت من الدرج:</span>
                <span className="text-base font-extrabold text-rose-600">-{currentShift.cashExpenses.toFixed(2)} ر.ي</span>
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 font-bold block mb-1">الرصيد النقدي المتوقع بالدرج:</span>
                <span className="text-lg font-black text-emerald-900">{currentShift.expectedClosingCash.toFixed(2)} ر.ي</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2">
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">مبيعات المحافظ (جيب/كاش/محفظتي/وان كاش): </span>
                <strong className="text-slate-800">{currentShift.cardSales.toFixed(2)} ر.ي</strong>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg">
                <span className="text-slate-500">إجمالي مبيعات الوردية: </span>
                <strong className="text-slate-800">{currentShift.totalSales.toFixed(2)} ر.ي</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: Suppliers */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span>مستودعات وشركات توزيع الأدوية</span>
                    <span className="text-[11px] bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2 py-0.5 rounded-full">
                      إجمالي الذمم الدائنة: {suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0).toFixed(2)} ر.ي
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    متابعة حسابات الموردين، الأرصدة المستحقة للشركات، ومعاينة كشوفات الحساب والطباعة
                  </p>
                </div>
              </div>
            </div>

            {onOpenSuppliersReport && (
              <button
                onClick={() => onOpenSuppliersReport()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
                title="معاينة وطباعة تقرير كشف حسابات المستودعات والشركات (الذمم الدائنة)"
              >
                <Printer className="w-4 h-4 text-indigo-200" />
                <span>معاينة وطباعة تقرير الشركات والمستودعات</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-indigo-200 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                    <Building className="w-4 h-4 text-indigo-600" />
                    <h4>{sup.name}</h4>
                  </div>
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                    {sup.companyType === 'warehouse' ? 'مستودع أدوية' : sup.companyType === 'distributor' ? 'شركة توزيع' : 'مورد'}
                  </span>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>المسؤول: {sup.contactPerson || '-'}</p>
                  <p className="font-mono">الهاتف: {sup.phone || sup.mobile || '-'}</p>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] block">الرصيد المستحق:</span>
                    <span className={`font-extrabold text-sm ${sup.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {sup.balanceDue.toFixed(2)} ر.ي
                    </span>
                  </div>

                  {onOpenSuppliersReport && (
                    <button
                      onClick={() => onOpenSuppliersReport(sup.id)}
                      className="flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="معاينة وطباعة كشف حساب هذا المستودع"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>كشف حساب</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Expense */}
      {isAddExpenseOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200">
            <div className="flex justify-between items-center border-b pb-2 mb-3">
              <h3 className="font-bold text-sm text-slate-800">تسجيل سند صرف / مصروف جديد</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-600 mb-1">بند المصروف:</label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="w-full border rounded-lg p-2 outline-none"
                >
                  <option value="utilities">كهرباء وتبريد ومياه</option>
                  <option value="supplies">أكياس ومطبوعات ومستلزمات</option>
                  <option value="cleaning">نظافة ومطهرات</option>
                  <option value="rent">إيجار الصيدلية</option>
                  <option value="salaries">رواتب وسلف ومكافآت</option>
                  <option value="repairs">صيانة أجهزة وثلاجات</option>
                  <option value="other">مصروفات أخرى</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">بيان المصروف:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة صيانة تكييف الصيدلية"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="w-full border rounded-lg p-2 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">المبلغ (ر.ي):</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  required
                  value={expenseForm.amount || ''}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full border rounded-lg p-2 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">طريقة السداد:</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                  className="w-full border rounded-lg p-2 outline-none"
                >
                  <option value="cash">نقداً من درج الكاشير (يخصم من الوردية)</option>
                  <option value="bank">تحويل بنكي من حساب الصيدلية</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddExpenseOpen(false)}
                  className="px-3 py-1.5 border rounded-lg"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm"
                >
                  حفظ المصروف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Close Shift */}
      {isCloseShiftOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-800 font-bold border-b pb-2">
              <Lock className="w-5 h-5 text-rose-600" />
              <h3 className="text-sm">إغلاق الوردية وجرد نقدية الصندوق (Z-Report)</h3>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border">
              <div className="flex justify-between">
                <span>الرصيد النقدي المحسوب بالدرج:</span>
                <strong>{currentShift.expectedClosingCash.toFixed(2)} ر.ي</strong>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">المبلغ الفعلي المعدود في الدرج الآن (ر.ي):</label>
              <input
                type="number"
                step="0.01"
                value={countedCash}
                onChange={(e) => setCountedCash(parseFloat(e.target.value) || 0)}
                className="w-full text-base font-extrabold p-2.5 border-2 border-teal-500 rounded-xl outline-none"
              />
            </div>

            {/* Variance indicator */}
            {(() => {
              const variance = countedCash - currentShift.expectedClosingCash;
              return (
                <div
                  className={`p-2.5 rounded-xl border text-center font-bold ${
                    Math.abs(variance) < 0.01
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : variance > 0
                      ? 'bg-blue-50 border-blue-300 text-blue-800'
                      : 'bg-rose-50 border-rose-300 text-rose-800'
                  }`}
                >
                  {Math.abs(variance) < 0.01
                    ? '✓ الصندوق متطابق تماماً بدون عجز أو زيادة'
                    : variance > 0
                    ? `فائض في الصندوق بمقدار +${variance.toFixed(2)} ر.ي`
                    : `يوجد عجز في الصندوق بمقدار ${variance.toFixed(2)} ر.ي`}
                </div>
              );
            })()}

            <div>
              <label className="block text-slate-600 font-semibold mb-1">ملاحظات الإغلاق والتسليم:</label>
              <textarea
                placeholder="ملاحظات تسليم الوردية..."
                value={shiftNotes}
                onChange={(e) => setShiftNotes(e.target.value)}
                className="w-full border rounded-lg p-2 text-xs h-16 outline-none"
              ></textarea>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setIsCloseShiftOpen(false)}
                className="px-3 py-1.5 border rounded-lg"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                تأكيد إغلاق الوردية
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Open New Shift */}
      {isOpenNewShiftOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">افتتاح وردية عمل جديدة</h3>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">اسم الصيدلي المستلم:</label>
              <input
                type="text"
                value={newShiftPharmacist}
                onChange={(e) => setNewShiftPharmacist(e.target.value)}
                className="w-full border rounded-lg p-2 outline-none font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">عهدة الافتتاح النقدية (ر.ي):</label>
              <input
                type="number"
                value={newShiftOpeningCash}
                onChange={(e) => setNewShiftOpeningCash(parseFloat(e.target.value) || 0)}
                className="w-full border rounded-lg p-2 outline-none font-bold"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setIsOpenNewShiftOpen(false)}
                className="px-3 py-1.5 border rounded-lg"
              >
                إلغاء
              </button>
              <button
                onClick={handleConfirmOpenShift}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                بدء الوردية الآن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getExpenseCategoryTitle(cat: string): string {
  const map: Record<string, string> = {
    rent: 'إيجار الصيدلية',
    salaries: 'رواتب ومكافآت',
    utilities: 'كهرباء وتبريد ومياه',
    cleaning: 'نظافة ومطهرات',
    supplies: 'أكياس ومستلزمات',
    repairs: 'صيانة وأجهزة',
    other: 'مصروفات أخرى',
  };
  return map[cat] || cat;
}
