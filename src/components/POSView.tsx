import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  ShieldCheck,
  User,
  Phone,
  FileCheck,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  ChevronDown,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { Medicine, CartItem, PaymentMethod, CustomerInfo, Invoice, PharmacySettings, ElectronicWalletProvider } from '../types';

interface POSViewProps {
  medicines: Medicine[];
  onCompleteSale: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>) => Invoice;
  currentPharmacist: string;
  currentShiftId: string;
  onOpenReceipt: (invoice: Invoice) => void;
  onOpenSalesReturn?: () => void;
  pharmacySettings?: PharmacySettings;
}

const DEFAULT_INSURANCE_COMPANIES = [
  'بوبا العربية للتأمين (Bupa)',
  'التعاونية للتأمين (Tawuniya)',
  'ميدغلف للتأمين الطبي (MedGulf)',
  'تكافل الراجحي للتأمين (Al Rajhi)',
  'الدرع العربي للتأمين (Arabian Shield)',
  'ملاذ للتأمين (Malath)',
  'أكسا للتأمين التعاوني (GIG / AXA)',
  'سلامة للتأمين التعاوني (Salama)',
  'المتحدة للتأمين (UCA)',
  'الصقر للتأمين التعاوني (Al Sagr)',
];

export const POSView: React.FC<POSViewProps> = ({
  medicines,
  onCompleteSale,
  currentPharmacist,
  currentShiftId,
  onOpenReceipt,
  onOpenSalesReturn,
  pharmacySettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [applyTax, setApplyTax] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountPaid, setAmountPaid] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Medical Insurance State
  const [insuranceCompanies, setInsuranceCompanies] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('pharma_insurance_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_INSURANCE_COMPANIES;
  });
  const [newCompanyName, setNewCompanyName] = useState<string>('');
  const [showAddCompanyInput, setShowAddCompanyInput] = useState<boolean>(false);
  const [insuranceCompany, setInsuranceCompany] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('pharma_insurance_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0];
      }
    } catch {}
    return 'بوبا العربية للتأمين (Bupa)';
  });
  const [insuranceCardNo, setInsuranceCardNo] = useState<string>('');
  const [insuranceApprovalNo, setInsuranceApprovalNo] = useState<string>('');
  const [insuranceDeductible, setInsuranceDeductible] = useState<number>(20); // 20% co-pay
  const [copayPaymentMethod, setCopayPaymentMethod] = useState<'cash' | 'card'>('cash');
  const [copayWalletProvider, setCopayWalletProvider] = useState<ElectronicWalletProvider>('جيب');
  const [selectedWallet, setSelectedWallet] = useState<ElectronicWalletProvider>('جيب');
  const [walletRefNumber, setWalletRefNumber] = useState<string>('');
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState<boolean>(false);

  const WALLET_PROVIDERS: ElectronicWalletProvider[] = ['جيب', 'كاش', 'محفظتي', 'وان كاش'];

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleAddInsuranceCompany = () => {
    const trimmed = newCompanyName.trim();
    if (!trimmed) return;
    if (!insuranceCompanies.includes(trimmed)) {
      const updated = [...insuranceCompanies, trimmed];
      setInsuranceCompanies(updated);
      localStorage.setItem('pharma_insurance_companies', JSON.stringify(updated));
    }
    setInsuranceCompany(trimmed);
    setNewCompanyName('');
    setShowAddCompanyInput(false);
  };

  // Auto focus search input on mount
  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Filter medicines
  const filteredMedicines = medicines.filter((med) => {
    const matchesSearch =
      med.tradeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.barcode.includes(searchQuery);

    const matchesCategory =
      selectedCategory === 'all' || med.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Add medicine to cart
  const addToCart = (med: Medicine) => {
    if (med.stock <= 0) {
      alert(`عذراً، الدواء "${med.tradeName}" غير متوفر حالياً بالمخزون!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicine.id === med.id);
      if (existing) {
        if (existing.quantity >= med.stock) {
          alert(`لا يمكن إضافة أكثر من الرصيد المتوفر (${med.stock} وحدة)`);
          return prev;
        }
        return prev.map((item) =>
          item.medicine.id === med.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice * (1 - item.discountPercent / 100),
              }
            : item
        );
      } else {
        return [
          ...prev,
          {
            medicine: med,
            quantity: 1,
            unitPrice: med.sellingPrice,
            discountPercent: 0,
            total: med.sellingPrice,
            dosageNotes: '',
          },
        ];
      }
    });
  };

  // Modify quantity
  const updateQuantity = (medId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicine.id === medId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.medicine.stock) {
              alert(`الرصيد المتاح هو ${item.medicine.stock} فقط`);
              return item;
            }
            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice * (1 - item.discountPercent / 100),
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  // Update dosage note
  const updateDosageNote = (medId: string, note: string) => {
    setCart((prev) =>
      prev.map((item) => (item.medicine.id === medId ? { ...item, dosageNotes: note } : item))
    );
  };

  // Remove item
  const removeFromCart = (medId: string) => {
    setCart((prev) => prev.filter((item) => item.medicine.id !== medId));
  };

  // Dynamic Admin Configured VAT Percentage
  const adminTaxPercent = useMemo(() => {
    if (pharmacySettings?.taxRate !== undefined) {
      const r = Number(pharmacySettings.taxRate);
      return (r > 0 && r <= 1) ? r * 100 : r;
    }
    try {
      const saved = localStorage.getItem('pharma_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.taxRate !== undefined) {
          const r = Number(parsed.taxRate);
          return (r > 0 && r <= 1) ? r * 100 : r;
        }
      }
    } catch {}
    return 0;
  }, [pharmacySettings]);

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const costTotal = cart.reduce((sum, item) => sum + item.quantity * item.medicine.costPrice, 0);
  const discountTotal = (subtotal * discountPercent) / 100;
  const taxableBase = subtotal - discountTotal;
  const taxRate = (applyTax && adminTaxPercent > 0) ? (adminTaxPercent / 100) : 0;
  const taxAmount = taxableBase * taxRate;
  
  // Insurance calculation:
  // totalBeforeInsurance: Full value of medicines sold
  const totalBeforeInsurance = taxableBase + taxAmount;
  // كم يكون على العميل (نسبة التحمل)
  const customerCopayAmount = (totalBeforeInsurance * insuranceDeductible) / 100;
  // كم يكون على شركة التأمين (المطالبة المالية)
  const insuranceCompanyAmount = Math.max(0, totalBeforeInsurance - customerCopayAmount);

  // Grand total represents the complete sale value
  const grandTotal = totalBeforeInsurance;

  // The actual cash or card due from the customer right now at POS:
  // For insurance, patient pays only their copay/deductible
  const amountDueFromCustomer = paymentMethod === 'insurance' ? customerCopayAmount : grandTotal;

  const grossProfit = totalBeforeInsurance - costTotal;

  // Tendered calculation (against amountDueFromCustomer)
  const tendered = parseFloat(amountPaid) || amountDueFromCustomer;
  const change = Math.max(0, tendered - amountDueFromCustomer);

  // Complete checkout
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('السلة فارغة! يرجى إضافة أدوية أولاً');
      return;
    }

    if (paymentMethod === 'cash' && parseFloat(amountPaid) < amountDueFromCustomer && amountPaid !== '') {
      alert('المبلغ المدفوع أقل من إجمالي الفاتورة المطلوب!');
      return;
    }

    if (paymentMethod === 'insurance' && copayPaymentMethod === 'cash' && parseFloat(amountPaid) < customerCopayAmount && amountPaid !== '') {
      alert('المبلغ المدفوع أقل من نسبة تحمل المريض المطلوبة!');
      return;
    }

    const customer: CustomerInfo | undefined =
      customerName || customerPhone || paymentMethod === 'insurance' || paymentMethod === 'card'
        ? {
            name: customerName || (paymentMethod === 'insurance' ? 'مريض تأمين طبي' : paymentMethod === 'card' ? `عميل محفظة ${selectedWallet}` : 'عميل نقدي'),
            phone: customerPhone,
            insuranceCompany: paymentMethod === 'insurance' ? insuranceCompany : undefined,
            insuranceCardNumber: paymentMethod === 'insurance' ? insuranceCardNo : undefined,
            insuranceApprovalNumber: paymentMethod === 'insurance' ? insuranceApprovalNo : undefined,
            insuranceDeductible: paymentMethod === 'insurance' ? insuranceDeductible : undefined,
            customerCopayAmount: paymentMethod === 'insurance' ? customerCopayAmount : undefined,
            insuranceCompanyAmount: paymentMethod === 'insurance' ? insuranceCompanyAmount : undefined,
            copayPaymentMethod: paymentMethod === 'insurance' ? copayPaymentMethod : undefined,
            walletProvider:
              paymentMethod === 'card'
                ? selectedWallet
                : paymentMethod === 'insurance' && copayPaymentMethod === 'card'
                ? copayWalletProvider
                : undefined,
            walletReferenceNumber:
              paymentMethod === 'card' ? (walletRefNumber.trim() || undefined) : undefined,
          }
        : undefined;

    const newInvoice = onCompleteSale({
      date: new Date().toISOString(),
      items: [...cart],
      subtotal,
      discountTotal,
      taxAmount,
      grandTotal,
      costTotal,
      grossProfit,
      paymentMethod,
      walletProvider:
        paymentMethod === 'card'
          ? selectedWallet
          : paymentMethod === 'insurance' && copayPaymentMethod === 'card'
          ? copayWalletProvider
          : undefined,
      walletReferenceNumber:
        paymentMethod === 'card' ? (walletRefNumber.trim() || undefined) : undefined,
      amountPaid:
        paymentMethod === 'insurance'
          ? copayPaymentMethod === 'cash'
            ? tendered
            : customerCopayAmount
          : paymentMethod === 'cash'
          ? tendered
          : grandTotal,
      amountChange:
        paymentMethod === 'cash' || (paymentMethod === 'insurance' && copayPaymentMethod === 'cash')
          ? change
          : 0,
      customer,
      customerCopayAmount: paymentMethod === 'insurance' ? customerCopayAmount : undefined,
      insuranceCompanyAmount: paymentMethod === 'insurance' ? insuranceCompanyAmount : undefined,
      insuranceApprovalNumber: paymentMethod === 'insurance' ? insuranceApprovalNo : undefined,
      pharmacistName: currentPharmacist,
      shiftId: currentShiftId,
      notes:
        paymentMethod === 'insurance'
          ? `تأمين: ${insuranceCompany} | موافقة: ${insuranceApprovalNo || 'بدون'} | على العميل: ${customerCopayAmount.toFixed(2)} ر.ي (${insuranceDeductible}%) | على الشركة: ${insuranceCompanyAmount.toFixed(2)} ر.ي`
          : paymentMethod === 'card'
          ? `دفع إلكتروني عبر محفظة ${selectedWallet}${walletRefNumber.trim() ? ' (رقم العملية: ' + walletRefNumber.trim() + ')' : ''}`
          : undefined,
    });

    // Reset cart
    setCart([]);
    setDiscountPercent(0);
    setAmountPaid('');
    setCustomerName('');
    setCustomerPhone('');
    setInsuranceCardNo('');
    setInsuranceApprovalNo('');
    setWalletRefNumber('');

    // Open receipt modal immediately
    onOpenReceipt(newInvoice);
  };

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'analgesics', label: 'مسكنات' },
    { id: 'antibiotics', label: 'مضادات حيوية' },
    { id: 'chronic', label: 'أمراض مزمنة' },
    { id: 'respiratory', label: 'جهاز تنفسي' },
    { id: 'gastro', label: 'جهاز هضمي' },
    { id: 'pediatric', label: 'أطفال' },
    { id: 'vitamins', label: 'فيتامينات' },
    { id: 'dermatology', label: 'جلدية' },
    { id: 'first_aid', label: 'إسعافات' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-130px)] max-w-7xl mx-auto p-4">
      {/* Left side (Medicines catalog & search) - 7 cols on large */}
      <div className="lg:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden h-full">
        {/* Search header & Barcode input */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-col gap-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم التجاري، العلمي، أو امسح الباركود..."
                className="w-full pl-3 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded"
                >
                  مسح
                </button>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-slate-200/80 px-2.5 py-2.5 rounded-xl text-slate-700 text-xs font-medium">
              <Barcode className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">ماسح الباركود نشط</span>
            </div>

            {onOpenSalesReturn && (
              <button
                type="button"
                onClick={onOpenSalesReturn}
                className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 px-3 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm shrink-0"
                title="تسجيل مرتجع مبيعات لعميل"
              >
                <RotateCcw className="w-4 h-4 text-amber-700" />
                <span>مرتجع مبيعات</span>
              </button>
            )}
          </div>

          {/* Quick Categories Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Medicines Grid */}
        <div className="flex-1 overflow-y-auto p-3.5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 content-start">
          {filteredMedicines.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-400">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-600">لم يتم العثور على أدوية مطابقة للبحث</p>
              <p className="text-xs mt-1">تأكد من كتابة الاسم أو الباركود بشكل صحيح أو أضف الدواء للدليل</p>
            </div>
          ) : (
            filteredMedicines.map((med) => {
              const isLowStock = med.stock <= med.minStockLevel;
              const isOutOfStock = med.stock <= 0;

              return (
                <div
                  key={med.id}
                  onClick={() => !isOutOfStock && addToCart(med)}
                  className={`group relative p-3 rounded-xl border text-right transition flex flex-col justify-between ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white border-slate-200/90 hover:border-teal-500 hover:shadow-md cursor-pointer'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                        {med.barcode.slice(-5)}
                      </span>
                      {med.requiresPrescription && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          Rx وصفة
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-800 text-xs sm:text-sm line-clamp-1 group-hover:text-teal-700 transition">
                      {med.tradeName}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-1 font-mono">{med.genericName}</p>
                    <div className="mt-1 text-[11px] text-slate-400 flex items-center justify-between">
                      <span>{med.form}</span>
                      <span>{med.packageSize}</span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-extrabold text-teal-700">
                        {med.sellingPrice.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 mr-1">ر.ي</span>
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {isOutOfStock ? 'نفد' : `${med.stock} متاح`}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right side (Current Cart & Cash Checkout) - 5 cols */}
      <div className="lg:col-span-5 flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden h-full">
        {/* Cart Header */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-teal-100 text-teal-800 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-800 text-sm">سلة الصرف والفاتورة الحالية</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={() => setCart([])}
              className="text-xs text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إفراغ السلة</span>
            </button>
          )}
        </div>

        {/* Customer Mini Bar */}
        <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs">
          <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 px-2 py-1.5 rounded-lg">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="اسم العميل (اختياري)..."
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full text-xs outline-none"
            />
          </div>
          <div className="w-32 flex items-center gap-1 bg-white border border-slate-200 px-2 py-1.5 rounded-lg">
            <Phone className="w-3 h-3 text-slate-400" />
            <input
              type="tel"
              placeholder="الجوال..."
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full text-xs outline-none"
            />
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
              <ShoppingCart className="w-12 h-12 text-slate-200 mb-2" />
              <p className="font-semibold text-slate-600 text-sm">السلة فارغة</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[220px]">
                انقر على أي دواء من القائمة أو امسح الباركود لإضافته لفاتورة العميل
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.medicine.id}
                className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50 transition flex flex-col gap-1.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{item.medicine.tradeName}</h4>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {item.unitPrice.toFixed(2)} ر.ي للوحدة
                    </span>
                  </div>
                  <div className="text-left font-bold text-xs text-teal-800">
                    {item.total.toFixed(2)} ر.ي
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      onClick={() => updateQuantity(item.medicine.id, -1)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.medicine.id, 1)}
                      className="w-5 h-5 flex items-center justify-center bg-white rounded shadow-sm text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Dosage Note input */}
                  <input
                    type="text"
                    placeholder="تعليمات الجرعة (مثال: قرص 3 مرات بعد الأكل)..."
                    value={item.dosageNotes || ''}
                    onChange={(e) => updateDosageNote(item.medicine.id, e.target.value)}
                    className="flex-1 text-[11px] bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:outline-none"
                  />

                  <button
                    onClick={() => removeFromCart(item.medicine.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="حذف الصنف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculation & Payment Summary */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/90 space-y-2.5 text-xs">
          {/* Subtotal, Discount & Tax toggles */}
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between items-center">
              <span>الإجمالي قبل الخصم:</span>
              <span className="font-semibold text-slate-800">{subtotal.toFixed(2)} ر.ي</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span>الخصم:</span>
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded px-1.5 py-0.5">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    placeholder="0"
                    className="w-8 text-center text-xs font-semibold outline-none"
                  />
                  <span className="text-[10px] text-slate-400">%</span>
                </div>
              </div>
              <span className="text-rose-600 font-semibold">- {discountTotal.toFixed(2)} ر.ي</span>
            </div>

            <div className="flex justify-between items-center">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applyTax && adminTaxPercent > 0}
                  disabled={adminTaxPercent === 0}
                  onChange={(e) => setApplyTax(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>
                  ضريبة القيمة المضافة ({adminTaxPercent}%):
                  {adminTaxPercent === 0 && (
                    <span className="text-[10px] text-slate-400 font-normal mr-1">(0% محددة من الإدارة)</span>
                  )}
                </span>
              </label>
              <span className="font-semibold text-slate-800">{taxAmount.toFixed(2)} ر.ي</span>
            </div>

            {paymentMethod === 'insurance' && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 space-y-1.5 text-xs">
                <div className="flex justify-between items-center text-teal-900 font-bold border-b border-teal-200 pb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-700" />
                    توزيع قيمة الفاتورة الطبية:
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInsuranceModalOpen(true)}
                    className="text-[10px] bg-teal-600 hover:bg-teal-700 text-white px-2 py-0.5 rounded font-semibold cursor-pointer"
                  >
                    تعديل البيانات
                  </button>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>شركة التأمين:</span>
                  <span className="font-bold text-slate-900 truncate max-w-[170px]">{insuranceCompany}</span>
                </div>
                {insuranceApprovalNo && (
                  <div className="flex justify-between items-center text-slate-700">
                    <span>رقم الموافقة الطبية:</span>
                    <span className="font-mono font-bold text-teal-800">{insuranceApprovalNo}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-700">
                  <span>كم على العميل (التحمل {insuranceDeductible}%):</span>
                  <span className="font-extrabold text-teal-800 font-mono text-sm">{customerCopayAmount.toFixed(2)} ر.ي</span>
                </div>
                <div className="flex justify-between items-center text-slate-700">
                  <span>كم على شركة التأمين (المطالبة {100 - insuranceDeductible}%):</span>
                  <span className="font-extrabold text-indigo-800 font-mono text-sm">{insuranceCompanyAmount.toFixed(2)} ر.ي</span>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-sm font-extrabold text-slate-900">
              <span>{paymentMethod === 'insurance' ? 'المطلوب تحصيله من العميل:' : 'المبلغ المطلوب سداده:'}</span>
              <span className="text-teal-700 text-base">{amountDueFromCustomer.toFixed(2)} ر.ي</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">طريقة الدفع:</label>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'cash'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-3.5 h-3.5" />
                <span>نقداً</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-1.5 px-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer text-[11px] ${
                  paymentMethod === 'card'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
                title="الدفع عبر جيب أو كاش أو محفظتي أو وان كاش"
              >
                <Wallet className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">جيب/كاش/محفظتي/وان كاش</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('credit')}
                className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'credit'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>آجل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('insurance');
                  setIsInsuranceModalOpen(true);
                }}
                className={`py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1 transition cursor-pointer ${
                  paymentMethod === 'insurance'
                    ? 'bg-teal-700 text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>تأمين</span>
              </button>
            </div>

            {/* Wallet Selector Sub-bar when Wallet Payment is Active */}
            {paymentMethod === 'card' && (
              <div className="bg-white p-2.5 rounded-xl border border-teal-300 shadow-2xs space-y-2 mt-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                  <span className="flex items-center gap-1 text-teal-800">
                    <Wallet className="w-3.5 h-3.5 text-teal-600" />
                    المحفظة الإلكترونية المعتمدة:
                  </span>
                  <span className="text-teal-700 font-extrabold bg-teal-50 px-2 py-0.5 rounded border border-teal-200 font-sans">
                    محفظة {selectedWallet}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {WALLET_PROVIDERS.map((wallet) => (
                    <button
                      key={wallet}
                      type="button"
                      onClick={() => setSelectedWallet(wallet)}
                      className={`py-1.5 px-1 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                        selectedWallet === wallet
                          ? 'bg-teal-700 text-white shadow-xs'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="رقم العملية / الحوالة بالمحفظة (اختياري)"
                    value={walletRefNumber}
                    onChange={(e) => setWalletRefNumber(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Cash Tendered & Change if Cash or Insurance with Cash Copay */}
          {((paymentMethod === 'cash') || (paymentMethod === 'insurance' && copayPaymentMethod === 'cash')) && cart.length > 0 && (
            <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-[10px] text-slate-500 mb-0.5">
                  {paymentMethod === 'insurance' ? 'المبلغ المستلم لتحمل المريض:' : 'المبلغ المستلم من العميل:'}
                </label>
                <input
                  type="number"
                  placeholder={amountDueFromCustomer.toFixed(2)}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 outline-none"
                />
              </div>
              <div className="border-r border-slate-200 pr-2 text-left">
                <span className="block text-[10px] text-slate-500">المتبقي (الفكة):</span>
                <span className={`text-xs font-extrabold ${change > 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {change.toFixed(2)} ر.ي
                </span>
              </div>
            </div>
          )}

          {/* Checkout Action Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer ${
              cart.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>
              {paymentMethod === 'insurance'
                ? `إتمام بيع التأمين وطباعة الفاتورة (تحصيل ${customerCopayAmount.toFixed(2)} ر.ي)`
                : `إتمام البيع وطباعة الفاتورة (${grandTotal.toFixed(2)} ر.ي)`}
            </span>
          </button>
        </div>
      </div>

      {/* Insurance Details Sub-Modal */}
      {isInsuranceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between text-teal-800 font-bold mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-extrabold">بيانات التأمين الطبي والموافقة</h3>
              </div>
              <span className="text-[11px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded font-mono">
                فاتورة معتمدة
              </span>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Insurance Company Picker & Add Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-slate-700 font-bold">شركة التأمين الطبي:</label>
                  {!showAddCompanyInput && (
                    <button
                      type="button"
                      onClick={() => setShowAddCompanyInput(true)}
                      className="text-teal-700 hover:text-teal-900 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة شركة تأمين جديدة</span>
                    </button>
                  )}
                </div>

                {showAddCompanyInput ? (
                  <div className="p-2.5 bg-slate-50 border border-teal-200 rounded-xl space-y-2">
                    <span className="block text-[11px] font-bold text-teal-900">
                      إضافة شركة تأمين جديدة إلى القائمة:
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="أدخل اسم شركة التأمين (مثال: سلامة للتأمين الطبي)"
                        value={newCompanyName}
                        onChange={(e) => setNewCompanyName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddInsuranceCompany();
                          }
                        }}
                        className="flex-1 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white outline-none focus:border-teal-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={handleAddInsuranceCompany}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        حفظ وإضافة
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCompanyInput(false);
                          setNewCompanyName('');
                        }}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-2 py-1.5 rounded-lg text-xs cursor-pointer"
                      >
                        إلغاء
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={insuranceCompany}
                    onChange={(e) => setInsuranceCompany(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 bg-white outline-none focus:border-teal-500 font-semibold text-slate-800"
                  >
                    {insuranceCompanies.map((comp) => (
                      <option key={comp} value={comp}>
                        {comp}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Card Number & Approval Number Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم بطاقة التأمين / العضوية:
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: 982103445"
                    value={insuranceCardNo}
                    onChange={(e) => setInsuranceCardNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    رقم الموافقة الطبية (Approval No):
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: APPR-2026-881"
                    value={insuranceApprovalNo}
                    onChange={(e) => setInsuranceApprovalNo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 outline-none focus:border-teal-500 font-mono"
                  />
                </div>
              </div>

              {/* Deductible percentage selector */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-700 font-bold">نسبة التحمل على المريض (%):</label>
                  <span className="font-mono font-extrabold text-teal-700 text-sm">{insuranceDeductible}%</span>
                </div>
                <div className="flex gap-1.5">
                  {[0, 5, 10, 15, 20, 25, 30].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setInsuranceDeductible(rate)}
                      className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition text-xs ${
                        insuranceDeductible === rate
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment method for customer's copay */}
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  طريقة تحصيل نسبة تحمل المريض بالصندوق:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCopayPaymentMethod('cash')}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                      copayPaymentMethod === 'cash'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>تحصيل نقداً (درج الكاشير)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCopayPaymentMethod('card')}
                    className={`py-2 px-3 rounded-lg border font-bold flex items-center justify-center gap-1.5 cursor-pointer transition text-xs ${
                      copayPaymentMethod === 'card'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>تحصيل محفظة (جيب / كاش / محفظتي / وان كاش)</span>
                  </button>
                </div>
                {copayPaymentMethod === 'card' && (
                  <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-teal-200 space-y-1">
                    <span className="block text-[10px] text-slate-600 font-bold">حدد المحفظة الإلكترونية لسداد التحمل:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {WALLET_PROVIDERS.map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setCopayWalletProvider(w)}
                          className={`py-1 px-1 rounded text-[11px] font-bold cursor-pointer transition ${
                            copayWalletProvider === w
                              ? 'bg-teal-700 text-white shadow-2xs'
                              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Live Financial Breakdown Card (كم على العميل وكم على الشركة) */}
              <div className="bg-gradient-to-br from-teal-50 to-indigo-50 border border-teal-200 rounded-xl p-3.5 space-y-2">
                <span className="block font-bold text-slate-900 border-b border-teal-200 pb-1">
                  احتساب توزيع الفاتورة (كم على العميل وكم على شركة التأمين):
                </span>
                
                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-2xs">
                    <span className="block text-[10px] text-slate-500 font-medium">إجمالي الفاتورة</span>
                    <span className="block text-xs font-black text-slate-800 font-mono mt-0.5">
                      {totalBeforeInsurance.toFixed(2)} ر.ي
                    </span>
                  </div>

                  <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200 shadow-2xs">
                    <span className="block text-[10px] text-emerald-800 font-bold">
                      كم على العميل ({insuranceDeductible}%)
                    </span>
                    <span className="block text-sm font-black text-emerald-900 font-mono mt-0.5">
                      {customerCopayAmount.toFixed(2)} ر.ي
                    </span>
                  </div>

                  <div className="bg-indigo-50/80 p-2 rounded-lg border border-indigo-200 shadow-2xs">
                    <span className="block text-[10px] text-indigo-800 font-bold">
                      كم على الشركة ({100 - insuranceDeductible}%)
                    </span>
                    <span className="block text-sm font-black text-indigo-900 font-mono mt-0.5">
                      {insuranceCompanyAmount.toFixed(2)} ر.ي
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2 justify-end border-t pt-3">
              <button
                type="button"
                onClick={() => setIsInsuranceModalOpen(false)}
                className="px-5 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 shadow-md shadow-teal-600/20 cursor-pointer text-xs"
              >
                تأكيد واعتماد بيانات التأمين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
