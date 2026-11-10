import React from 'react';
import { Printer, X, Pill, ArrowDownLeft, ArrowUpRight, RotateCcw } from 'lucide-react';
import { SalesReturn, PurchaseReturn, PharmacySettings } from '../types';

interface ReturnReceiptModalProps {
  salesReturn?: SalesReturn | null;
  purchaseReturn?: PurchaseReturn | null;
  onClose: () => void;
  pharmacySettings?: PharmacySettings;
}

export const ReturnReceiptModal: React.FC<ReturnReceiptModalProps> = ({
  salesReturn,
  purchaseReturn,
  onClose,
  pharmacySettings,
}) => {
  if (!salesReturn && !purchaseReturn) return null;

  const handlePrint = () => {
    window.print();
  };

  const name = pharmacySettings?.name || 'الصيدلية النموذجية';
  const subtitle = pharmacySettings?.subtitle || '';
  const address = pharmacySettings?.address || '';
  const phone = pharmacySettings?.phone || pharmacySettings?.mobile || '';
  const taxNumber = pharmacySettings?.taxNumber || '';
  const currency = pharmacySettings?.currency || 'ر.ي';

  const isSales = Boolean(salesReturn);
  const title = isSales ? 'سند إرجاع مبيعات (Sales Return)' : 'سند مرتجع مشتريات للمستودع (Purchase Return)';
  const returnNumber = isSales ? salesReturn?.returnNumber : purchaseReturn?.returnNumber;
  const dateStr = isSales ? salesReturn?.date : purchaseReturn?.date;
  const pharmacist = isSales ? salesReturn?.pharmacistName : purchaseReturn?.pharmacistName;
  const totalAmount = isSales ? salesReturn?.totalAmount || 0 : purchaseReturn?.totalAmount || 0;

  const salesReasonMap: Record<string, string> = {
    wrong_medicine: 'صرف دواء خاطئ / غير مطابق للوصفة',
    customer_mind: 'تغيير رغبة العميل',
    doctor_change: 'تعديل الجرعة أو الدواء من الطبيب المعالج',
    near_expiry: 'قرب انتهاء الصلاحية',
    damaged: 'تلف أو كسر في العبوة',
    other: 'سبب آخر',
  };

  const purchaseReasonMap: Record<string, string> = {
    near_expiry: 'قرب انتهاء الصلاحية (مرتجع للمستودع)',
    damaged_shipment: 'تلف أو كسر في الشحنة المستلمة',
    overstock: 'ركود وفائض بالمخزون',
    recalled: 'سحب تشغيلة من هيئة الأدوية',
    wrong_batch: 'رقم تشغيلة خاطئ أو غير مطابق للفاتورة',
    other: 'سبب آخر',
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Controls Bar (hidden during print) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs">{title}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Return Voucher */}
        <div
          id="pharmacy-return-receipt-print"
          className="p-6 overflow-y-auto font-mono text-slate-800 text-xs leading-relaxed bg-white print:p-0 print:m-0 print:text-[10px] space-y-4"
        >
          {/* Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
            {pharmacySettings?.logoUrl ? (
              <div className="flex justify-center mb-1.5">
                <img
                  src={pharmacySettings.logoUrl}
                  alt="شعار الصيدلية"
                  className="w-14 h-14 object-contain mx-auto"
                />
              </div>
            ) : null}
            <div className="flex items-center justify-center gap-1.5 mb-1">
              {!pharmacySettings?.logoUrl && <Pill className="w-5 h-5 text-teal-700 inline" />}
              <h2 className="text-base font-black text-slate-900 font-sans">{name}</h2>
            </div>
            {subtitle && <p className="text-[10px] text-slate-500 font-sans">{subtitle}</p>}
            {address && <p className="text-[10px] text-slate-500 font-sans">{address} {phone ? `| هاتف: ${phone}` : ''}</p>}
            {taxNumber && (
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                الرقم الضريبي: {taxNumber}
              </p>
            )}

            <div className="mt-2 inline-block px-3 py-1 rounded-full bg-amber-100 text-amber-900 font-bold text-xs font-sans border border-amber-300">
              {isSales ? 'سند إرجاع مبيعات نقدية / محفظة' : 'سند مرتجع أدوية لمستودع التوزيع'}
            </div>
          </div>

          {/* Return Info */}
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-500 block">رقم السند:</span>
              <span className="font-bold text-slate-900 font-mono">{returnNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block">التاريخ والوقت:</span>
              <span className="font-bold text-slate-900">
                {dateStr ? new Date(dateStr).toLocaleString('ar-EG') : '-'}
              </span>
            </div>

            {isSales ? (
              <>
                <div>
                  <span className="text-slate-500 block">فاتورة البيع الأصلية:</span>
                  <span className="font-bold text-teal-700 font-mono">{salesReturn?.invoiceNumber || 'إرجاع مباشر'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">العميل:</span>
                  <span className="font-bold text-slate-900">{salesReturn?.customerName || 'عميل نقدي'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">طريقة الاسترداد:</span>
                  <span className="font-bold text-slate-900">
                    {salesReturn?.refundMethod === 'cash' ? 'نقداً من الصندوق' : salesReturn?.refundMethod === 'card' ? 'إرجاع عبر محفظة إلكترونية' : 'رصيد دائن للعميل'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="col-span-2">
                  <span className="text-slate-500 block">المستودع / شركة التوزيع المستلمة:</span>
                  <span className="font-bold text-indigo-900 font-sans text-xs">{purchaseReturn?.supplierName}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block">طريقة التسوية المالية:</span>
                  <span className="font-bold text-slate-900">
                    {purchaseReturn?.settlementMethod === 'deduct_balance'
                      ? 'خصم من الرصيد الدائن المستحق للمستودع (تخفيض الذمم الدائنة)'
                      : purchaseReturn?.settlementMethod === 'cash_refund'
                      ? 'استرداد نقدي مستلم'
                      : 'تحويل بنكي مسترد'}
                  </span>
                </div>
              </>
            )}

            <div>
              <span className="text-slate-500 block">الصيدلي المسؤول:</span>
              <span className="font-bold text-slate-800">{pharmacist}</span>
            </div>
          </div>

          {/* Returned Items Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-right text-[11px]">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-2">الصنف الدوائي</th>
                  <th className="p-2 text-center">الكمية</th>
                  <th className="p-2 text-left">السعر</th>
                  <th className="p-2 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isSales
                  ? salesReturn?.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <span className="font-bold text-slate-900 block font-sans">{item.tradeName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            السبب: {salesReasonMap[item.reason] || item.reasonText || item.reason}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2 text-left text-slate-600">{item.unitPrice.toFixed(2)}</td>
                        <td className="p-2 text-left font-bold text-slate-900">{item.total.toFixed(2)} {currency}</td>
                      </tr>
                    ))
                  : purchaseReturn?.items.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <span className="font-bold text-slate-900 block font-sans">{item.tradeName}</span>
                          <span className="text-[10px] text-slate-500 block">
                            تشغيلة: {item.batchNumber || '-'} • السبب: {purchaseReasonMap[item.reason] || item.reasonText || item.reason}
                          </span>
                        </td>
                        <td className="p-2 text-center font-bold text-slate-800">{item.quantity}</td>
                        <td className="p-2 text-left text-slate-600">{item.costPrice.toFixed(2)}</td>
                        <td className="p-2 text-left font-bold text-slate-900">{item.total.toFixed(2)} {currency}</td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Grand Total */}
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between items-center text-sm font-black">
            <span className="text-amber-950 font-sans">
              {isSales ? 'إجمالي المبلغ المسترد للعميل:' : 'إجمالي قيمة المرتجع المخصومة:'}
            </span>
            <span className="text-amber-900 font-mono text-base">
              {totalAmount.toFixed(2)} {currency}
            </span>
          </div>

          {/* Notes if any */}
          {(salesReturn?.notes || purchaseReturn?.notes) && (
            <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border">
              <strong>ملاحظات:</strong> {salesReturn?.notes || purchaseReturn?.notes}
            </div>
          )}

          {/* Signatures */}
          <div className="pt-6 border-t border-dashed border-slate-300 grid grid-cols-2 gap-4 text-center text-[10px]">
            <div>
              <p className="font-bold text-slate-700 mb-6">الصيدلي المنفذ</p>
              <div className="border-t border-slate-400 w-28 mx-auto pt-1 text-slate-500">التوقيع والختم</div>
            </div>
            <div>
              <p className="font-bold text-slate-700 mb-6">
                {isSales ? 'توقيع العميل المستلم' : 'توقيع مندوب المستودع المستلم'}
              </p>
              <div className="border-t border-slate-400 w-28 mx-auto pt-1 text-slate-500">التوقيع والاستلام</div>
            </div>
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
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>طباعة السند</span>
          </button>
        </div>
      </div>
    </div>
  );
};
