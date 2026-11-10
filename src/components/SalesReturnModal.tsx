import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  X,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Receipt,
  Banknote,
  CreditCard,
  User,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Invoice, Medicine, SalesReturn, SalesReturnItem, CURRENCY } from '../types';

interface SalesReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: Invoice[];
  medicines: Medicine[];
  currentPharmacist: string;
  currentShiftId: string;
  initialInvoice?: Invoice | null;
  onCompleteReturn: (returnRecord: Omit<SalesReturn, 'id' | 'returnNumber'>) => void;
}

export const SalesReturnModal: React.FC<SalesReturnModalProps> = ({
  isOpen,
  onClose,
  invoices,
  medicines,
  currentPharmacist,
  currentShiftId,
  initialInvoice,
  onCompleteReturn,
}) => {
  if (!isOpen) return null;

  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string>(initialInvoice?.id || '');
  const [invoiceSearch, setInvoiceSearch] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<{
    medicine: Medicine;
    quantity: number;
    maxQuantity: number;
    unitPrice: number;
    costPrice: number;
    reason: SalesReturnItem['reason'];
    reasonText?: string;
  }[]>(() => {
    if (initialInvoice && initialInvoice.items.length > 0) {
      return initialInvoice.items.map((it) => ({
        medicine: it.medicine,
        quantity: 1,
        maxQuantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.medicine.costPrice,
        reason: 'customer_mind',
      }));
    }
    return [];
  });

  const [refundMethod, setRefundMethod] = useState<'cash' | 'card' | 'credit'>('cash');
  const [customerName, setCustomerName] = useState<string>(initialInvoice?.customer?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(initialInvoice?.customer?.phone || '');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Manual medicine search (if returning without invoice)
  const [showManualMedicineSearch, setShowManualMedicineSearch] = useState(false);
  const [manualMedSearch, setManualMedSearch] = useState('');

  // Selected invoice object
  const activeInvoice = useMemo(() => {
    return invoices.find((inv) => inv.id === selectedInvoiceId) || initialInvoice || null;
  }, [invoices, selectedInvoiceId, initialInvoice]);

  // Filtered invoices for search
  const filteredInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return invoices.slice(0, 10);
    const q = invoiceSearch.toLowerCase();
    return invoices
      .filter(
        (inv) =>
          inv.invoiceNumber.toLowerCase().includes(q) ||
          (inv.customer?.name && inv.customer.name.toLowerCase().includes(q)) ||
          (inv.customer?.phone && inv.customer.phone.includes(q))
      )
      .slice(0, 10);
  }, [invoices, invoiceSearch]);

  // When an invoice is selected
  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setCustomerName(inv.customer?.name || '');
    setCustomerPhone(inv.customer?.phone || '');
    // Preload items with quantity 1
    setSelectedItems(
      inv.items.map((it) => ({
        medicine: it.medicine,
        quantity: 1,
        maxQuantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.medicine.costPrice,
        reason: 'customer_mind',
      }))
    );
  };

  // Add manual medicine to return list
  const handleAddManualMedicine = (med: Medicine) => {
    const existing = selectedItems.find((i) => i.medicine.id === med.id);
    if (existing) {
      setSelectedItems((prev) =>
        prev.map((i) =>
          i.medicine.id === med.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          medicine: med,
          quantity: 1,
          maxQuantity: 999,
          unitPrice: med.sellingPrice,
          costPrice: med.costPrice,
          reason: 'customer_mind',
        },
      ]);
    }
    setShowManualMedicineSearch(false);
    setManualMedSearch('');
  };

  const handleUpdateItemQty = (medicineId: string, qty: number) => {
    setSelectedItems((prev) =>
      prev.map((it) => {
        if (it.medicine.id === medicineId) {
          const validQty = Math.max(1, Math.min(qty, it.maxQuantity));
          return { ...it, quantity: validQty };
        }
        return it;
      })
    );
  };

  const handleUpdateItemReason = (medicineId: string, reason: SalesReturnItem['reason']) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.medicine.id === medicineId ? { ...it, reason } : it))
    );
  };

  const handleRemoveItem = (medicineId: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.medicine.id !== medicineId));
  };

  // Calculate total refund
  const totalRefundAmount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }, [selectedItems]);

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedItems.length === 0) {
      alert('يرجى تحديد صنف واحد على الأقل لإرجاعه');
      return;
    }

    const returnItems: SalesReturnItem[] = selectedItems.map((item) => ({
      medicineId: item.medicine.id,
      tradeName: item.medicine.tradeName,
      genericName: item.medicine.genericName,
      barcode: item.medicine.barcode,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      costPrice: item.costPrice,
      total: item.quantity * item.unitPrice,
      reason: item.reason,
      reasonText: item.reasonText,
    }));

    onCompleteReturn({
      invoiceId: activeInvoice?.id,
      invoiceNumber: activeInvoice?.invoiceNumber,
      date: new Date().toISOString(),
      items: returnItems,
      totalAmount: totalRefundAmount,
      refundMethod,
      customerName: customerName || 'عميل نقدي',
      customerPhone,
      pharmacistName: currentPharmacist,
      shiftId: currentShiftId,
      notes: returnNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black">مرتجع منتج مبيعات للعميل (Sales Return)</h2>
              <p className="text-xs text-amber-100">
                إرجاع دواء للعميل، إعادة الكمية للمخزون، واسترداد القيمة من الصندوق أو البطاقة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmitReturn} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Step 1: Search & Link Invoice (Optional or Recommended) */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>ربط بفاتورة بيع سابقة (اختياري / موصى به):</span>
              </label>
              {activeInvoice && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInvoiceId('');
                    setSelectedItems([]);
                  }}
                  className="text-[11px] text-rose-600 hover:underline"
                >
                  إلغاء ربط الفاتورة
                </button>
              )}
            </div>

            {activeInvoice ? (
              <div className="bg-amber-50/80 border border-amber-200 p-2.5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-amber-950 font-mono text-sm block">
                    {activeInvoice.invoiceNumber}
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    التاريخ: {new Date(activeInvoice.date).toLocaleDateString('ar-EG')} • العميل:{' '}
                    {activeInvoice.customer?.name || 'عميل نقدي'} • الإجمالي:{' '}
                    {activeInvoice.grandTotal.toFixed(2)} {CURRENCY}
                  </span>
                </div>
                <span className="bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                  فاتورة مرتبطة
                </span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث برقم الفاتورة (INV-...) أو هاتف أو اسم العميل..."
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border rounded-xl outline-none focus:border-amber-500 text-xs"
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                {filteredInvoices.length > 0 && invoiceSearch && (
                  <div className="border border-slate-200 rounded-xl bg-white max-h-36 overflow-y-auto divide-y divide-slate-100 shadow-sm">
                    {filteredInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        onClick={() => handleSelectInvoice(inv)}
                        className="p-2 hover:bg-amber-50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-mono font-bold text-teal-800 block">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {inv.customer?.name || 'عميل نقدي'} • {inv.items.length} أصناف
                          </span>
                        </div>
                        <span className="font-bold text-slate-800">
                          {inv.grandTotal.toFixed(2)} {CURRENCY}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 2: Items to Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>الأدوية والأصناف المراد إرجاعها:</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-sans font-bold">
                  {selectedItems.length} صنف
                </span>
              </h3>

              <button
                type="button"
                onClick={() => setShowManualMedicineSearch(!showManualMedicineSearch)}
                className="flex items-center gap-1 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دواء من المخزون</span>
              </button>
            </div>

            {/* Manual medicine selector modal/popover */}
            {showManualMedicineSearch && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-teal-200 space-y-2">
                <input
                  type="text"
                  placeholder="ابحث باسم الدواء أو الباركود لإضافته لقائمة المرتجع..."
                  value={manualMedSearch}
                  onChange={(e) => setManualMedSearch(e.target.value)}
                  className="w-full p-2 bg-white border rounded-xl outline-none focus:border-teal-500 text-xs"
                  autoFocus
                />
                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
                  {medicines
                    .filter(
                      (m) =>
                        m.tradeName.toLowerCase().includes(manualMedSearch.toLowerCase()) ||
                        m.genericName.toLowerCase().includes(manualMedSearch.toLowerCase()) ||
                        m.barcode.includes(manualMedSearch)
                    )
                    .slice(0, 8)
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleAddManualMedicine(m)}
                        className="p-2 hover:bg-teal-50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{m.tradeName}</span>
                          <span className="text-[10px] text-slate-500">
                            {m.form} • الرصيد بالمخزون: {m.stock}
                          </span>
                        </div>
                        <span className="font-bold text-teal-700">
                          {m.sellingPrice.toFixed(2)} {CURRENCY}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Selected Items Table */}
            {selectedItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                لم يتم اختيار أي صنف للإرجاع بعد. اختر فاتورة أو أضف دواء يدوياً.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">الدواء</th>
                      <th className="p-2.5 text-center w-24">الكمية المرتجعة</th>
                      <th className="p-2.5">سعر الإرجاع</th>
                      <th className="p-2.5">سبب الإرجاع</th>
                      <th className="p-2.5 text-left">الإجمالي</th>
                      <th className="p-2.5 text-center w-10">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedItems.map((item) => (
                      <tr key={item.medicine.id} className="hover:bg-slate-50">
                        <td className="p-2.5">
                          <span className="font-bold text-slate-800 block">
                            {item.medicine.tradeName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.medicine.barcode}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={item.maxQuantity}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemQty(item.medicine.id, parseInt(e.target.value) || 1)
                              }
                              className="w-14 text-center font-bold p-1 border rounded-lg outline-none focus:border-amber-500"
                            />
                            {item.maxQuantity < 999 && (
                              <span className="text-[10px] text-slate-400">/{item.maxQuantity}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-slate-700 font-mono font-semibold">
                          {item.unitPrice.toFixed(2)}
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.reason}
                            onChange={(e) =>
                              handleUpdateItemReason(
                                item.medicine.id,
                                e.target.value as SalesReturnItem['reason']
                              )
                            }
                            className="p-1 border rounded-lg bg-white outline-none text-[11px] w-full"
                          >
                            <option value="customer_mind">تغيير رغبة العميل</option>
                            <option value="wrong_medicine">صرف دواء غير مطابق للوصفة</option>
                            <option value="doctor_change">تعديل الطبيب للدواء</option>
                            <option value="near_expiry">قرب انتهاء الصلاحية</option>
                            <option value="damaged">تلف أو كسر في العبوة</option>
                            <option value="other">سبب آخر</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-left font-bold text-amber-700 font-mono">
                          {(item.quantity * item.unitPrice).toFixed(2)} {CURRENCY}
                        </td>
                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.medicine.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 3: Refund Method & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">طريقة استرداد المبلغ للعميل:</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setRefundMethod('cash')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer font-bold ${
                    refundMethod === 'cash'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span className="text-[11px]">نقداً من الصندوق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundMethod('card')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer font-bold ${
                    refundMethod === 'card'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span className="text-[11px]">إرجاع بطاقة / بنك</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRefundMethod('credit')}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer font-bold ${
                    refundMethod === 'credit'
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-[11px]">رصيد دائن للعميل</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم العميل:</label>
                <input
                  type="text"
                  placeholder="اسم العميل المستلم للمرتجع"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 bg-white border rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">هاتف العميل (اختياري):</label>
                <input
                  type="text"
                  placeholder="رقم هاتف العميل"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 bg-white border rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">ملاحظات إضافية على المرتجع:</label>
              <textarea
                placeholder="ملاحظات الصيدلي عن حالة العبوة، سبب الاستبدال..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full p-2 bg-white border rounded-xl outline-none h-14"
              ></textarea>
            </div>
          </div>

          {/* Refund Grand Total Indicator */}
          <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 flex items-center justify-between">
            <div>
              <span className="text-amber-900 font-bold block text-sm">
                إجمالي المبلغ المسترد للعميل:
              </span>
              <span className="text-[11px] text-amber-700">
                {refundMethod === 'cash'
                  ? 'سيتم خصم هذا المبلغ فوراً من رصيد الصندوق النقدي للوردية الحالية'
                  : refundMethod === 'card'
                  ? 'تسوية بنكية مستردة للعميل'
                  : 'إضافة المبلغ كرصيد مستحق للعميل'}
              </span>
            </div>
            <div className="text-xl font-black text-amber-950 font-mono">
              {totalRefundAmount.toFixed(2)} {CURRENCY}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-100 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={selectedItems.length === 0}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد المرتجع وإعادة الدواء للمخزون</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
