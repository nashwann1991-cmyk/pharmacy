import React, { useState } from 'react';
import {
  Pill,
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowUpDown,
  Edit2,
  Trash2,
  FileSpreadsheet,
  CheckCircle2,
  Package,
  DollarSign,
  TrendingUp,
  Tag,
  Clock,
  ShieldAlert,
  ArrowDownCircle,
  ArrowUpCircle,
  RotateCcw,
  Sparkles,
  Download,
  Building,
  CreditCard,
  Banknote,
} from 'lucide-react';
import { Medicine, MedicineCategory, StockAdjustment, Supplier } from '../types';
import { exportInventoryToExcel } from '../utils/exportUtils';

interface InventoryViewProps {
  medicines: Medicine[];
  onAddMedicine: (newMed: Omit<Medicine, 'id'>, shouldAddToSupplierBalance?: boolean) => void;
  onUpdateMedicine: (med: Medicine) => void;
  onDeleteMedicine: (id: string) => void;
  onSyncToSheets?: () => void;
  isSheetsConnected?: boolean;
  onStockAdjustment?: (adjustment: StockAdjustment) => void;
  onOpenPurchaseReturn?: () => void;
  suppliers?: Supplier[];
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  medicines,
  onAddMedicine,
  onUpdateMedicine,
  onDeleteMedicine,
  onSyncToSheets,
  isSheetsConnected,
  onStockAdjustment,
  onOpenPurchaseReturn,
  suppliers = [],
}) => {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'low' | 'expiring' | 'expired' | 'rx'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);

  // Quick Stock Adjustment Modal
  const [stockModalMed, setStockModalMed] = useState<Medicine | null>(null);
  const [stockAdjustmentType, setStockAdjustmentType] = useState<'add' | 'remove' | 'set'>('add');
  const [stockAdjustmentQty, setStockAdjustmentQty] = useState<number>(10);
  const [stockAdjustmentReason, setStockAdjustmentReason] = useState<StockAdjustment['reason']>('purchase');
  const [stockAdjustmentNotes, setStockAdjustmentNotes] = useState('');

  // Form states for Add / Edit
  const [formData, setFormData] = useState({
    barcode: '',
    tradeName: '',
    genericName: '',
    category: 'analgesics' as MedicineCategory,
    form: 'أقراص (Tablets)',
    strength: '500mg',
    packageSize: 'علبة 20 قرص',
    costPrice: 10,
    sellingPrice: 15,
    stock: 50,
    minStockLevel: 15,
    batchNumber: 'BN-' + Math.floor(10000 + Math.random() * 90000),
    expiryDate: '2027-12-31',
    requiresPrescription: false,
    locationRack: 'A-01',
    supplierId: '',
    supplierName: '',
    supplier: '',
    purchasePaymentType: 'credit' as 'credit' | 'cash',
  });
  const [customSupplierMode, setCustomSupplierMode] = useState<boolean>(false);
  const [addToSupplierBalance, setAddToSupplierBalance] = useState<boolean>(true);
  const [supplierFilter, setSupplierFilter] = useState<string>('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'credit' | 'cash'>('all');

  // Calculate metrics
  const totalSKUs = medicines.length;
  const totalCostValue = medicines.reduce((sum, m) => sum + m.stock * m.costPrice, 0);
  const totalSalesValue = medicines.reduce((sum, m) => sum + m.stock * m.sellingPrice, 0);

  // Expiry calculation helpers
  const getDaysUntilExpiry = (expiryDateStr: string) => {
    const expiry = new Date(expiryDateStr);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const isExpired = (expiryDateStr: string) => getDaysUntilExpiry(expiryDateStr) <= 0;
  const isExpiringWithinDays = (expiryDateStr: string, days: number) => {
    const remaining = getDaysUntilExpiry(expiryDateStr);
    return remaining > 0 && remaining <= days;
  };

  const lowStockMedicines = medicines.filter((m) => m.stock <= m.minStockLevel);
  const expiredMedicines = medicines.filter((m) => isExpired(m.expiryDate));
  const expiringWithin6Months = medicines.filter(
    (m) => !isExpired(m.expiryDate) && isExpiringWithinDays(m.expiryDate, 180)
  );

  // Filter list
  const filteredList = medicines.filter((m) => {
    const matchesSearch =
      m.tradeName.toLowerCase().includes(search.toLowerCase()) ||
      m.genericName.toLowerCase().includes(search.toLowerCase()) ||
      m.barcode.includes(search) ||
      (m.supplierName && m.supplierName.toLowerCase().includes(search.toLowerCase())) ||
      (m.supplier && m.supplier.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter;

    const matchesSupplier =
      supplierFilter === 'all' ||
      (m.supplierId && m.supplierId === supplierFilter) ||
      (m.supplierName && m.supplierName === supplierFilter) ||
      (m.supplier && m.supplier === supplierFilter);

    const matchesPaymentType =
      paymentTypeFilter === 'all' ||
      (m.purchasePaymentType || 'credit') === paymentTypeFilter;

    let matchesStatus = true;
    if (statusFilter === 'low') matchesStatus = m.stock <= m.minStockLevel;
    if (statusFilter === 'expired') matchesStatus = isExpired(m.expiryDate);
    if (statusFilter === 'expiring') matchesStatus = !isExpired(m.expiryDate) && isExpiringWithinDays(m.expiryDate, 180);
    if (statusFilter === 'rx') matchesStatus = m.requiresPrescription;

    return matchesSearch && matchesCategory && matchesSupplier && matchesPaymentType && matchesStatus;
  });

  const handleOpenAdd = () => {
    setEditingMedicine(null);
    const defaultSup = suppliers && suppliers.length > 0 ? suppliers[0] : null;
    setCustomSupplierMode(false);
    setAddToSupplierBalance(true);
    setFormData({
      barcode: '628' + Math.floor(100000000 + Math.random() * 900000000),
      tradeName: '',
      genericName: '',
      category: 'analgesics',
      form: 'أقراص (Tablets)',
      strength: '',
      packageSize: '',
      costPrice: 0,
      sellingPrice: 0,
      stock: 0,
      minStockLevel: 10,
      batchNumber: 'BN-' + Math.floor(10000 + Math.random() * 90000),
      expiryDate: new Date(Date.now() + 86400000 * 365).toISOString().split('T')[0],
      requiresPrescription: false,
      locationRack: 'A-01',
      supplierId: defaultSup?.id || '',
      supplierName: defaultSup?.name || 'شركة النهدي للتوزيع والخدمات الدوائية',
      supplier: defaultSup?.name || 'شركة النهدي للتوزيع والخدمات الدوائية',
      purchasePaymentType: 'credit',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (med: Medicine) => {
    setEditingMedicine(med);
    const supName = med.supplierName || med.supplier || '';
    const matchingSup = suppliers.find((s) => s.id === med.supplierId || s.name === supName);
    setCustomSupplierMode(!matchingSup && !!supName);
    setAddToSupplierBalance(false);
    setFormData({
      barcode: med.barcode,
      tradeName: med.tradeName,
      genericName: med.genericName,
      category: med.category,
      form: med.form,
      strength: med.strength,
      packageSize: med.packageSize,
      costPrice: med.costPrice,
      sellingPrice: med.sellingPrice,
      stock: med.stock,
      minStockLevel: med.minStockLevel,
      batchNumber: med.batchNumber,
      expiryDate: med.expiryDate,
      requiresPrescription: med.requiresPrescription,
      locationRack: med.locationRack || '',
      supplierId: matchingSup?.id || med.supplierId || '',
      supplierName: supName,
      supplier: supName,
      purchasePaymentType: med.purchasePaymentType || 'credit',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tradeName || !formData.genericName) {
      alert('يرجى إدخال اسم الدواء التجاري والعلمي');
      return;
    }

    const finalSupplierName = formData.supplierName.trim() || formData.supplier.trim() || 'مورد عام';

    const payload = {
      ...formData,
      supplier: finalSupplierName,
      supplierName: finalSupplierName,
    };

    if (editingMedicine) {
      onUpdateMedicine({
        ...editingMedicine,
        ...payload,
      });
    } else {
      onAddMedicine(payload, addToSupplierBalance);
    }
    setIsAddModalOpen(false);
  };

  const handleQuickAdjustStock = (med: Medicine) => {
    setStockModalMed(med);
    setStockAdjustmentType('add');
    setStockAdjustmentQty(10);
    setStockAdjustmentReason('purchase');
    setStockAdjustmentNotes('');
  };

  const handleConfirmStockAdjustment = () => {
    if (!stockModalMed) return;

    let newStock = stockModalMed.stock;
    if (stockAdjustmentType === 'add') {
      newStock += stockAdjustmentQty;
    } else if (stockAdjustmentType === 'remove') {
      newStock = Math.max(0, stockModalMed.stock - stockAdjustmentQty);
    } else {
      newStock = Math.max(0, stockAdjustmentQty);
    }

    const updatedMed: Medicine = {
      ...stockModalMed,
      stock: newStock,
    };
    onUpdateMedicine(updatedMed);

    if (onStockAdjustment) {
      onStockAdjustment({
        id: 'adj-' + Date.now(),
        medicineId: stockModalMed.id,
        medicineName: stockModalMed.tradeName,
        date: new Date().toISOString(),
        type: stockAdjustmentType,
        quantity: stockAdjustmentQty,
        previousStock: stockModalMed.stock,
        newStock,
        reason: stockAdjustmentReason,
        notes: stockAdjustmentNotes,
        pharmacistName: 'الصيدلي المسؤول',
      });
    }

    setStockModalMed(null);
  };

  const handleExportExcel = () => {
    exportInventoryToExcel(medicines);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">إجمالي الأصناف</span>
            <Package className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">{totalSKUs} دواء</p>
          <span className="text-[10px] text-slate-400">مسجلة في قاعدة البيانات</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">قيمة المخزون (تكلفة)</span>
            <DollarSign className="w-4 h-4 text-slate-600" />
          </div>
          <p className="text-xl font-extrabold text-slate-800">
            {totalCostValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-normal">ر.ي</span>
          </p>
          <span className="text-[10px] text-slate-400">بسعر الشراء من الشركات</span>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-semibold">قيمة المخزون (بيع)</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-extrabold text-emerald-700">
            {totalSalesValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-normal">ر.ي</span>
          </p>
          <span className="text-[10px] text-emerald-600 font-medium">
            مجمل الربح المتوقع: {(totalSalesValue - totalCostValue).toFixed(0)} ر.ي
          </span>
        </div>

        <button
          onClick={() => setStatusFilter(statusFilter === 'low' ? 'all' : 'low')}
          className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
            statusFilter === 'low'
              ? 'bg-amber-50 border-amber-400 shadow-sm ring-2 ring-amber-300'
              : 'bg-white border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-xs font-semibold">تنبيه النواقص</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-xl font-extrabold text-amber-900">{lowStockMedicines.length} صنف</p>
          <span className="text-[10px] text-amber-700">تحت حد إعادة الطلب الأدنى</span>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
          className={`p-3.5 rounded-2xl border text-right transition cursor-pointer ${
            statusFilter === 'expiring'
              ? 'bg-rose-50 border-rose-400 shadow-sm ring-2 ring-rose-300'
              : 'bg-white border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-semibold">تنبيه الصلاحية</span>
            <Calendar className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-extrabold text-rose-900">
            {expiringWithin6Months.length + expiredMedicines.length} صنف
          </p>
          <span className="text-[10px] text-rose-700">
            {expiredMedicines.length > 0 ? `${expiredMedicines.length} منتهي الصلاحية!` : 'خلال 6 أشهر'}
          </span>
        </button>
      </div>

      {/* Automatic Smart Alert Banners */}
      {(lowStockMedicines.length > 0 || expiredMedicines.length > 0) && (
        <div className="space-y-2">
          {expiredMedicines.length > 0 && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-900">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold">تنبيه حرج - أدوية منتهية الصلاحية ({expiredMedicines.length} صنف): </span>
                  <span>يرجى عزل هذه الأدوية فوراً من الرفوف لتفادي صرفها للجمهور والتنسيق مع المورد لاسترجاعها.</span>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('expired')}
                className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 text-[11px] cursor-pointer"
              >
                عرض المنتهي
              </button>
            </div>
          )}

          {lowStockMedicines.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <span className="font-extrabold">تنبيه إعادة الطلب ({lowStockMedicines.length} صنف قارب على النفاد): </span>
                  <span>الأرصدة الحالية وصلت أو انخفضت عن الحد الأدنى المحدد للمخزون.</span>
                </div>
              </div>
              <button
                onClick={() => setStatusFilter('low')}
                className="px-3 py-1 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 text-[11px] cursor-pointer"
              >
                عرض النواقص
              </button>
            </div>
          )}
        </div>
      )}

      {/* Control & Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="ابحث بالاسم التجاري أو العلمي أو الباركود..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700"
          >
            <option value="all">جميع التصنيفات الدوائية</option>
            <option value="antibiotics">مضادات حيوية</option>
            <option value="analgesics">مسكنات وخافضات حرارة</option>
            <option value="chronic">أمراض مزمنة (ضغط/سكر/قلب)</option>
            <option value="respiratory">جهاز تنفسي وحساسية</option>
            <option value="gastro">جهاز هضمي ومعدة</option>
            <option value="pediatric">أدوية أطفال</option>
            <option value="vitamins">فيتامينات ومكملات</option>
            <option value="dermatology">جلدية وتجميل</option>
            <option value="first_aid">إسعافات ومستلزمات</option>
          </select>

          {/* Supplier Dropdown Filter */}
          <select
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700"
            title="تصفية الأدوية حسب المستودع أو شركة التوزيع"
          >
            <option value="all">جميع المستودعات والموردين</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.companyType === 'warehouse' ? 'مستودع' : s.companyType === 'distributor' ? 'شركة توزيع' : 'مورد'})
              </option>
            ))}
          </select>

          {/* Payment Type Filter (آجل / نقد) */}
          <select
            value={paymentTypeFilter}
            onChange={(e) => setPaymentTypeFilter(e.target.value as any)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 outline-none font-medium text-slate-700"
            title="تصفية حسب نوع الحساب (آجل / نقد)"
          >
            <option value="all">كل طرق الحساب (آجل / نقد)</option>
            <option value="credit">حساب آجل (ذمم دائنة)</option>
            <option value="cash">شراء نقد (كاش)</option>
          </select>

          {/* Quick status tabs */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                statusFilter === 'all' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              الكل ({medicines.length})
            </button>
            <button
              onClick={() => setStatusFilter('low')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                statusFilter === 'low' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              النواقص ({lowStockMedicines.length})
            </button>
            <button
              onClick={() => setStatusFilter('expiring')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                statusFilter === 'expiring' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              قريب الانتهاء ({expiringWithin6Months.length})
            </button>
            <button
              onClick={() => setStatusFilter('rx')}
              className={`px-2.5 py-1.5 rounded-lg font-medium cursor-pointer ${
                statusFilter === 'rx' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              وصفة Rx
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
            title="تصدير كشف المخزون كاملاً إلى ملف Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>تصدير المخزون Excel</span>
          </button>

          {onOpenPurchaseReturn && (
            <button
              onClick={onOpenPurchaseReturn}
              className="flex items-center gap-1.5 bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer"
              title="تسجيل مرتجع أدوية إلى مستودع أو شركة توزيع"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>مرتجع مشتريات لمستودع</span>
            </button>
          )}

          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة دواء جديد</span>
          </button>
        </div>
      </div>

      {/* Main Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-3">الباركود</th>
                <th className="py-3 px-3">الاسم التجاري والعلمي</th>
                <th className="py-3 px-3">المورد / المستودع وطريقة الحساب</th>
                <th className="py-3 px-3">الشكل والتركيز</th>
                <th className="py-3 px-3">سعر الشراء</th>
                <th className="py-3 px-3">سعر البيع</th>
                <th className="py-3 px-3">الربح %</th>
                <th className="py-3 px-3 text-center">الرصيد المتاح</th>
                <th className="py-3 px-3">حد التنبيه</th>
                <th className="py-3 px-3">الصلاحية والتشغيلة</th>
                <th className="py-3 px-3">الرف</th>
                <th className="py-3 px-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-400">
                    لا توجد أدوية مطابقة للبحث أو التصفية الحالية
                  </td>
                </tr>
              ) : (
                filteredList.map((med) => {
                  const isLow = med.stock <= med.minStockLevel;
                  const expired = isExpired(med.expiryDate);
                  const expiring = isExpiringWithinDays(med.expiryDate, 180);
                  const daysLeft = getDaysUntilExpiry(med.expiryDate);
                  const margin = (((med.sellingPrice - med.costPrice) / med.costPrice) * 100).toFixed(0);

                  return (
                    <tr
                      key={med.id}
                      className={`hover:bg-slate-50/70 transition ${
                        expired ? 'bg-rose-50/40' : isLow ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-mono text-slate-500 font-medium">
                        {med.barcode}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{med.tradeName}</span>
                          {med.requiresPrescription && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-200">
                              Rx
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">{med.genericName}</span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1">
                          <div
                            className="flex items-center gap-1 text-slate-800 font-semibold"
                            title={med.supplierName || med.supplier || 'مورد عام'}
                          >
                            <Building className="w-3.5 h-3.5 text-teal-700 flex-shrink-0" />
                            <span className="truncate max-w-[150px] text-xs">
                              {med.supplierName || med.supplier || 'مورد عام'}
                            </span>
                          </div>
                          <div>
                            {med.purchasePaymentType === 'cash' ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                                <Banknote className="w-3 h-3 text-emerald-600" />
                                <span>شراء نقداً</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-xs">
                                <CreditCard className="w-3 h-3 text-amber-700" />
                                <span>حساب آجل (ذمم)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <span>{med.form}</span>
                        <span className="text-[10px] text-slate-400 block">{med.strength} • {med.packageSize}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700">
                        {med.costPrice.toFixed(2)} ر.ي
                      </td>
                      <td className="py-3 px-3 font-bold text-teal-800">
                        {med.sellingPrice.toFixed(2)} ر.ي
                      </td>
                      <td className="py-3 px-3">
                        <span className="bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded text-[10px]">
                          +{margin}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickAdjustStock(med)}
                            className={`font-extrabold text-sm px-2.5 py-0.5 rounded-full hover:ring-2 cursor-pointer transition ${
                              med.stock <= 0
                                ? 'bg-rose-100 text-rose-800 ring-rose-400'
                                : isLow
                                ? 'bg-amber-100 text-amber-800 ring-amber-400'
                                : 'bg-slate-100 text-slate-800 ring-slate-300'
                            }`}
                            title="انقر لتعديل الكمية أو تسجيل توريد"
                          >
                            {med.stock}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          {med.minStockLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold text-xs ${
                              expired
                                ? 'text-rose-700 font-black'
                                : expiring
                                ? 'text-amber-700 font-bold'
                                : 'text-slate-700'
                            }`}
                          >
                            {med.expiryDate}
                          </span>
                          {expired ? (
                            <span className="bg-rose-100 text-rose-700 px-1 py-0.2 rounded text-[9px] font-bold">
                              منتهي!
                            </span>
                          ) : expiring ? (
                            <span className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded text-[9px] font-bold">
                              {daysLeft} يوم
                            </span>
                          ) : null}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono block">
                          تشغيلة: {med.batchNumber}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600">
                        {med.locationRack || '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickAdjustStock(med)}
                            className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="تعديل الكمية / توريد"
                          >
                            <ArrowUpCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(med)}
                            className="p-1.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition cursor-pointer"
                            title="تعديل بيانات الدواء"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف الدواء "${med.tradeName}"؟`)) {
                                onDeleteMedicine(med.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Quick Stock Adjustment Modal */}
      {stockModalMed && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800">تعديل رصيد المخزون / توريد</h3>
                <p className="text-teal-700 font-semibold text-[11px]">{stockModalMed.tradeName}</p>
              </div>
              <button onClick={() => setStockModalMed(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
              <span className="text-slate-600">الرصيد المتاح حالياً بالمخزن:</span>
              <span className="text-base font-extrabold text-slate-900">{stockModalMed.stock} عبوة</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">نوع العملية:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setStockAdjustmentType('add')}
                  className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                    stockAdjustmentType === 'add'
                      ? 'bg-teal-600 text-white border-teal-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  + إضافة / توريد
                </button>
                <button
                  type="button"
                  onClick={() => setStockAdjustmentType('remove')}
                  className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                    stockAdjustmentType === 'remove'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  - خصم / تالف
                </button>
                <button
                  type="button"
                  onClick={() => setStockAdjustmentType('set')}
                  className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                    stockAdjustmentType === 'set'
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  = تعيين جرد
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {stockAdjustmentType === 'set' ? 'الرصيد الجديد الفعلي بعد الجرد:' : 'الكمية المراد تعديلها:'}
              </label>
              <input
                type="number"
                min="1"
                value={stockAdjustmentQty}
                onChange={(e) => setStockAdjustmentQty(parseInt(e.target.value) || 0)}
                className="w-full text-base font-extrabold p-2 border rounded-xl outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">سبب التعديل:</label>
              <select
                value={stockAdjustmentReason}
                onChange={(e) => setStockAdjustmentReason(e.target.value as any)}
                className="w-full border rounded-xl p-2 outline-none"
              >
                <option value="purchase">فاتورة مشتريات وتوريد جديد من المستودع</option>
                <option value="inventory_count">تسوية جرد دوري فعلي</option>
                <option value="damage">إتلاف عبوات تالفة أو كسر</option>
                <option value="expired">أدوية منتهية الصلاحية معزولة</option>
                <option value="return_supplier">مرتجع إلى شركة التوزيع</option>
                <option value="other">أسباب أخرى</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">ملاحظات / رقم الفاتورة أو إذن الاستلام:</label>
              <input
                type="text"
                placeholder="رقم إذن الاستلام أو سبب التسوية..."
                value={stockAdjustmentNotes}
                onChange={(e) => setStockAdjustmentNotes(e.target.value)}
                className="w-full border rounded-xl p-2 outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <button
                type="button"
                onClick={() => setStockModalMed(null)}
                className="px-3 py-1.5 border rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmStockAdjustment}
                className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
              >
                تأكيد تحديث الرصيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Medicine Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <h3 className="font-bold text-base text-slate-800">
                {editingMedicine ? 'تعديل بيانات الدواء ومستويات التنبيه' : 'إضافة دواء جديد إلى الدليل الصيدلاني'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الاسم التجاري (Brand Name):</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: بانادول إكسترا (Panadol Extra)"
                    value={formData.tradeName}
                    onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الاسم العلمي والمادة الفعالة:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: Paracetamol 500mg"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الباركود الدولي:</label>
                  <input
                    type="text"
                    required
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">التصنيف الدوائي:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as MedicineCategory })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  >
                    <option value="analgesics">مسكنات وخافضات حرارة</option>
                    <option value="antibiotics">مضادات حيوية</option>
                    <option value="chronic">أمراض مزمنة (ضغط/سكر/قلب)</option>
                    <option value="respiratory">جهاز تنفسي وحساسية</option>
                    <option value="gastro">جهاز هضمي ومعدة</option>
                    <option value="pediatric">أدوية أطفال</option>
                    <option value="vitamins">فيتامينات ومكملات</option>
                    <option value="dermatology">جلدية وتجميل</option>
                    <option value="first_aid">إسعافات ومستلزمات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">الشكل الصيدلاني (Form):</label>
                  <input
                    type="text"
                    placeholder="أقراص / شراب / حقن / كبسولات / مرهم"
                    value={formData.form}
                    onChange={(e) => setFormData({ ...formData, form: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">التركيز والعبوة:</label>
                  <input
                    type="text"
                    placeholder="500mg - علبة 24 قرص"
                    value={formData.packageSize}
                    onChange={(e) => setFormData({ ...formData, packageSize: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">سعر التكلفة / الشراء (ر.ي):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">سعر البيع للجمهور (ر.ي):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">الكمية والرصيد المتاح حالياً:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                    className="w-full border-2 border-teal-500 rounded-lg p-2 outline-none font-extrabold text-sm"
                  />
                </div>

                <div>
                  <label className="block text-amber-800 font-bold mb-1">حد التنبيه التلقائي للنواقص (الحد الأدنى):</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.minStockLevel}
                    onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 5 })}
                    className="w-full border-2 border-amber-400 rounded-lg p-2 outline-none font-bold"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    يتم إطلاق تنبيه تلقائي بمجرد وصول الرصيد إلى هذا الرقم أو أقل
                  </span>
                </div>

                <div>
                  <label className="block text-rose-800 font-bold mb-1">تاريخ انتهاء الصلاحية:</label>
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full border-2 border-rose-300 rounded-lg p-2 outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">رقم التشغيلة (Batch Number):</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">مكان الرف / المخزن:</label>
                  <input
                    type="text"
                    placeholder="مثال: رف B-04"
                    value={formData.locationRack}
                    onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500"
                  />
                </div>

                {/* Dedicated Supplier & Payment Account Section (المورد / المستودع وطريقة الحساب آجل أو نقد) */}
                <div className="sm:col-span-2 bg-gradient-to-br from-slate-50 to-indigo-50/40 p-4 rounded-2xl border-2 border-indigo-200/80 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold">
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                          جهة التوريد وطريقة الحساب (المستودع / الشركة)
                        </h4>
                        <p className="text-[10px] text-slate-500">
                          تحديد المورد أو المستودع لمعرفة مصدر المنتج وطريقة حسابه (آجل أو نقد)
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setCustomSupplierMode(!customSupplierMode)}
                      className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-100/70 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition cursor-pointer"
                    >
                      {customSupplierMode ? 'اختر من قائمة المستودعات' : 'مورد آخر غير مسجل'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Supplier Select / Input */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        اسم المورد أو المستودع:
                        <span className="text-rose-500 mr-1">*</span>
                      </label>
                      {customSupplierMode || suppliers.length === 0 ? (
                        <input
                          type="text"
                          required
                          placeholder="اكتب اسم المستودع أو شركة التوزيع..."
                          value={formData.supplierName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              supplierName: e.target.value,
                              supplier: e.target.value,
                            })
                          }
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-bold text-slate-800"
                        />
                      ) : (
                        <select
                          value={formData.supplierId}
                          onChange={(e) => {
                            const supId = e.target.value;
                            const sel = suppliers.find((s) => s.id === supId);
                            setFormData({
                              ...formData,
                              supplierId: supId,
                              supplierName: sel?.name || '',
                              supplier: sel?.name || '',
                            });
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl p-2.5 outline-none focus:border-indigo-500 font-bold text-slate-800"
                        >
                          <option value="">-- اختر المستودع أو شركة التوزيع --</option>
                          {suppliers.map((sup) => (
                            <option key={sup.id} value={sup.id}>
                              {sup.name} (
                              {sup.companyType === 'warehouse'
                                ? 'مستودع'
                                : sup.companyType === 'distributor'
                                ? 'شركة توزيع'
                                : sup.companyType === 'manufacturer'
                                ? 'مصنع'
                                : 'وكيل'}
                              {sup.balanceDue > 0 ? ` • متبقي له: ${sup.balanceDue.toFixed(0)} ر.ي` : ''})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Payment Account Type (آجل / نقد) */}
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        نوع الحساب وطريقة الشراء:
                        <span className="text-rose-500 mr-1">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, purchasePaymentType: 'credit' })}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            formData.purchasePaymentType === 'credit'
                              ? 'bg-amber-100/90 border-amber-500 text-amber-950 font-black shadow-sm ring-2 ring-amber-300'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="w-4 h-4 text-amber-700" />
                            <span className="text-xs">حساب آجل (ذمم)</span>
                          </div>
                          <span className="text-[10px] text-amber-800 font-normal">تسجل كذمة دائنة للمورد</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, purchasePaymentType: 'cash' })}
                          className={`p-2.5 rounded-xl border text-center transition cursor-pointer flex flex-col items-center justify-center gap-1 ${
                            formData.purchasePaymentType === 'cash'
                              ? 'bg-emerald-100/90 border-emerald-500 text-emerald-950 font-black shadow-sm ring-2 ring-emerald-300'
                              : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <Banknote className="w-4 h-4 text-emerald-700" />
                            <span className="text-xs">شراء نقد (كاش)</span>
                          </div>
                          <span className="text-[10px] text-emerald-800 font-normal">مسدد نقداً بالكامل</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Summary calculations for Purchase Batch */}
                  <div className="bg-white/80 border border-indigo-100 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">إجمالي فاتورة التوريد الحالية:</span>
                      <span className="font-black text-indigo-900 text-sm">
                        {(formData.stock * formData.costPrice).toFixed(2)} ر.ي
                      </span>
                      <span className="text-[10px] text-slate-400">
                        ({formData.stock} عبوة × {formData.costPrice.toFixed(2)} ر.ي تكلفة)
                      </span>
                    </div>

                    {formData.purchasePaymentType === 'credit' && !editingMedicine && (
                      <label className="flex items-center gap-1.5 text-amber-900 font-bold cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addToSupplierBalance}
                          onChange={(e) => setAddToSupplierBalance(e.target.checked)}
                          className="w-4 h-4 rounded text-amber-600"
                        />
                        <span className="text-[11px]">
                          إضافة المبلغ ({(formData.stock * formData.costPrice).toFixed(2)} ر.ي) لرصيد الذمم الدائنة تلقائياً
                        </span>
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <label className="flex items-center gap-2 text-slate-700 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiresPrescription}
                      onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                      className="w-4 h-4 rounded text-rose-600"
                    />
                    <span>يتطلب وصفة طبية ملزمة (Rx)</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl shadow-md cursor-pointer"
                >
                  حفظ في الدليل والمخزون
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
