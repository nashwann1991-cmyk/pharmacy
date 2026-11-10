import React, { useState, useMemo } from 'react';
import {
  Building,
  Plus,
  Search,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  FileSpreadsheet,
  RotateCcw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Banknote,
  Scale,
  ShieldAlert,
  ArrowUpRight,
  TrendingDown,
  Layers,
  X,
  Printer,
} from 'lucide-react';
import { Supplier, SupplierPayment, PharmacySettings, CURRENCY } from '../types';
import { exportSuppliersReportToExcel } from '../utils/exportUtils';
import { SuppliersReportModal } from './SuppliersReportModal';

interface SuppliersManagementProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onRecordSupplierPayment?: (payment: Omit<SupplierPayment, 'id'>) => void;
  onOpenPurchaseReturn?: (supplierId?: string) => void;
  pharmacySettings?: PharmacySettings;
  onShowToast: (text: string, type: 'success' | 'info' | 'error') => void;
  onOpenSuppliersReport?: (supplierId?: string) => void;
}

export const SuppliersManagement: React.FC<SuppliersManagementProps> = ({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onRecordSupplierPayment,
  onOpenPurchaseReturn,
  pharmacySettings,
  onShowToast,
  onOpenSuppliersReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'with_debt' | 'zero_debt'>('all');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentSupplierId, setPaymentSupplierId] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank' | 'cheque'>('cash');
  const [receiptVoucherNo, setReceiptVoucherNo] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [recordAsExpense, setRecordAsExpense] = useState<boolean>(true);

  const [selectedSupplierForDetails, setSelectedSupplierForDetails] = useState<Supplier | null>(null);
  const [deleteConfirmSupplier, setDeleteConfirmSupplier] = useState<Supplier | null>(null);

  // Suppliers & Accounts Payable Printable Report Modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportModalSupplierId, setReportModalSupplierId] = useState<string | undefined>(undefined);

  const handleTriggerReport = (supplierId?: string) => {
    if (onOpenSuppliersReport) {
      onOpenSuppliersReport(supplierId);
    } else {
      setReportModalSupplierId(supplierId);
      setIsReportModalOpen(true);
    }
  };

  // Form State for Add / Edit
  const [formData, setFormData] = useState<Omit<Supplier, 'id'>>({
    name: '',
    companyType: 'distributor',
    contactPerson: '',
    phone: '',
    mobile: '',
    email: '',
    address: '',
    taxNumber: '',
    commercialRegister: '',
    paymentTerms: 'credit_30',
    creditLimit: 20000,
    balanceDue: 0,
    notes: '',
    isActive: true,
  });

  // Reset form
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      name: '',
      companyType: 'distributor',
      contactPerson: '',
      phone: '',
      mobile: '',
      email: '',
      address: '',
      taxNumber: '',
      commercialRegister: '',
      paymentTerms: 'credit_30',
      creditLimit: 20000,
      balanceDue: 0,
      notes: '',
      isActive: true,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setFormData({
      name: sup.name,
      companyType: sup.companyType || 'distributor',
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      mobile: sup.mobile || '',
      email: sup.email || '',
      address: sup.address || '',
      taxNumber: sup.taxNumber || '',
      commercialRegister: sup.commercialRegister || '',
      paymentTerms: sup.paymentTerms || 'credit_30',
      creditLimit: sup.creditLimit ?? 20000,
      balanceDue: sup.balanceDue || 0,
      notes: sup.notes || '',
      isActive: sup.isActive !== false,
    });
    setIsAddEditModalOpen(true);
  };

  const handleOpenPayment = (sup?: Supplier) => {
    const target = sup || suppliers[0];
    if (!target) {
      onShowToast('لا يوجد موردون مسجلون لتسديد دفعة لهم', 'error');
      return;
    }
    setPaymentSupplierId(target.id);
    setPaymentAmount(target.balanceDue > 0 ? target.balanceDue : 500);
    setReceiptVoucherNo(`RCP-${Date.now().toString().slice(-5)}`);
    setPaymentNotes('');
    setPaymentMethod('cash');
    setIsPaymentModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      onShowToast('يرجى إدخال اسم المستودع أو شركة التوزيع', 'error');
      return;
    }

    if (!formData.phone.trim()) {
      onShowToast('يرجى إدخال رقم الهاتف للتواصل مع المورد', 'error');
      return;
    }

    if (editingSupplier) {
      onUpdateSupplier({
        ...editingSupplier,
        ...formData,
      });
      onShowToast(`تم تحديث بيانات (${formData.name}) بنجاح`, 'success');
    } else {
      onAddSupplier({
        ...formData,
        createdAt: new Date().toISOString().split('T')[0],
      });
      onShowToast(`تمت إضافة المستودع / شركة التوزيع (${formData.name}) بنجاح`, 'success');
    }

    setIsAddEditModalOpen(false);
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();

    const target = suppliers.find((s) => s.id === paymentSupplierId);
    if (!target) return;

    if (paymentAmount <= 0) {
      onShowToast('يرجى إدخال مبلغ سداد صالح أكبر من صفر', 'error');
      return;
    }

    if (onRecordSupplierPayment) {
      onRecordSupplierPayment({
        supplierId: target.id,
        supplierName: target.name,
        date: new Date().toISOString(),
        amount: paymentAmount,
        paymentMethod,
        receiptVoucherNumber: receiptVoucherNo,
        notes: paymentNotes,
        recordedBy: pharmacySettings?.name || 'الإدارة',
      });
    } else {
      // Direct balance deduction fallback
      const updatedDue = Math.max(0, target.balanceDue - paymentAmount);
      onUpdateSupplier({
        ...target,
        balanceDue: updatedDue,
      });
      onShowToast(`تم سداد ${paymentAmount.toFixed(2)} ${CURRENCY} للمستودع ${target.name} وتخفيض الذمة الدائنة`, 'success');
    }

    setIsPaymentModalOpen(false);
  };

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        sup.name.toLowerCase().includes(q) ||
        sup.contactPerson.toLowerCase().includes(q) ||
        sup.phone.includes(q) ||
        (sup.mobile && sup.mobile.includes(q)) ||
        (sup.address && sup.address.toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || sup.companyType === typeFilter;

      const matchesDebt =
        debtFilter === 'all' ||
        (debtFilter === 'with_debt' && sup.balanceDue > 0) ||
        (debtFilter === 'zero_debt' && sup.balanceDue <= 0);

      return matchesSearch && matchesType && matchesDebt;
    });
  }, [suppliers, searchTerm, typeFilter, debtFilter]);

  // Executive KPI Metrics
  const metrics = useMemo(() => {
    const totalDue = suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
    const totalCreditLimit = suppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0);
    const withDebtCount = suppliers.filter((s) => s.balanceDue > 0).length;
    const warehousesCount = suppliers.filter((s) => s.companyType === 'warehouse').length;
    const distributorsCount = suppliers.filter((s) => s.companyType === 'distributor').length;

    return {
      totalDue,
      totalCreditLimit,
      withDebtCount,
      warehousesCount,
      distributorsCount,
      totalCount: suppliers.length,
    };
  }, [suppliers]);

  const typeLabels: Record<string, { label: string; color: string }> = {
    warehouse: { label: 'مستودع أدوية مركزي', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    distributor: { label: 'شركة توزيع دوائية', color: 'bg-teal-50 text-teal-700 border-teal-200' },
    agent: { label: 'وكيل معتمد', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    manufacturer: { label: 'مصنع دوائي', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  const termsLabels: Record<string, string> = {
    cash: 'سداد نقدي عند الاستلام',
    credit_15: 'آجل 15 يوماً',
    credit_30: 'آجل 30 يوماً',
    credit_60: 'آجل 60 يوماً',
    consignment: 'بضاعة أمانة (تصريف)',
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-600/20">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <span>مستودعات وشركات توزيع الأدوية</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold px-2.5 py-0.5 rounded-full">
                  الذمم الدائنة (Accounts Payable)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                إدارة حسابات مستودعات التموين الدوائي، شركات التوزيع، تسجيل المديونيات المستحقة، السداد، ومرتجعات الأدوية
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة شركة / مستودع جديد</span>
            </button>

            <button
              onClick={() => handleOpenPayment()}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold transition shadow-sm cursor-pointer"
            >
              <Banknote className="w-4 h-4" />
              <span>سداد دفعة للمستودع</span>
            </button>

            {onOpenPurchaseReturn && (
              <button
                onClick={() => onOpenPurchaseReturn()}
                className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl font-bold transition shadow-sm cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>مرتجع مشتريات لمستودع</span>
              </button>
            )}

            <button
              onClick={() => handleTriggerReport(undefined)}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl font-bold transition shadow-sm cursor-pointer"
              title="معاينة وطباعة تقرير كشف حسابات المستودعات والشركات (الذمم الدائنة)"
            >
              <Printer className="w-4 h-4" />
              <span>معاينة وطباعة التقرير</span>
            </button>

            <button
              onClick={() => exportSuppliersReportToExcel(suppliers, pharmacySettings)}
              className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl font-bold transition shadow-sm cursor-pointer"
              title="تصدير كشف حساب الذمم الدائنة إلى Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>تصدير Excel</span>
            </button>
          </div>
        </div>

        {/* 4 Executive KPI Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 p-4 rounded-2xl border border-rose-200 shadow-sm">
            <div className="flex items-center justify-between text-rose-800 font-bold mb-1">
              <span className="text-[11px]">إجمالي الذمم الدائنة للمستودعات</span>
              <Scale className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-xl font-black text-rose-900 font-mono">
              {metrics.totalDue.toFixed(2)} {CURRENCY}
            </div>
            <span className="text-[10px] text-rose-600 mt-1 block">
              مستحقة لـ {metrics.withDebtCount} مستودع وشركة توزيع
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
              <span className="text-[11px]">إجمالي المستودعات المسجلة</span>
              <Building className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-black text-slate-800">
              {metrics.totalCount} <span className="text-xs font-normal text-slate-500">جهة توريد</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {metrics.warehousesCount} مستودع • {metrics.distributorsCount} شركة توزيع
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
              <span className="text-[11px]">سقف الائتمان الإجمالي الممنوح</span>
              <DollarSign className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-xl font-black text-teal-800 font-mono">
              {metrics.totalCreditLimit.toFixed(2)} {CURRENCY}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              الحد الأقصى للتسهيلات الآجلة
            </span>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-700 font-bold mb-1">
              <span className="text-[11px]">نسبة استغلال الائتمان</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-black text-amber-700 font-mono">
              {metrics.totalCreditLimit > 0
                ? ((metrics.totalDue / metrics.totalCreditLimit) * 100).toFixed(1)
                : 0}
              %
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              من إجمالي التسهيلات الائتمانية
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
          <div className="relative flex-1 min-w-[220px]">
            <input
              type="text"
              placeholder="ابحث باسم المستودع، شركة التوزيع، المندوب، أو الهاتف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="p-2 border rounded-xl bg-slate-50 outline-none text-xs font-semibold"
            >
              <option value="all">كل الكيانات</option>
              <option value="warehouse">مستودعات أدوية مركزية</option>
              <option value="distributor">شركات توزيع دوائية</option>
              <option value="agent">وكلاء معتمدون</option>
              <option value="manufacturer">مصانع دوائية</option>
            </select>

            <select
              value={debtFilter}
              onChange={(e) => setDebtFilter(e.target.value as any)}
              className="p-2 border rounded-xl bg-slate-50 outline-none text-xs font-semibold"
            >
              <option value="all">كل الأرصدة</option>
              <option value="with_debt">جهات لها ذمم دائنة مستحقة (&gt; 0)</option>
              <option value="zero_debt">حسابات مسددة بالكامل (0)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
              <tr>
                <th className="p-3.5">الشركة / المستودع</th>
                <th className="p-3.5">نوع النشاط</th>
                <th className="p-3.5">المندوب وبيانات الاتصال</th>
                <th className="p-3.5">شروط السداد</th>
                <th className="p-3.5">سقف الائتمان</th>
                <th className="p-3.5 text-left">الذمة الدائنة المستحقة</th>
                <th className="p-3.5 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-slate-400">
                    لم يتم العثور على أي مستودعات أو شركات توزيع مطابقة للبحث
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => {
                  const typeInfo = typeLabels[sup.companyType || 'distributor'] || {
                    label: 'مورد',
                    color: 'bg-slate-100 text-slate-700 border-slate-200',
                  };
                  const isOverCredit = sup.creditLimit && sup.balanceDue > sup.creditLimit;

                  return (
                    <tr key={sup.id} className="hover:bg-slate-50/80 transition">
                      {/* Name & ID */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold flex-shrink-0">
                            <Building className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-sm">
                              {sup.name}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                              <span>كود: {sup.id}</span>
                              {sup.taxNumber && <span>• ضريبي: {sup.taxNumber}</span>}
                              {sup.address && <span>• {sup.address}</span>}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="p-3.5">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold border inline-block ${typeInfo.color}`}
                        >
                          {typeInfo.label}
                        </span>
                      </td>

                      {/* Contact Info */}
                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800">{sup.contactPerson}</div>
                          <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{sup.phone}</span>
                            {sup.mobile && <span>/ {sup.mobile}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Payment Terms */}
                      <td className="p-3.5 text-slate-600 font-medium">
                        {termsLabels[sup.paymentTerms || 'credit_30'] || sup.paymentTerms}
                      </td>

                      {/* Credit Limit */}
                      <td className="p-3.5 font-mono text-slate-700 font-bold">
                        {sup.creditLimit ? `${sup.creditLimit.toFixed(2)} ${CURRENCY}` : 'غير محدد'}
                      </td>

                      {/* Balance Due (Accounts Payable) */}
                      <td className="p-3.5 text-left font-mono">
                        <div className="space-y-0.5">
                          <span
                            className={`text-base font-black ${
                              sup.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}
                          >
                            {sup.balanceDue.toFixed(2)} {CURRENCY}
                          </span>
                          {isOverCredit && (
                            <span className="text-[10px] text-rose-600 font-bold block flex items-center justify-end gap-1">
                              <AlertCircle className="w-3 h-3" />
                              <span>تجاوز سقف الائتمان!</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenPayment(sup)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition"
                            title="سداد دفعة وتخفيض الذمة الدائنة"
                          >
                            <Banknote className="w-4 h-4" />
                          </button>

                          {onOpenPurchaseReturn && (
                            <button
                              onClick={() => onOpenPurchaseReturn(sup.id)}
                              className="p-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition"
                              title="إرجاع أدوية لهذا المستودع (مرتجع مشتريات)"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedSupplierForDetails(sup)}
                            className="p-1.5 text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-lg cursor-pointer transition"
                            title="بطاقة وتفاصيل المستودع"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleTriggerReport(sup.id)}
                            className="p-1.5 text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer transition"
                            title="معاينة وطباعة كشف حساب هذا المستودع"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenEdit(sup)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer transition"
                            title="تعديل بيانات المورد"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteConfirmSupplier(sup)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
                            title="حذف المستودع"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT SUPPLIER                                      */}
      {/* ============================================================== */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingSupplier ? `تعديل بيانات: ${editingSupplier.name}` : 'إضافة مستودع / شركة توزيع جديدة'}
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    بيانات المستودع والاتصال وشروط الدفع والائتمان
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-white/80 hover:text-white p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم المستودع أو شركة التوزيع <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة النهدي للتوزيع والخدمات الدوائية"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-bold text-slate-800"
                  />
                </div>

                {/* Company Type */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">نوع الكيان التجاري:</label>
                  <select
                    value={formData.companyType}
                    onChange={(e) => setFormData({ ...formData, companyType: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="distributor">شركة توزيع أدوية</option>
                    <option value="warehouse">مستودع أدوية مركزي</option>
                    <option value="agent">وكيل معتمد ومستورد</option>
                    <option value="manufacturer">مصنع أدوية ومحاليل</option>
                  </select>
                </div>

                {/* Contact Person */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    اسم المندوب / مسؤول المبيعات:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: أ. فهد التميمي"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    رقم الهاتف الثابت <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: 01-234567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                {/* Mobile */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">رقم الجوال / الواتساب:</label>
                  <input
                    type="text"
                    placeholder="مثال: 777123456"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العنوان / المدينة:</label>
                  <input
                    type="text"
                    placeholder="مثال: شارع الستين الجنوبي - صنعاء"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">البريد الإلكتروني:</label>
                  <input
                    type="email"
                    placeholder="orders@distributor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Tax Number */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الرقم الضريبي VAT:</label>
                  <input
                    type="text"
                    placeholder="الرقم الضريبي للمستودع"
                    value={formData.taxNumber}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                {/* Commercial Register */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">السجل التجاري CR:</label>
                  <input
                    type="text"
                    placeholder="رقم السجل التجاري"
                    value={formData.commercialRegister}
                    onChange={(e) => setFormData({ ...formData, commercialRegister: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-mono"
                  />
                </div>

                {/* Payment Terms */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شروط السداد والآجل:</label>
                  <select
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-semibold"
                  >
                    <option value="cash">سداد نقدي عند الاستلام</option>
                    <option value="credit_15">آجل 15 يوماً</option>
                    <option value="credit_30">آجل 30 يوماً</option>
                    <option value="credit_60">آجل 60 يوماً</option>
                    <option value="consignment">بضاعة أمانة (تصريف)</option>
                  </select>
                </div>

                {/* Credit Limit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    سقف الائتمان المسموح به (ر.ي):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none focus:border-indigo-600 font-mono font-bold"
                  />
                </div>

                {/* Balance Due (Accounts Payable) */}
                <div className="sm:col-span-2 bg-amber-50 p-3 rounded-2xl border border-amber-200">
                  <label className="block font-bold text-amber-950 mb-1">
                    الرصيد الدائن المستحق للمستودع حالياً (الذمة الدائنة - ر.ي):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.balanceDue}
                    onChange={(e) => setFormData({ ...formData, balanceDue: parseFloat(e.target.value) || 0 })}
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-xl outline-none focus:border-amber-600 font-mono font-black text-amber-900 text-sm"
                  />
                  <p className="text-[10px] text-amber-700 mt-1">
                    المبلغ الذي تطالب به هذه الشركة من الصيدلية مقابل فواتير توريد أدوية سابقة.
                  </p>
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية:</label>
                  <textarea
                    placeholder="الأصناف الموردة، مواعيد التوزيع، أرقام حسابات البنوك للمستودع..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border rounded-xl outline-none h-16"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-bold text-slate-700 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  {editingSupplier ? 'حفظ التعديلات' : 'إضافة المستودع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SETTLE PAYMENT TO SUPPLIER (سداد دفعة للمستودع)          */}
      {/* ============================================================== */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-emerald-700 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-300" />
                <h3 className="font-bold text-sm">سداد دفعة للمستودع وتخفيض الذمة الدائنة</h3>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmPayment} className="p-5 space-y-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">المستودع / الشركة المستلمة:</label>
                <select
                  value={paymentSupplierId}
                  onChange={(e) => {
                    setPaymentSupplierId(e.target.value);
                    const sup = suppliers.find((s) => s.id === e.target.value);
                    if (sup && sup.balanceDue > 0) setPaymentAmount(sup.balanceDue);
                  }}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold outline-none"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (المستحق: {s.balanceDue.toFixed(2)} {CURRENCY})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مبلغ السداد المدفوع (ر.ي):</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-lg font-black p-2.5 border-2 border-emerald-500 rounded-xl outline-none font-mono text-emerald-900 bg-emerald-50/30"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة السداد:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-2 rounded-xl border text-center font-bold ${
                      paymentMethod === 'cash' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50'
                    }`}
                  >
                    نقداً (كاش)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-2 rounded-xl border text-center font-bold ${
                      paymentMethod === 'bank' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50'
                    }`}
                  >
                    تحويل بنكي
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cheque')}
                    className={`p-2 rounded-xl border text-center font-bold ${
                      paymentMethod === 'cheque' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-50'
                    }`}
                  >
                    شيك مصرفي
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم سند القبض / الإشعار من المورد:</label>
                <input
                  type="text"
                  placeholder="مثال: RCP-99421"
                  value={receiptVoucherNo}
                  onChange={(e) => setReceiptVoucherNo(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-slate-50 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ملاحظات وبيان الصرف:</label>
                <input
                  type="text"
                  placeholder="دفعة عن فاتورة توريد رقم..."
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full p-2 border rounded-xl bg-slate-50 outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-slate-700 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  تأكيد سداد الدفعة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: SUPPLIER DETAILS & STATEMENT (بطاقة المستودع)            */}
      {/* ============================================================== */}
      {selectedSupplierForDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="p-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-sm">بطاقة وكشف حساب: {selectedSupplierForDetails.name}</h3>
              </div>
              <button
                onClick={() => setSelectedSupplierForDetails(null)}
                className="text-white/80 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto text-xs">
              <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex justify-between items-center">
                <div>
                  <span className="text-rose-900 font-bold block">الرصيد الدائن المستحق (الذمة الدائنة):</span>
                  <span className="text-[11px] text-rose-700">مستحق للمستودع</span>
                </div>
                <div className="text-xl font-black text-rose-900 font-mono">
                  {selectedSupplierForDetails.balanceDue.toFixed(2)} {CURRENCY}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-700 bg-slate-50 p-3 rounded-2xl border">
                <div>
                  <span className="text-slate-400 block">المسؤول:</span>
                  <strong>{selectedSupplierForDetails.contactPerson}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">الهاتف:</span>
                  <strong className="font-mono">{selectedSupplierForDetails.phone}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">الجوال:</span>
                  <strong className="font-mono">{selectedSupplierForDetails.mobile || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">البريد:</span>
                  <strong>{selectedSupplierForDetails.email || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">العنوان:</span>
                  <strong>{selectedSupplierForDetails.address || '-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">شروط الدفع:</span>
                  <strong>{termsLabels[selectedSupplierForDetails.paymentTerms || 'credit_30']}</strong>
                </div>
              </div>

              {selectedSupplierForDetails.notes && (
                <div className="p-3 bg-slate-50 rounded-2xl border text-slate-600">
                  <span className="font-bold text-slate-800 block mb-1">ملاحظات:</span>
                  {selectedSupplierForDetails.notes}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <button
                  onClick={() => {
                    const target = selectedSupplierForDetails;
                    setSelectedSupplierForDetails(null);
                    handleOpenPayment(target);
                  }}
                  className="flex-1 bg-emerald-600 text-white font-bold py-2 rounded-xl text-center hover:bg-emerald-700 cursor-pointer"
                >
                  سداد دفعة
                </button>

                <button
                  onClick={() => {
                    const id = selectedSupplierForDetails.id;
                    setSelectedSupplierForDetails(null);
                    setReportModalSupplierId(id);
                    setIsReportModalOpen(true);
                  }}
                  className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded-xl text-center hover:bg-indigo-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  title="معاينة وطباعة كشف الحساب"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة كشف الحساب</span>
                </button>

                {onOpenPurchaseReturn && (
                  <button
                    onClick={() => {
                      const id = selectedSupplierForDetails.id;
                      setSelectedSupplierForDetails(null);
                      onOpenPurchaseReturn(id);
                    }}
                    className="flex-1 bg-amber-600 text-white font-bold py-2 rounded-xl text-center hover:bg-amber-700 cursor-pointer"
                  >
                    مرتجع أدوية
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                     */}
      {/* ============================================================== */}
      {deleteConfirmSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-sm text-slate-900">تأكيد حذف المستودع / الشركة</h3>
              <p className="text-slate-500">
                هل أنت متأكد من حذف حساب شركة ({deleteConfirmSupplier.name})؟
                {deleteConfirmSupplier.balanceDue > 0 && (
                  <span className="text-rose-600 block font-bold mt-1">
                    تنبيه: الشركة مسجل لها ذمة دائنة بمبلغ {deleteConfirmSupplier.balanceDue.toFixed(2)} {CURRENCY}!
                  </span>
                )}
              </p>
            </div>
            <div className="flex justify-center gap-2 pt-2 border-t">
              <button
                onClick={() => setDeleteConfirmSupplier(null)}
                className="px-4 py-2 border rounded-xl font-bold text-slate-700"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  onDeleteSupplier(deleteConfirmSupplier.id);
                  onShowToast(`تم حذف شركة (${deleteConfirmSupplier.name})`, 'info');
                  setDeleteConfirmSupplier(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fallback Modal: Official Accounts & Suppliers Printable Report (used only if not handled by root App) */}
      {!onOpenSuppliersReport && isReportModalOpen && (
        <SuppliersReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          suppliers={suppliers}
          pharmacySettings={pharmacySettings}
          initialSupplierId={reportModalSupplierId}
        />
      )}
    </div>
  );
};
