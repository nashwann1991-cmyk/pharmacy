import React, { useState, useMemo } from 'react';
import {
  Printer,
  X,
  Building,
  Scale,
  DollarSign,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  CreditCard,
  Banknote,
  Filter,
  Package,
  Receipt,
  Wallet,
  Clock,
} from 'lucide-react';
import { Supplier, PharmacySettings, CURRENCY, Medicine, SupplierPayment, PurchaseReturn } from '../types';

interface SuppliersReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  pharmacySettings?: PharmacySettings;
  initialSupplierId?: string;
  medicines?: Medicine[];
  supplierPayments?: SupplierPayment[];
  purchaseReturns?: PurchaseReturn[];
}

export const SuppliersReportModal: React.FC<SuppliersReportModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  pharmacySettings,
  initialSupplierId,
  medicines,
  supplierPayments,
  purchaseReturns,
}) => {
  if (!isOpen) return null;

  const [reportMode, setReportMode] = useState<'all' | 'single'>(
    initialSupplierId ? 'single' : 'all'
  );
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialSupplierId || suppliers[0]?.id || ''
  );
  const [debtFilter, setDebtFilter] = useState<'all' | 'with_debt' | 'zero_debt'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const pharmacyName = pharmacySettings?.name || 'الصيدلية النموذجية';
  const subtitle = pharmacySettings?.subtitle || 'إدارة الصيدليات ومستودعات الأدوية';
  const address = pharmacySettings?.address || '';
  const taxNumber = pharmacySettings?.taxNumber;
  const commercialRegister = pharmacySettings?.commercialRegister;
  const licenseNumber = pharmacySettings?.licenseNumber;
  const phone = pharmacySettings?.phone || pharmacySettings?.mobile;
  const currencySymbol = pharmacySettings?.currency || CURRENCY;
  const currencyFullName = pharmacySettings?.currencyFullName || 'ريال يمني';

  const handlePrint = () => {
    window.print();
  };

  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || suppliers[0] || null;
  }, [suppliers, selectedSupplierId]);

  // Load medicines from props or localStorage
  const allMedicines = useMemo(() => {
    if (medicines && medicines.length > 0) return medicines;
    try {
      const saved = localStorage.getItem('pharma_medicines');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [medicines]);

  // Load supplier payments from props or localStorage
  const allPayments = useMemo(() => {
    if (supplierPayments && supplierPayments.length > 0) return supplierPayments;
    try {
      const saved = localStorage.getItem('pharma_supplier_payments');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [supplierPayments]);

  // Load purchase returns from props or localStorage
  const allReturns = useMemo(() => {
    if (purchaseReturns && purchaseReturns.length > 0) return purchaseReturns;
    try {
      const saved = localStorage.getItem('pharma_purchase_returns');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, [purchaseReturns]);

  // Medicines / Goods linked to selected supplier
  const supplierMedicines = useMemo(() => {
    if (!selectedSupplier) return [];
    return allMedicines.filter((m: Medicine) => {
      const matchesId = m.supplierId && m.supplierId === selectedSupplier.id;
      const matchesSupplierName = m.supplier && m.supplier.trim().toLowerCase() === selectedSupplier.name.trim().toLowerCase();
      const matchesSupplierProp = m.supplierName && m.supplierName.trim().toLowerCase() === selectedSupplier.name.trim().toLowerCase();
      return matchesId || matchesSupplierName || matchesSupplierProp;
    });
  }, [allMedicines, selectedSupplier]);

  // Goods credit vs cash calculations
  const totalGoodsValue = useMemo(() => {
    return supplierMedicines.reduce((sum: number, m: Medicine) => sum + (m.stock * m.costPrice), 0);
  }, [supplierMedicines]);

  const creditMedicines = useMemo(() => {
    return supplierMedicines.filter((m: Medicine) => m.purchasePaymentType !== 'cash');
  }, [supplierMedicines]);

  const cashMedicines = useMemo(() => {
    return supplierMedicines.filter((m: Medicine) => m.purchasePaymentType === 'cash');
  }, [supplierMedicines]);

  const totalCreditGoodsValue = useMemo(() => {
    return creditMedicines.reduce((sum: number, m: Medicine) => sum + (m.stock * m.costPrice), 0);
  }, [creditMedicines]);

  const totalCashGoodsValue = useMemo(() => {
    return cashMedicines.reduce((sum: number, m: Medicine) => sum + (m.stock * m.costPrice), 0);
  }, [cashMedicines]);

  // Payments made to selected supplier
  const supplierPaymentsList = useMemo(() => {
    if (!selectedSupplier) return [];
    return allPayments.filter((p: SupplierPayment) => {
      return p.supplierId === selectedSupplier.id || (p.supplierName && p.supplierName.trim().toLowerCase() === selectedSupplier.name.trim().toLowerCase());
    });
  }, [allPayments, selectedSupplier]);

  const totalPaymentsMade = useMemo(() => {
    return supplierPaymentsList.reduce((sum: number, p: SupplierPayment) => sum + (p.amount || 0), 0);
  }, [supplierPaymentsList]);

  // Purchase returns for selected supplier
  const supplierReturnsList = useMemo(() => {
    if (!selectedSupplier) return [];
    return allReturns.filter((r: PurchaseReturn) => {
      return r.supplierId === selectedSupplier.id || (r.supplierName && r.supplierName.trim().toLowerCase() === selectedSupplier.name.trim().toLowerCase());
    });
  }, [allReturns, selectedSupplier]);

  const totalReturnsDeduction = useMemo(() => {
    return supplierReturnsList
      .filter((r: PurchaseReturn) => r.settlementMethod === 'deduct_balance')
      .reduce((sum: number, r: PurchaseReturn) => sum + (r.totalAmount || 0), 0);
  }, [supplierReturnsList]);

  // Filtered suppliers for general report
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((sup) => {
      const matchesType = typeFilter === 'all' || sup.companyType === typeFilter;
      const matchesDebt =
        debtFilter === 'all' ||
        (debtFilter === 'with_debt' && sup.balanceDue > 0) ||
        (debtFilter === 'zero_debt' && sup.balanceDue <= 0);
      return matchesType && matchesDebt;
    });
  }, [suppliers, typeFilter, debtFilter]);

  // Executive Totals
  const totalDueAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
  }, [suppliers]);

  const totalCreditLimitAll = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0);
  }, [suppliers]);

  const filteredTotalDue = useMemo(() => {
    return filteredSuppliers.reduce((sum, s) => sum + (s.balanceDue || 0), 0);
  }, [filteredSuppliers]);

  const filteredTotalCreditLimit = useMemo(() => {
    return filteredSuppliers.reduce((sum, s) => sum + (s.creditLimit || 0), 0);
  }, [filteredSuppliers]);

  const suppliersWithDebtCount = useMemo(() => {
    return suppliers.filter((s) => s.balanceDue > 0).length;
  }, [suppliers]);

  const companyTypeLabels: Record<string, string> = {
    warehouse: 'مستودع أدوية مركزي',
    distributor: 'شركة توزيع دوائية',
    agent: 'وكيل معتمد ومستورد',
    manufacturer: 'مصنع أدوية ومحاليل',
  };

  const termsLabels: Record<string, string> = {
    cash: 'نقداً عند الاستلام',
    credit_15: 'آجل 15 يوماً',
    credit_30: 'آجل 30 يوماً',
    credit_45: 'آجل 45 يوماً',
    credit_60: 'آجل 60 يوماً',
    credit_90: 'آجل 90 يوماً',
  };

  const reportDateStr = new Date().toLocaleDateString('ar-EG', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const reportTimeStr = new Date().toLocaleTimeString('ar-EG', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:block print:w-full">
      <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none print:rounded-none print:w-full print:block print:m-0">
        {/* ========================================================= */}
        {/* TOP TOOLBAR & CONTROLS (HIDDEN DURING PRINT)              */}
        {/* ========================================================= */}
        <div className="p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <span>معاينة وطباعة تقرير حسابات الشركات والمستودعات</span>
                <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                  A4 Statement
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                كشف رسمي بالذمم الدائنة، حدود الائتمان، وأرصدة الموردين
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
            <button
              onClick={() => setReportMode('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                reportMode === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              التقرير الشامل لكافة المستودعات ({suppliers.length})
            </button>
            <button
              onClick={() => setReportMode('single')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                reportMode === 'single'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              كشف حساب مستودع محدد
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-lg shadow-teal-600/30"
              title="طباعة التقرير فوراً أو حفظه كملف PDF"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-Filters Bar (Shown only in 'all' mode and hidden in print) */}
        {reportMode === 'all' && (
          <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 text-slate-700 font-semibold">
              <Filter className="w-3.5 h-3.5 text-indigo-600" />
              <span>خيارات تصفية التقرير قبل الطباعة:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                <option value="all">كل الكيانات ({suppliers.length})</option>
                <option value="warehouse">مستودعات أدوية مركزية</option>
                <option value="distributor">شركات توزيع دوائية</option>
                <option value="agent">وكلاء معتمدون ومستوردون</option>
                <option value="manufacturer">مصانع دوائية</option>
              </select>

              <select
                value={debtFilter}
                onChange={(e) => setDebtFilter(e.target.value as any)}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none"
              >
                <option value="all">كل الأرصدة</option>
                <option value="with_debt">جهات لها ذمم دائنة فقط ({suppliersWithDebtCount})</option>
                <option value="zero_debt">حسابات مسددة بالكامل (0)</option>
              </select>

              <span className="text-[11px] text-slate-500 font-medium">
                معروض: <strong>{filteredSuppliers.length}</strong> جهة
              </span>
            </div>
          </div>
        )}

        {/* Sub-Selector for single supplier mode (hidden in print) */}
        {reportMode === 'single' && (
          <div className="bg-indigo-50/80 border-b border-indigo-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 text-indigo-900 font-bold">
              <Building className="w-4 h-4 text-indigo-600" />
              <span>اختر المستودع أو شركة التوزيع لطباعة كشف حسابه:</span>
            </div>

            <div className="flex-1 max-w-md">
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full bg-white border-2 border-indigo-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-600"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.companyType === 'warehouse' ? 'مستودع' : s.companyType === 'distributor' ? 'شركة توزيع' : 'مورد'} • المستحق: {s.balanceDue.toFixed(2)} {currencySymbol})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PRINTABLE DOCUMENT BODY (A4 CONTAINER)                    */}
        {/* ========================================================= */}
        <div
          id="suppliers-official-report-print"
          className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-800 text-xs leading-relaxed space-y-5 print:p-4 print:space-y-4 print:overflow-visible print:block print:w-full"
        >
          {/* Header of Official Document */}
          <div className="border-b-2 border-slate-900 pb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {pharmacySettings?.logoUrl ? (
                <div className="w-16 h-16 rounded-2xl border border-slate-200 p-1 bg-white shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    src={pharmacySettings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-indigo-700 text-white flex items-center justify-center font-bold shadow-xs flex-shrink-0">
                  <Building className="w-8 h-8" />
                </div>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {pharmacyName}
                </h1>
                <p className="text-xs text-slate-600 font-medium mt-0.5">{subtitle}</p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 mt-1">
                  {address && <span>{address}</span>}
                  {phone && <span>• هاتف: {phone}</span>}
                  {taxNumber && <span>• الرقم الضريبي: <span className="font-mono">{taxNumber}</span></span>}
                  {licenseNumber && <span>• ترخيص: <span className="font-mono">{licenseNumber}</span></span>}
                  {commercialRegister && <span>• س.ت: <span className="font-mono">{commercialRegister}</span></span>}
                </div>
              </div>
            </div>

            {/* Document Title Badge */}
            <div className="text-left flex flex-col items-end">
              <div className="bg-slate-900 text-white px-3.5 py-1.5 rounded-xl font-black text-xs inline-block tracking-wider">
                {reportMode === 'all'
                  ? 'كشف حسابات الذمم الدائنة والمستودعات'
                  : 'كشف حساب مستودع أدوية'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 font-mono">
                ACCOUNTS PAYABLE STATEMENT
              </span>
              <div className="text-[10px] text-slate-500 mt-1 space-y-0.5 text-left">
                <div>التاريخ: <strong>{reportDateStr}</strong></div>
                <div>الوقت: <strong>{reportTimeStr}</strong></div>
                <div>العملة: <strong>{currencyFullName} ({currencySymbol})</strong></div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* VIEW MODE 1: ALL SUPPLIERS COMPREHENSIVE REPORT           */}
          {/* ========================================================= */}
          {reportMode === 'all' && (
            <div className="space-y-6">
              {/* Executive Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:gap-2">
                <div className="bg-rose-50/80 p-3.5 rounded-2xl border border-rose-200">
                  <span className="text-[10px] text-rose-700 font-bold block mb-1">
                    إجمالي الذمم الدائنة المستحقة للمستودعات:
                  </span>
                  <div className="text-lg font-black text-rose-900 font-mono">
                    {filteredTotalDue.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-rose-600 block mt-0.5">
                    مستحقة لـ {filteredSuppliers.filter((s) => s.balanceDue > 0).length} جهة توريد
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">
                    إجمالي سقف الائتمان الممنوح:
                  </span>
                  <div className="text-lg font-black text-slate-900 font-mono">
                    {filteredTotalCreditLimit.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    الحد الأقصى للتسهيلات الآجلة
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">
                    إجمالي جهات التوريد المسجلة:
                  </span>
                  <div className="text-lg font-black text-slate-900">
                    {filteredSuppliers.length} <span className="text-xs font-normal text-slate-500">شركة ومستودع</span>
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    {filteredSuppliers.filter((s) => s.companyType === 'warehouse').length} مستودع • {filteredSuppliers.filter((s) => s.companyType === 'distributor').length} توزيع
                  </span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block mb-1">
                    نسبة استغلال التسهيلات:
                  </span>
                  <div className="text-lg font-black text-amber-700 font-mono">
                    {filteredTotalCreditLimit > 0
                      ? ((filteredTotalDue / filteredTotalCreditLimit) * 100).toFixed(1)
                      : '0.0'}
                    %
                  </div>
                  <span className="text-[9px] text-slate-500 block mt-0.5">
                    من إجمالي التسهيل الائتماني
                  </span>
                </div>
              </div>

              {/* Table of Accounts */}
              <div className="rounded-2xl border border-slate-300 overflow-hidden">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-900 text-white font-bold text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-8 text-center">#</th>
                      <th className="py-2.5 px-3">اسم المستودع / شركة التوزيع</th>
                      <th className="py-2.5 px-3">نوع الكيان</th>
                      <th className="py-2.5 px-3">المندوب / الاتصال</th>
                      <th className="py-2.5 px-3">شروط السداد</th>
                      <th className="py-2.5 px-3 text-left">سقف الائتمان</th>
                      <th className="py-2.5 px-3 text-left font-black">الرصيد المستحق (الباقي له)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400">
                          لا توجد مستودعات أو شركات مسجلة مطابقة لخيارات التصفية
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((sup, idx) => {
                        const isOverLimit = sup.balanceDue > (sup.creditLimit || 0) && (sup.creditLimit || 0) > 0;
                        return (
                          <tr
                            key={sup.id}
                            className={`hover:bg-slate-50/80 transition ${
                              idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                            }`}
                          >
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900 block text-xs">
                                {sup.name}
                              </span>
                              {sup.address && (
                                <span className="text-[10px] text-slate-500 block">
                                  {sup.address}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700">
                              <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-medium border border-slate-200">
                                {companyTypeLabels[sup.companyType || 'distributor']}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className="font-semibold text-slate-800 block text-xs">
                                {sup.contactPerson || '-'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono block" dir="ltr">
                                {sup.phone || sup.mobile || '-'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600 text-[11px]">
                              {termsLabels[sup.paymentTerms || 'credit_30']}
                            </td>
                            <td className="py-2 px-3 text-left font-mono font-medium text-slate-600 text-[11px]">
                              {sup.creditLimit ? sup.creditLimit.toFixed(2) : '-'} {currencySymbol}
                            </td>
                            <td className="py-2 px-3 text-left">
                              <span
                                className={`font-mono font-black text-xs ${
                                  sup.balanceDue > 0 ? 'text-rose-700' : 'text-slate-500'
                                }`}
                              >
                                {sup.balanceDue.toFixed(2)} {currencySymbol}
                              </span>
                              {isOverLimit && (
                                <span className="text-[9px] text-rose-600 block font-bold">
                                  (تجاوز سقف الائتمان)
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                    <tr>
                      <td colSpan={5} className="py-2.5 px-3 text-right">
                        الإجمالي العام للذمم الدائنة للمستودعات (الباقي لهم):
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900">
                        {filteredTotalCreditLimit.toFixed(2)} {currencySymbol}
                      </td>
                      <td className="py-2.5 px-3 text-left font-mono font-black text-rose-800 text-sm">
                        {filteredTotalDue.toFixed(2)} {currencySymbol}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Amount In Words */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">ملاحظة التصفية والحساب: </span>
                  <span className="text-slate-700">
                    تم تدقيق كشف حسابات الموردين أعلاه والمبالغ المستحقة بموجب القيود المسجلة بنظام الصيدلية.
                  </span>
                </div>
                <div className="text-left font-bold text-slate-900">
                  إجمالي الذمم: {filteredTotalDue.toFixed(2)} {currencyFullName}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW MODE 2: SINGLE SUPPLIER STATEMENT                    */}
          {/* ========================================================= */}
          {reportMode === 'single' && selectedSupplier && (
            <div className="space-y-5 print:space-y-4">
              {/* Supplier Identity Card & Headline Metric Cards */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border-2 border-slate-200 space-y-4 print:p-3 print:space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider block">
                      بيانات الحساب المالي للمستودع / المورد
                    </span>
                    <h2 className="text-lg font-black text-slate-900">
                      {selectedSupplier.name}
                    </h2>
                    <span className="inline-block mt-1 bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                      {companyTypeLabels[selectedSupplier.companyType || 'distributor']}
                    </span>
                  </div>

                  <div className="text-left bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      صافي الرصيد الحالي (الباقي الذي له)
                    </span>
                    <span className="text-2xl font-black text-rose-700 font-mono">
                      {selectedSupplier.balanceDue.toFixed(2)} {currencySymbol}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      سقف الائتمان: {selectedSupplier.creditLimit?.toFixed(2) || '0.00'} {currencySymbol}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div>
                    <span className="text-slate-400 text-[11px] block">المندوب ومسؤول المبيعات:</span>
                    <strong className="text-slate-800">{selectedSupplier.contactPerson || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">رقم الهاتف الأساسي:</span>
                    <strong className="text-slate-800 font-mono" dir="ltr">{selectedSupplier.phone || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">رقم الجوال:</span>
                    <strong className="text-slate-800 font-mono" dir="ltr">{selectedSupplier.mobile || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">البريد الإلكتروني:</span>
                    <strong className="text-slate-800 font-mono">{selectedSupplier.email || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">السجل التجاري:</span>
                    <strong className="text-slate-800 font-mono">{selectedSupplier.commercialRegister || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">الرقم الضريبي للمورد:</span>
                    <strong className="text-slate-800 font-mono">{selectedSupplier.taxNumber || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">شروط السداد المتفق عليها:</span>
                    <strong className="text-slate-800">{termsLabels[selectedSupplier.paymentTerms || 'credit_30']}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">العنوان والمقر:</span>
                    <strong className="text-slate-800">{selectedSupplier.address || '-'}</strong>
                  </div>
                </div>

                {selectedSupplier.notes && (
                  <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                    <span className="font-bold text-slate-700">ملاحظات واتفاقيات التوريد: </span>
                    {selectedSupplier.notes}
                  </div>
                )}
              </div>

              {/* Summary KPIs: Goods vs Payments vs Remaining Balance */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 print:gap-2">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-600 font-bold block mb-0.5">
                    إجمالي البضاعة الموردة:
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {totalGoodsValue.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-slate-500 block">
                    {supplierMedicines.length} صنف مسجل
                  </span>
                </div>

                <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 font-bold block mb-0.5">
                    بضاعة بالآجل (ذمم):
                  </span>
                  <div className="text-base font-black text-amber-900 font-mono">
                    {totalCreditGoodsValue.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-amber-700 block">
                    {creditMedicines.length} صنف آجل
                  </span>
                </div>

                <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 font-bold block mb-0.5">
                    تسديد دفعات (المسدد):
                  </span>
                  <div className="text-base font-black text-emerald-900 font-mono">
                    {totalPaymentsMade.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-emerald-700 block">
                    {supplierPaymentsList.length} سند سداد مسجل
                  </span>
                </div>

                <div className="bg-rose-50/80 p-3 rounded-xl border-2 border-rose-300">
                  <span className="text-[10px] text-rose-800 font-bold block mb-0.5">
                    الباقي الذي له (المستحق):
                  </span>
                  <div className="text-base font-black text-rose-700 font-mono">
                    {selectedSupplier.balanceDue.toFixed(2)} {currencySymbol}
                  </div>
                  <span className="text-[9px] text-rose-600 block">
                    {selectedSupplier.balanceDue > 0 ? 'ذمة دائنة قائمة' : 'حساب خالص (0.00)'}
                  </span>
                </div>
              </div>

              {/* ========================================================= */}
              {/* SECTION 1: GOODS / MEDICINES STATEMENT (CREDIT / CASH)     */}
              {/* ========================================================= */}
              <div className="rounded-2xl border border-slate-300 overflow-hidden print:break-inside-avoid">
                <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-xs">كشف وتفاصيل البضاعة والأدوية الموردة (آجل / نقد)</h4>
                      <p className="text-[10px] text-slate-300">
                        قائمة الأصناف الموردة من هذا المستودع موضحة حسب نوع التوريد (آجل أو نقد)
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    عدد الأصناف: <strong>{supplierMedicines.length}</strong>
                  </div>
                </div>

                {supplierMedicines.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 text-xs">
                    لا توجد أصناف أدوية مخصصة مسجلة حالياً باسم هذا المستودع في المخزون، أو تم قيد الفواتير كأرصدة حسابات افتتاحية.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">اسم الصنف / البضاعة</th>
                          <th className="py-2.5 px-3">رقم التشغيلة والصلاحية</th>
                          <th className="py-2.5 px-3 text-center">الكمية</th>
                          <th className="py-2.5 px-3 text-left">سعر التكلفة</th>
                          <th className="py-2.5 px-3 text-left">إجمالي القيمة</th>
                          <th className="py-2.5 px-3 text-center font-black">نوع التوريد (آجل / نقد)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {supplierMedicines.map((med: Medicine, idx: number) => {
                          const itemTotal = med.stock * med.costPrice;
                          const isCash = med.purchasePaymentType === 'cash';
                          return (
                            <tr
                              key={med.id}
                              className={`hover:bg-slate-50 transition ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3">
                                <span className="font-bold text-slate-900 block text-xs">
                                  {med.tradeName}
                                </span>
                                <span className="text-[10px] text-slate-500 block font-mono">
                                  {med.genericName} {med.strength ? `• ${med.strength}` : ''}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 font-mono text-[11px]">
                                <div>{med.batchNumber || '-'}</div>
                                <div className="text-[10px] text-slate-400">{med.expiryDate || '-'}</div>
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-800">
                                {med.stock} {med.packageSize ? `(${med.packageSize})` : 'عبوة'}
                              </td>
                              <td className="py-2 px-3 text-left font-mono text-slate-700">
                                {med.costPrice.toFixed(2)} {currencySymbol}
                              </td>
                              <td className="py-2 px-3 text-left font-mono font-bold text-slate-900">
                                {itemTotal.toFixed(2)} {currencySymbol}
                              </td>
                              <td className="py-2 px-3 text-center">
                                {isCash ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <Banknote className="w-3 h-3 text-emerald-600" />
                                    <span>نقد (مسدد)</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[10px] bg-amber-100 text-amber-900 border border-amber-300">
                                    <Clock className="w-3 h-3 text-amber-700" />
                                    <span>آجل (ذمة)</span>
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                        <tr>
                          <td colSpan={5} className="py-2.5 px-3 text-right">
                            إجمالي قيمة البضاعة الموردة:
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-slate-900">
                            {totalGoodsValue.toFixed(2)} {currencySymbol}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[10px] text-slate-600">
                            (آجل: {totalCreditGoodsValue.toFixed(2)} | نقد: {totalCashGoodsValue.toFixed(2)})
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* SECTION 2: PAYMENTS MADE / INSTALLMENTS (تسديد دفعة)       */}
              {/* ========================================================= */}
              <div className="rounded-2xl border border-slate-300 overflow-hidden print:break-inside-avoid">
                <div className="bg-slate-900 text-white p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-xs">سجل تسديد الدفعات وسندات الصرف للمستودع (تسديد دفعة)</h4>
                      <p className="text-[10px] text-slate-300">
                        بيان الدفعات المالية المسددة لتخفيض الذمة الدائنة المستحقة لهذا المورد
                      </p>
                    </div>
                  </div>
                  <div className="text-[11px] font-mono bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    عدد سندات السداد: <strong>{supplierPaymentsList.length}</strong>
                  </div>
                </div>

                {supplierPaymentsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 text-xs">
                    لم يتم تسجيل أي سندات سداد دفعات سابقة لهذا المستودع حتى الآن.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-100 text-slate-700 border-b border-slate-300 text-[11px] font-bold">
                        <tr>
                          <th className="py-2.5 px-3 w-8 text-center">#</th>
                          <th className="py-2.5 px-3">تاريخ السند / السداد</th>
                          <th className="py-2.5 px-3">رقم السند / الإيصال</th>
                          <th className="py-2.5 px-3">طريقة الدفع</th>
                          <th className="py-2.5 px-3">البيان والملاحظات</th>
                          <th className="py-2.5 px-3">القائم بالصرف</th>
                          <th className="py-2.5 px-3 text-left font-black">المبلغ المسدد (دفعة)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {supplierPaymentsList.map((payment: SupplierPayment, idx: number) => {
                          const paymentDate = new Date(payment.date).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                          });
                          const methodLabels: Record<string, string> = {
                            cash: 'نقداً من الصندوق',
                            bank: 'تحويل / شيك بنكي',
                            cheque: 'شيك مصرفي',
                          };
                          return (
                            <tr
                              key={payment.id}
                              className={`hover:bg-slate-50 transition ${
                                idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                              }`}
                            >
                              <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="py-2 px-3 font-mono text-slate-700">
                                {paymentDate}
                              </td>
                              <td className="py-2 px-3 font-mono font-bold text-indigo-700">
                                {payment.receiptVoucherNumber || `سند-${payment.id.slice(-4)}`}
                              </td>
                              <td className="py-2 px-3 text-slate-800">
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold border border-slate-200">
                                  {methodLabels[payment.paymentMethod] || payment.paymentMethod}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 text-[11px]">
                                {payment.notes || 'تسديد دفعة من الحساب'}
                              </td>
                              <td className="py-2 px-3 text-slate-700 text-[11px]">
                                {payment.recordedBy || 'الإدارة'}
                              </td>
                              <td className="py-2 px-3 text-left font-mono font-black text-emerald-700 text-xs">
                                {payment.amount.toFixed(2)} {currencySymbol}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-100 border-t-2 border-slate-900 font-bold text-xs">
                        <tr>
                          <td colSpan={6} className="py-2.5 px-3 text-right">
                            إجمالي ما تم تسديده من دفعات للمستودع:
                          </td>
                          <td className="py-2.5 px-3 text-left font-mono font-black text-emerald-800 text-sm">
                            {totalPaymentsMade.toFixed(2)} {currencySymbol}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              {/* ========================================================= */}
              {/* SECTION 3: FINANCIAL RECONCILIATION & (الباقي الذي له)     */}
              {/* ========================================================= */}
              <div className="rounded-2xl border-2 border-slate-300 overflow-hidden print:break-inside-avoid">
                <div className="bg-slate-900 text-white p-3 font-bold text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <span>ملخص الموقف المالي وحساب صافي (الباقي الذي له)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">FINANCIAL RECONCILIATION</span>
                </div>
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="p-3">البيان المحاسبي</th>
                      <th className="p-3 text-left">المبلغ بالريال ({currencySymbol})</th>
                      <th className="p-3">الحالة والتفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">سقف التسهيل الائتماني المعتمد</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-700">
                        {selectedSupplier.creditLimit ? selectedSupplier.creditLimit.toFixed(2) : '0.00'} {currencySymbol}
                      </td>
                      <td className="p-3 text-slate-500">الحد الأقصى المسموح به للمشتريات الآجلة</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">إجمالي قيمة البضاعة الموردة (آجل + نقد)</td>
                      <td className="p-3 text-left font-mono font-bold text-slate-700">
                        {totalGoodsValue.toFixed(2)} {currencySymbol}
                      </td>
                      <td className="p-3 text-slate-500">
                        منها بضاعة بالآجل: {totalCreditGoodsValue.toFixed(2)} {currencySymbol} | بضاعة نقداً: {totalCashGoodsValue.toFixed(2)} {currencySymbol}
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-emerald-800">إجمالي ما تم تسديده من دفعات للمستودع (تسديد دفعة)</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-700">
                        {totalPaymentsMade.toFixed(2)} {currencySymbol}
                      </td>
                      <td className="p-3 text-emerald-700">مجموع سندات الصرف المسددة للمستودع</td>
                    </tr>
                    {totalReturnsDeduction > 0 && (
                      <tr>
                        <td className="p-3 font-semibold text-indigo-800">مرتجعات مشتريات مخصومة من الحساب</td>
                        <td className="p-3 text-left font-mono font-bold text-indigo-700">
                          {totalReturnsDeduction.toFixed(2)} {currencySymbol}
                        </td>
                        <td className="p-3 text-slate-500">مبالغ مستردة من مرتجع الأدوية</td>
                      </tr>
                    )}
                    <tr className="bg-rose-50/70 border-t-2 border-rose-300">
                      <td className="p-3.5 font-black text-rose-950 text-sm">
                        صافي الرصيد المتبقي الذي له (الذمة الدائنة المستحقة للمستودع)
                      </td>
                      <td className="p-3.5 text-left font-mono font-black text-rose-700 text-lg">
                        {selectedSupplier.balanceDue.toFixed(2)} {currencySymbol}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                          selectedSupplier.balanceDue > 0
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}>
                          {selectedSupplier.balanceDue > 0
                            ? 'مبلغ قائم مستحق السداد لصالح المستودع'
                            : 'الحساب خالص ومسدد بالكامل'}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 font-semibold text-slate-800">الرصيد المتاح من الائتمان قبل التجاوز</td>
                      <td className="p-3 text-left font-mono font-bold text-emerald-700">
                        {Math.max(0, (selectedSupplier.creditLimit || 0) - selectedSupplier.balanceDue).toFixed(2)} {currencySymbol}
                      </td>
                      <td className="p-3 text-slate-500">المبلغ المتبقي المسموح بطلب أدوية وبضاعة جديدة به</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Payment Advice & Reconciliation Note */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1 print:break-inside-avoid">
                <div className="font-bold text-slate-800">إشعار تسوية ومطابقة الحساب:</div>
                <p className="text-slate-600 leading-relaxed">
                  يعتبر هذا الكشف مطابقة رسمية معتمدة لحركة البضاعة (آجل / نقد) وسندات تسديد الدفعات، وصافي الرصيد الدائن المتبقي لصالح المستودع <strong>{selectedSupplier.name}</strong> والبالغ قدره <strong className="font-mono text-slate-900 font-black">({selectedSupplier.balanceDue.toFixed(2)} {currencyFullName})</strong> حتى تاريخ {reportDateStr}.
                </p>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* OFFICIAL SIGNATURES & STAMPS (ALWAYS INCLUDED)           */}
          {/* ========================================================= */}
          <div className="pt-8 border-t-2 border-slate-800 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-700 block">إعداد ومراجعة المحاسب:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <span className="text-[11px] text-slate-400 block font-mono">التوقيع والتاريخ</span>
            </div>

            <div className="space-y-8">
              <span className="font-bold text-slate-700 block">الصيدلي المسؤول:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <span className="text-[11px] text-slate-400 block font-mono">د. الصيدلي المناوب</span>
            </div>

            <div className="space-y-8">
              <span className="font-bold text-slate-700 block">اعتماد مدير الصيدلية والختم:</span>
              <div className="border-b border-dashed border-slate-400 w-36 mx-auto"></div>
              <span className="text-[11px] text-slate-400 block font-mono">الختم الرسمي للصيدلية</span>
            </div>
          </div>

          {/* Footer note */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
            <span>نظام إدارة الصيدلية المتكامل • كشف حسابات المستودعات والشركات المعتمد</span>
            <span>طبع بواسطة: {pharmacySettings?.name || 'الإدارة'} • صفحة 1 من 1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
