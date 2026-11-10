import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Building,
  FileSpreadsheet,
  Printer,
  Trash2,
  FileText,
  AlertCircle,
  Tag,
  TrendingDown,
  Clock,
  Layers,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Receipt,
  X
} from 'lucide-react';
import { Expense, Shift, SystemUser, CURRENCY, PharmacySettings } from '../types';

interface ExpensesViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onDeleteExpense: (expenseId: string) => void;
  currentShift: Shift;
  currentUser?: SystemUser | null;
  onSyncToSheets?: () => void;
  pharmacySettings?: PharmacySettings;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
  currentShift,
  currentUser,
  onSyncToSheets,
  pharmacySettings,
}) => {
  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedVoucherForPrint, setSelectedVoucherForPrint] = useState<Expense | null>(null);

  // New Expense Form State
  const [formCategory, setFormCategory] = useState<Expense['category']>('utilities');
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formPaymentMethod, setFormPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [formNotes, setFormNotes] = useState('');

  // Category labels and badge colors
  const categoryConfig: Record<
    Expense['category'],
    { label: string; color: string; bg: string; icon: string }
  > = {
    rent: { label: 'إيجار الصيدلية', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', icon: '🏢' },
    salaries: { label: 'رواتب ومكافآت كادر', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200', icon: '👥' },
    utilities: { label: 'كهرباء وتبريد ومياه', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: '⚡' },
    cleaning: { label: 'نظافة ومعقمات ومطهرات', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: '🧹' },
    supplies: { label: 'مطبوعات وأكياس ورولات', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: '📦' },
    repairs: { label: 'صيانة ثلاجات وأجهزة', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200', icon: '🔧' },
    other: { label: 'نثريات ومصروفات أخرى', color: 'text-slate-700', bg: 'bg-slate-50 border-slate-200', icon: '📋' },
  };

  // Filter expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((exp) => {
      // Search
      const matchSearch =
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.recordedBy && exp.recordedBy.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      // Category filter
      if (selectedCategory !== 'all' && exp.category !== selectedCategory) {
        return false;
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'all' && exp.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Period filter
      const expDate = new Date(exp.date);
      const now = new Date();

      if (periodFilter === 'today') {
        const isToday =
          expDate.getDate() === now.getDate() &&
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (periodFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        if (expDate < oneWeekAgo) return false;
      } else if (periodFilter === 'month') {
        const isCurrentMonth =
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear();
        if (!isCurrentMonth) return false;
      } else if (periodFilter === 'custom') {
        if (customStartDate && expDate < new Date(customStartDate)) return false;
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          if (expDate > end) return false;
        }
      }

      return true;
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, periodFilter, customStartDate, customEndDate]);

  // Aggregate stats
  const totalAmountFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalCountFiltered = filteredExpenses.length;

  const totalAllExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Today's expenses
  const todayExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [expenses]);

  const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
  const todayCashTotal = todayExpenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const todayBankTotal = todayExpenses
    .filter((e) => e.paymentMethod === 'bank')
    .reduce((sum, e) => sum + e.amount, 0);

  // Cash vs Bank overall
  const totalCashFiltered = filteredExpenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((sum, e) => sum + e.amount, 0);
  const totalBankFiltered = filteredExpenses
    .filter((e) => e.paymentMethod === 'bank')
    .reduce((sum, e) => sum + e.amount, 0);

  // Form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formAmount);
    if (!formTitle.trim()) {
      alert('يرجى كتابة بيان المصروف وعنوانه');
      return;
    }
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر بالريال اليمني');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category: formCategory,
      title: formTitle.trim(),
      amount: amountNum,
      paymentMethod: formPaymentMethod,
      notes: formNotes.trim() || undefined,
      recordedBy: currentUser?.name || currentShift.pharmacistName || 'الصيدلي المناوب',
    });

    // Reset & close
    setFormTitle('');
    setFormAmount('');
    setFormNotes('');
    setIsAddModalOpen(false);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'رقم السند',
      'التاريخ والوقت',
      'بيان المصروف',
      'التصنيف',
      'المبلغ (ر.ي)',
      'طريقة الدفع',
      'مسجل السند',
      'الملاحظات',
    ];

    const rows = filteredExpenses.map((exp) => [
      exp.id,
      new Date(exp.date).toLocaleString('ar-EG'),
      `"${exp.title.replace(/"/g, '""')}"`,
      categoryConfig[exp.category]?.label || exp.category,
      exp.amount.toFixed(2),
      exp.paymentMethod === 'cash' ? 'نقداً من الدرج' : 'تحويل بنكي',
      exp.recordedBy || '',
      `"${(exp.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `كشف_مصروفات_الصيدلية_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and KPI Cards */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900">إدارة المصروفات التشغيلية والنثريات</h2>
              <span className="text-[11px] bg-rose-100 text-rose-800 font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                الريال اليمني ({CURRENCY})
              </span>
            </div>
            <p className="text-xs text-slate-500">
              تسجيل ومتابعة بنود الصرف، سندات القبض والدفع، وخصمها من دخل الوردية واليومية
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onSyncToSheets && (
            <button
              onClick={onSyncToSheets}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>مزامنة Google Sheets</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>تصدير Excel/CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ تسجيل سند صرف جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Expenses */}
        <div className="bg-gradient-to-br from-rose-50 to-white p-4 rounded-3xl border border-rose-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-rose-700 font-semibold mb-1">
            <span>مصروفات اليوم</span>
            <span className="p-1.5 rounded-xl bg-rose-100">
              <Clock className="w-4 h-4 text-rose-600" />
            </span>
          </div>
          <div className="text-2xl font-black text-rose-900">
            {todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-bold text-rose-600">{CURRENCY}</span>
          </div>
          <div className="mt-2 text-[11px] text-rose-600 flex items-center justify-between border-t border-rose-100 pt-2">
            <span>من الدرج كاش: {todayCashTotal.toFixed(2)} {CURRENCY}</span>
            <span>بنكي: {todayBankTotal.toFixed(2)} {CURRENCY}</span>
          </div>
        </div>

        {/* Filtered Total */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
            <span>إجمالي النطاق المحدد</span>
            <span className="p-1.5 rounded-xl bg-slate-100">
              <DollarSign className="w-4 h-4 text-slate-600" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {totalAmountFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-bold text-slate-500">{CURRENCY}</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 border-t border-slate-100 pt-2 flex items-center justify-between">
            <span>عدد السندات: {totalCountFiltered} سند</span>
            <span>
              متوسط السند: {totalCountFiltered > 0 ? (totalAmountFiltered / totalCountFiltered).toFixed(1) : 0} {CURRENCY}
            </span>
          </div>
        </div>

        {/* Cash Drawer Expenses */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-700 font-semibold mb-1">
            <span>منصرف نقدي (من الدرج)</span>
            <span className="p-1.5 rounded-xl bg-amber-100">
              <Receipt className="w-4 h-4 text-amber-600" />
            </span>
          </div>
          <div className="text-2xl font-black text-amber-900">
            {totalCashFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-bold text-amber-600">{CURRENCY}</span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 border-t border-amber-100 pt-2">
            يؤثر مباشرة على نقدية الكاشير وتصفية الوردية
          </div>
        </div>

        {/* Bank / Electronic Expenses */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-blue-700 font-semibold mb-1">
            <span>منصرف تحويل بنكي / حساب</span>
            <span className="p-1.5 rounded-xl bg-blue-100">
              <CreditCard className="w-4 h-4 text-blue-600" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-900">
            {totalBankFiltered.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-bold text-blue-600">{CURRENCY}</span>
          </div>
          <div className="mt-2 text-[11px] text-blue-600 border-t border-blue-100 pt-2">
            تم السداد عبر الحساب البنكي للصيدلية دون لمس الدرج
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        {/* Quick Period Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="font-bold text-slate-700 ml-2">الفترة الزمنية:</span>
            {[
              { id: 'all', label: 'كافة الفترات' },
              { id: 'today', label: 'مصروفات اليوم' },
              { id: 'week', label: 'آخر 7 أيام' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'custom', label: 'نطاق مخصص' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriodFilter(p.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                  periodFilter === p.id
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {periodFilter === 'custom' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">من:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs"
              />
              <span className="text-slate-500">إلى:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          )}
        </div>

        {/* Search & Category Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم السند، البيان، أو اسم الصيدلي..."
              className="w-full pl-3 pr-9 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Category dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">كافة بنود المصروفات (الكل)</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method dropdown */}
          <div>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 font-semibold focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="all">كافة طرق السداد (الكل)</option>
              <option value="cash">💵 نقداً من الدرج (Cash)</option>
              <option value="bank">💳 تحويل بنكي وحساب (Bank)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-800">قائمة سندات المصروفات</h3>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
              {filteredExpenses.length} سند
            </span>
          </div>
          <span className="text-xs text-slate-400">مرتبة من الأحدث إلى الأقدم</span>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">لا توجد سندات مصروفات مطابقة للبحث</p>
            <p className="text-xs text-slate-400">يمكنك تسجيل سند صرف جديد عبر الضغط على الزر أعلاه</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">رقم السند</th>
                  <th className="py-3 px-4">التاريخ والوقت</th>
                  <th className="py-3 px-4">بيان المصروف</th>
                  <th className="py-3 px-4">البند والتصنيف</th>
                  <th className="py-3 px-4">طريقة السداد</th>
                  <th className="py-3 px-4">المسجل</th>
                  <th className="py-3 px-4 text-left">المبلغ بالريال اليمني</th>
                  <th className="py-3 px-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const cat = categoryConfig[exp.category] || categoryConfig.other;
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {exp.id}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{new Date(exp.date).toLocaleDateString('ar-EG')}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(exp.date).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-800 block">{exp.title}</span>
                        {exp.notes && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            ملاحظة: {exp.notes}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${cat.bg} ${cat.color}`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.label}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            exp.paymentMethod === 'cash'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {exp.paymentMethod === 'cash' ? '💵 نقد من الدرج' : '💳 تحويل بنكي'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {exp.recordedBy || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-left font-bold text-slate-900 font-mono text-sm">
                        {exp.amount.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{' '}
                        <span className="text-xs text-rose-600 font-sans">{CURRENCY}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedVoucherForPrint(exp)}
                            title="عرض وطباعة سند الصرف"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50 transition cursor-pointer"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف سند المصروف "${exp.title}" بمبلغ ${exp.amount} ${CURRENCY}؟`)) {
                                onDeleteExpense(exp.id);
                              }
                            }}
                            title="حذف سند المصروف"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">تسجيل سند صرف جديد</h3>
                  <p className="text-[11px] text-slate-400">إدخال مصروف تشغيلي للصيدلية بالريال اليمني</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">بند وتصنيف المصروف:</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium"
                  >
                    {Object.entries(categoryConfig).map(([key, cfg]) => (
                      <option key={key} value={key}>
                        {cfg.icon} {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة السداد / الصرف:</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-800 font-medium"
                  >
                    <option value="cash">💵 نقداً من الدرج (يخصم من الصندوق)</option>
                    <option value="bank">💳 تحويل بنكي (حساب الصيدلية)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">بيان المصروف (العنوان):</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="مثال: فاتورة كهرباء تبريد ثلاجات الأدوية لشهر أكتوبر..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  المبلغ المنصرف بالريال اليمني ({CURRENCY}):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.5"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-2.5 pl-14 border border-slate-300 rounded-xl text-sm font-bold font-mono focus:outline-none focus:border-rose-500"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-rose-600">
                    {CURRENCY}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الملاحظات أو اسم المستلم:</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="مثال: شركة الكهرباء / استلمها المهندس..."
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] text-slate-500 flex items-center justify-between">
                <span>الصيدلي / المسجل:</span>
                <span className="font-bold text-slate-800">
                  {currentUser?.name || currentShift.pharmacistName}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md cursor-pointer transition"
                >
                  حفظ وتسجيل السند
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Voucher Modal */}
      {selectedVoucherForPrint && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <span className="font-bold text-sm text-slate-900">معاينة سند الصرف الرسمي</span>
              <button
                onClick={() => setSelectedVoucherForPrint(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Voucher printable body */}
            <div
              id="printable-voucher-content"
              className="border-2 border-dashed border-slate-300 p-5 rounded-2xl bg-slate-50/50 space-y-3"
            >
              <div className="text-center border-b pb-2">
                {pharmacySettings?.logoUrl && (
                  <div className="flex justify-center mb-1">
                    <img
                      src={pharmacySettings.logoUrl}
                      alt="شعار"
                      className="w-10 h-10 object-contain mx-auto"
                    />
                  </div>
                )}
                <h4 className="font-bold text-base text-slate-900">{pharmacySettings?.name || 'الصيدلية النموذجية'}</h4>
                {pharmacySettings?.address && (
                  <p className="text-[10px] text-slate-500">{pharmacySettings.address}</p>
                )}
                <p className="text-[10px] text-slate-500">سند صرف مصروفات تشغيلية</p>
                <div className="font-mono text-xs font-bold text-rose-700 mt-1">
                  رقم السند: {selectedVoucherForPrint.id}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">التاريخ:</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedVoucherForPrint.date).toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">البند:</span>
                  <span className="font-bold text-slate-800">
                    {categoryConfig[selectedVoucherForPrint.category]?.label || selectedVoucherForPrint.category}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">البيان:</span>
                  <span className="font-bold text-slate-800">{selectedVoucherForPrint.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-500">طريقة الصرف:</span>
                  <span className="font-bold text-slate-800">
                    {selectedVoucherForPrint.paymentMethod === 'cash' ? 'نقداً من الدرج' : 'تحويل بنكي'}
                  </span>
                </div>
                {selectedVoucherForPrint.notes && (
                  <div className="flex justify-between py-1 border-b border-slate-200">
                    <span className="text-slate-500">الملاحظات:</span>
                    <span className="font-bold text-slate-800">{selectedVoucherForPrint.notes}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 bg-rose-50 px-3 rounded-xl border border-rose-200 mt-2">
                  <span className="font-bold text-rose-800">المبلغ المنصرف:</span>
                  <span className="font-black text-sm font-mono text-rose-900">
                    {selectedVoucherForPrint.amount.toFixed(2)} {CURRENCY}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-600">
                <div>
                  <span className="block font-bold">المسجل / المحاسب</span>
                  <span className="block mt-1 text-slate-800 font-medium">
                    {selectedVoucherForPrint.recordedBy || 'د. أحمد الصيدلي'}
                  </span>
                  <div className="mt-3 border-b border-slate-400 w-24 mx-auto"></div>
                </div>
                <div>
                  <span className="block font-bold">المستلم / التوقيع</span>
                  <span className="block mt-1 text-slate-400">.......................</span>
                  <div className="mt-3 border-b border-slate-400 w-24 mx-auto"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedVoucherForPrint(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
