import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  X,
  Building,
  Pill,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Scale,
  Banknote,
  DollarSign
} from 'lucide-react';
import { Medicine, Supplier, PurchaseReturn, PurchaseReturnItem, CURRENCY } from '../types';

interface PurchaseReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  medicines: Medicine[];
  currentPharmacist: string;
  initialSupplierId?: string;
  onCompletePurchaseReturn: (returnRecord: Omit<PurchaseReturn, 'id' | 'returnNumber'>) => void;
}

export const PurchaseReturnModal: React.FC<PurchaseReturnModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  medicines,
  currentPharmacist,
  initialSupplierId,
  onCompletePurchaseReturn,
}) => {
  if (!isOpen) return null;

  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(
    initialSupplierId || suppliers[0]?.id || ''
  );
  const [settlementMethod, setSettlementMethod] = useState<'deduct_balance' | 'cash_refund' | 'bank_refund'>(
    'deduct_balance'
  );
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Selected items to return
  const [selectedItems, setSelectedItems] = useState<{
    medicine: Medicine;
    quantity: number;
    costPrice: number;
    batchNumber: string;
    reason: PurchaseReturnItem['reason'];
    reasonText?: string;
  }[]>([]);

  // Medicine search
  const [medicineSearch, setMedicineSearch] = useState('');
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);

  // Selected supplier
  const activeSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === selectedSupplierId) || null;
  }, [suppliers, selectedSupplierId]);

  // Add medicine to return
  const handleAddMedicine = (med: Medicine) => {
    if (med.stock <= 0) {
      alert(`رصيد الدواء "${med.tradeName}" بالمخزون هو صفر، لا يمكن إرجاعه!`);
      return;
    }

    const existing = selectedItems.find((i) => i.medicine.id === med.id);
    if (existing) {
      setSelectedItems((prev) =>
        prev.map((i) =>
          i.medicine.id === med.id
            ? { ...i, quantity: Math.min(med.stock, i.quantity + 1) }
            : i
        )
      );
    } else {
      setSelectedItems((prev) => [
        ...prev,
        {
          medicine: med,
          quantity: 1,
          costPrice: med.costPrice,
          batchNumber: med.batchNumber || '',
          reason: 'near_expiry',
        },
      ]);
    }
    setShowMedicineSearch(false);
    setMedicineSearch('');
  };

  const handleUpdateItemQty = (medicineId: string, qty: number, maxStock: number) => {
    setSelectedItems((prev) =>
      prev.map((it) => {
        if (it.medicine.id === medicineId) {
          const validQty = Math.max(1, Math.min(qty, maxStock));
          return { ...it, quantity: validQty };
        }
        return it;
      })
    );
  };

  const handleUpdateItemCost = (medicineId: string, cost: number) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.medicine.id === medicineId ? { ...it, costPrice: Math.max(0, cost) } : it))
    );
  };

  const handleUpdateItemReason = (medicineId: string, reason: PurchaseReturnItem['reason']) => {
    setSelectedItems((prev) =>
      prev.map((it) => (it.medicine.id === medicineId ? { ...it, reason } : it))
    );
  };

  const handleRemoveItem = (medicineId: string) => {
    setSelectedItems((prev) => prev.filter((it) => it.medicine.id !== medicineId));
  };

  // Total return value
  const totalReturnValue = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);
  }, [selectedItems]);

  const handleSubmitReturn = (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeSupplier) {
      alert('يرجى اختيار شركة التوزيع أو المستودع');
      return;
    }

    if (selectedItems.length === 0) {
      alert('يرجى تحديد صنف واحد على الأقل لإرجاعه للمستودع');
      return;
    }

    const returnItems: PurchaseReturnItem[] = selectedItems.map((item) => ({
      medicineId: item.medicine.id,
      tradeName: item.medicine.tradeName,
      genericName: item.medicine.genericName,
      barcode: item.medicine.barcode,
      batchNumber: item.batchNumber,
      quantity: item.quantity,
      costPrice: item.costPrice,
      total: item.quantity * item.costPrice,
      reason: item.reason,
      reasonText: item.reasonText,
    }));

    onCompletePurchaseReturn({
      supplierId: activeSupplier.id,
      supplierName: activeSupplier.name,
      date: new Date().toISOString(),
      items: returnItems,
      totalAmount: totalReturnValue,
      settlementMethod,
      pharmacistName: currentPharmacist,
      notes: returnNotes,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-teal-200" />
            </div>
            <div>
              <h2 className="text-base font-black">مرتجع منتج مشتريات إلى المستودع (Purchase Return)</h2>
              <p className="text-xs text-teal-100">
                إرجاع أدوية لشركة التوزيع أو المستودع وتخفيض الذمة الدائنة المستحقة لهم
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
          {/* Step 1: Select Supplier / Warehouse */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-teal-700" />
              <span>المستودع أو شركة التوزيع المراد الإرجاع إليها:</span>
            </label>

            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:border-teal-600 font-bold text-slate-800"
            >
              {suppliers.map((sup) => (
                <option key={sup.id} value={sup.id}>
                  {sup.name} ({sup.companyType === 'warehouse' ? 'مستودع أدوية' : 'شركة توزيع'}) - الرصيد المستحق لهم: {sup.balanceDue.toFixed(2)} {CURRENCY}
                </option>
              ))}
            </select>

            {activeSupplier && (
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">المندوب: </span>
                  <strong className="text-slate-800">{activeSupplier.contactPerson}</strong> •{' '}
                  <span className="text-slate-500">الهاتف: </span>
                  <strong className="text-slate-800">{activeSupplier.phone}</strong>
                </div>
                <div className="bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg font-bold">
                  الذمة الدائنة الحالية: {activeSupplier.balanceDue.toFixed(2)} {CURRENCY}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Select Medicines to Return */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <span>الأدوية المرتجعة للمستودع:</span>
                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full font-sans font-bold">
                  {selectedItems.length} صنف
                </span>
              </h3>

              <button
                type="button"
                onClick={() => setShowMedicineSearch(!showMedicineSearch)}
                className="flex items-center gap-1 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition border border-teal-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة دواء من المخزون</span>
              </button>
            </div>

            {/* Medicine search dropdown */}
            {showMedicineSearch && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-teal-300 space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث بالاسم التجاري، العلمي، أو الباركود لإرجاع الدواء..."
                    value={medicineSearch}
                    onChange={(e) => setMedicineSearch(e.target.value)}
                    className="w-full pl-3 pr-8 py-2 bg-white border rounded-xl outline-none focus:border-teal-600 text-xs"
                    autoFocus
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
                </div>

                <div className="max-h-36 overflow-y-auto divide-y divide-slate-100 bg-white rounded-xl border border-slate-200">
                  {medicines
                    .filter(
                      (m) =>
                        m.tradeName.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                        m.genericName.toLowerCase().includes(medicineSearch.toLowerCase()) ||
                        m.barcode.includes(medicineSearch)
                    )
                    .slice(0, 8)
                    .map((m) => (
                      <div
                        key={m.id}
                        onClick={() => handleAddMedicine(m)}
                        className="p-2 hover:bg-teal-50 cursor-pointer flex justify-between items-center transition"
                      >
                        <div>
                          <span className="font-bold text-slate-800 block">{m.tradeName}</span>
                          <span className="text-[10px] text-slate-500">
                            الرصيد بالمخزون: <strong>{m.stock} عبوة</strong> • التشغيلة: {m.batchNumber} • انتهاء: {m.expiryDate}
                          </span>
                        </div>
                        <div className="text-left font-mono">
                          <span className="font-bold text-teal-700 block">
                            التكلفة: {m.costPrice.toFixed(2)} {CURRENCY}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Selected Items Table */}
            {selectedItems.length === 0 ? (
              <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                لم يتم اختيار أي دواء للإرجاع بعد. اضغط "إضافة دواء من المخزون" للبدء.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">الدواء</th>
                      <th className="p-2.5 text-center w-24">الكمية المرتجعة</th>
                      <th className="p-2.5 w-24">سعر التكلفة (ر.ي)</th>
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
                          <span className="text-[10px] text-slate-500 font-mono">
                            رصيد المخزون: {item.medicine.stock} • تشغيلة: {item.batchNumber}
                          </span>
                        </td>
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={item.medicine.stock}
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItemQty(
                                  item.medicine.id,
                                  parseInt(e.target.value) || 1,
                                  item.medicine.stock
                                )
                              }
                              className="w-14 text-center font-bold p-1 border rounded-lg outline-none focus:border-teal-600"
                            />
                            <span className="text-[10px] text-slate-400">/{item.medicine.stock}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            step="0.01"
                            value={item.costPrice}
                            onChange={(e) =>
                              handleUpdateItemCost(item.medicine.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 font-bold p-1 border rounded-lg outline-none focus:border-teal-600 text-center font-mono"
                          />
                        </td>
                        <td className="p-2.5">
                          <select
                            value={item.reason}
                            onChange={(e) =>
                              handleUpdateItemReason(
                                item.medicine.id,
                                e.target.value as PurchaseReturnItem['reason']
                              )
                            }
                            className="p-1 border rounded-lg bg-white outline-none text-[11px] w-full"
                          >
                            <option value="near_expiry">قرب انتهاء الصلاحية</option>
                            <option value="damaged_shipment">تلف أو كسر في الشحنة</option>
                            <option value="overstock">ركود وفائض بالمخزون</option>
                            <option value="recalled">سحب تشغيلة من هيئة الدواء</option>
                            <option value="wrong_batch">تشغيلة غير مطابقة</option>
                            <option value="other">سبب آخر</option>
                          </select>
                        </td>
                        <td className="p-2.5 text-left font-bold text-teal-800 font-mono">
                          {(item.quantity * item.costPrice).toFixed(2)} {CURRENCY}
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

          {/* Step 3: Financial Settlement Method */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-3">
            <label className="block font-bold text-slate-700">طريقة التسوية المالية لقيمة المرتجع:</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSettlementMethod('deduct_balance')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                  settlementMethod === 'deduct_balance'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span className="font-bold text-xs">خصم من الذمة الدائنة</span>
                <span className="text-[10px] opacity-80">تخفيض الدين المستحق للمستودع فوراً</span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementMethod('cash_refund')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                  settlementMethod === 'cash_refund'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4" />
                <span className="font-bold text-xs">استرداد نقدي مستلم</span>
                <span className="text-[10px] opacity-80">استلام المبلغ كاش من المندوب</span>
              </button>

              <button
                type="button"
                onClick={() => setSettlementMethod('bank_refund')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition cursor-pointer text-center ${
                  settlementMethod === 'bank_refund'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <DollarSign className="w-4 h-4" />
                <span className="font-bold text-xs">تحويل بنكي مسترد</span>
                <span className="text-[10px] opacity-80">إيداع في حساب الصيدلية</span>
              </button>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ملاحظات ورقم إشعار المستودع:</label>
              <textarea
                placeholder="رقم إشعار المرتجع من المورد، اسم السائق أو المندوب المستلم..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="w-full p-2 bg-white border rounded-xl outline-none h-14"
              ></textarea>
            </div>
          </div>

          {/* Grand Total & Settlement Preview */}
          <div className="bg-teal-50 p-4 rounded-2xl border-2 border-teal-300 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-teal-950 font-bold block text-sm">
                  إجمالي قيمة الأدوية المرتجعة للمستودع:
                </span>
                <span className="text-[11px] text-teal-800">
                  {settlementMethod === 'deduct_balance' && activeSupplier
                    ? `سيتم تخفيض رصيد شركة "${activeSupplier.name}" من ${activeSupplier.balanceDue.toFixed(2)} ${CURRENCY} إلى ${(activeSupplier.balanceDue - totalReturnValue).toFixed(2)} ${CURRENCY}`
                    : 'سيتم استلام المبلغ نقداً أو بحوالة بنكية من المستودع'}
                </span>
              </div>
              <div className="text-xl font-black text-teal-950 font-mono">
                {totalReturnValue.toFixed(2)} {CURRENCY}
              </div>
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
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-md cursor-pointer transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تأكيد مرتجع المشتريات وتخفيض المخزون والذمة الدائنة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
