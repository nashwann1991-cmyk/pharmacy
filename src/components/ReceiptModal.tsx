import React from 'react';
import { Printer, X, Check, QrCode, Pill } from 'lucide-react';
import { Invoice, PharmacySettings } from '../types';

interface ReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  pharmacySettings?: PharmacySettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ invoice, onClose, pharmacySettings }) => {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const name = pharmacySettings?.name || 'الصيدلية النموذجية';
  const subtitle = pharmacySettings?.subtitle || '';
  const address = pharmacySettings?.address || '';
  const phone = pharmacySettings?.phone || pharmacySettings?.mobile || '';
  const taxNumber = pharmacySettings?.taxNumber || '';
  const licenseNumber = pharmacySettings?.licenseNumber;
  const receiptHeader = pharmacySettings?.receiptHeader || 'فاتورة ضريبية مبسطة';
  const receiptFooter = pharmacySettings?.receiptFooter || 'الأدوية تستبدل خلال 3 أيام مع الفاتورة وبحالتها الأصلية';

  const vatPercentage = invoice.taxAmount > 0
    ? ((invoice.subtotal - invoice.discountTotal) > 0
        ? Math.round((invoice.taxAmount / (invoice.subtotal - invoice.discountTotal)) * 100)
        : (pharmacySettings?.taxRate ?? 0))
    : (pharmacySettings?.taxRate ?? 0);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="p-3 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-xs">معاينة وطباعة الفاتورة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer"
            >
              <span>طباعة</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt (80mm Standard POS format) */}
        <div
          id="pharmacy-receipt-print"
          className="p-5 overflow-y-auto font-mono text-slate-800 text-[11px] leading-relaxed bg-white print:p-0 print:m-0 print:text-[10px]"
        >
          {/* Pharmacy Header */}
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
            <p className="text-[10px] text-slate-500 font-sans">{subtitle}</p>
            <p className="text-[10px] text-slate-500 font-sans">{address} | هاتف: {phone}</p>
            {taxNumber && (
              <p className="text-[10px] font-bold text-slate-700 mt-0.5">
                الرقم الضريبي: {taxNumber}
              </p>
            )}
            {licenseNumber && (
              <p className="text-[9px] text-teal-800 font-bold mt-0.5">
                ترخيص مزاولة المهنة: {licenseNumber}
              </p>
            )}

          </div>

          {/* Invoice Meta */}
          <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[10px]">
            <div className="flex justify-between">
              <span>رقم الفاتورة:</span>
              <span className="font-bold">{invoice.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span>التاريخ والوقت:</span>
              <span>{new Date(invoice.date).toLocaleString('ar-EG')}</span>
            </div>
            <div className="flex justify-between">
              <span>الصيدلي:</span>
              <span>{invoice.pharmacistName}</span>
            </div>
            {invoice.customer?.name && (
              <div className="flex justify-between">
                <span>العميل / المريض:</span>
                <span className="font-bold">{invoice.customer.name}</span>
              </div>
            )}
            {invoice.notes && (
              <div className="flex justify-between text-teal-800 font-bold">
                <span>ملاحظات:</span>
                <span>{invoice.notes}</span>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="py-2.5 border-b-2 border-dashed border-slate-300">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-[10px]">
                  <th className="pb-1">الصنف</th>
                  <th className="pb-1 text-center">الكمية</th>
                  <th className="pb-1 text-left">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1.5 pr-0.5">
                      <span className="font-bold block text-slate-900 font-sans">{item.medicine.tradeName}</span>
                      {item.dosageNotes && (
                        <span className="text-[9px] text-teal-800 font-sans block bg-teal-50/80 px-1 py-0.2 rounded mt-0.5">
                          💊 {item.dosageNotes}
                        </span>
                      )}
                    </td>
                    <td className="py-1.5 text-center font-bold">
                      {item.quantity} × {item.unitPrice.toFixed(2)}
                    </td>
                    <td className="py-1.5 text-left font-bold text-slate-900">
                      {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="py-2.5 border-b-2 border-dashed border-slate-300 space-y-1 text-[11px]">
            <div className="flex justify-between text-slate-600">
              <span>المجموع قبل الضريبة:</span>
              <span>{invoice.subtotal.toFixed(2)} ر.ي</span>
            </div>
            {invoice.discountTotal > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>الخصم:</span>
                <span>- {invoice.discountTotal.toFixed(2)} ر.ي</span>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <span>ضريبة القيمة المضافة ({vatPercentage}%):</span>
              <span>{invoice.taxAmount.toFixed(2)} ر.ي</span>
            </div>
            <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
              <span>الإجمالي النهائي (شامل الضريبة):</span>
              <span>{invoice.grandTotal.toFixed(2)} ر.ي</span>
            </div>
            <div className="flex justify-between text-[10px] text-slate-600 pt-1">
              <span>طريقة الدفع:</span>
              <span className="font-bold">
                {invoice.paymentMethod === 'cash'
                  ? 'نقداً'
                  : invoice.paymentMethod === 'card'
                  ? invoice.walletProvider
                    ? `محفظة إلكترونية (${invoice.walletProvider})`
                    : 'محفظة إلكترونية (جيب / كاش / محفظتي / وان كاش)'
                  : invoice.paymentMethod === 'insurance'
                  ? 'تأمين طبي'
                  : 'آجل'}
              </span>
            </div>
            {invoice.paymentMethod === 'card' && invoice.walletReferenceNumber && (
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>رقم عملية المحفظة:</span>
                <span className="font-mono font-bold">{invoice.walletReferenceNumber}</span>
              </div>
            )}

            {invoice.paymentMethod === 'insurance' && (
              <div className="bg-slate-50 border border-slate-200 rounded p-1.5 space-y-1 text-[10px] mt-1">
                <div className="flex justify-between font-bold text-slate-800 border-b border-slate-200 pb-0.5">
                  <span>شركة التأمين:</span>
                  <span>{invoice.customer?.insuranceCompany || 'تأمين طبي'}</span>
                </div>
                {invoice.customer?.insuranceCardNumber && (
                  <div className="flex justify-between text-slate-600">
                    <span>رقم البطاقة:</span>
                    <span className="font-mono">{invoice.customer.insuranceCardNumber}</span>
                  </div>
                )}
                {(invoice.insuranceApprovalNumber || invoice.customer?.insuranceApprovalNumber) && (
                  <div className="flex justify-between text-slate-600">
                    <span>رقم الموافقة الطبية:</span>
                    <span className="font-mono font-bold text-teal-800">
                      {invoice.insuranceApprovalNumber || invoice.customer?.insuranceApprovalNumber}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>نسبة تحمل العميل:</span>
                  <span className="font-bold">{invoice.customer?.insuranceDeductible ?? 20}%</span>
                </div>
                <div className="flex justify-between font-bold text-teal-800 pt-0.5 border-t border-dashed border-slate-200">
                  <span>المبلغ على العميل (التحمل):</span>
                  <span className="font-mono">
                    {(invoice.customerCopayAmount ?? ((invoice.grandTotal * (invoice.customer?.insuranceDeductible ?? 20)) / 100)).toFixed(2)} ر.ي
                  </span>
                </div>
                <div className="flex justify-between font-bold text-indigo-900">
                  <span>المبلغ على شركة التأمين (المطالبة):</span>
                  <span className="font-mono">
                    {(invoice.insuranceCompanyAmount ?? (invoice.grandTotal - (invoice.customerCopayAmount ?? 0))).toFixed(2)} ر.ي
                  </span>
                </div>
                <div className="flex justify-between text-slate-500 text-[9px]">
                  <span>طريقة سداد التحمل:</span>
                  <span>{invoice.customer?.copayPaymentMethod === 'card' ? `محفظة إلكترونية (${invoice.customer?.walletProvider || 'جيب/كاش/محفظتي/وان كاش'})` : 'نقداً بالصندوق'}</span>
                </div>
              </div>
            )}

            {invoice.paymentMethod === 'cash' && (
              <>
                <div className="flex justify-between text-[10px] text-slate-600">
                  <span>المبلغ المدفوع:</span>
                  <span>{invoice.amountPaid.toFixed(2)} ر.ي</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-800">
                  <span>المتبقي:</span>
                  <span>{invoice.amountChange.toFixed(2)} ر.ي</span>
                </div>
              </>
            )}
          </div>

          {/* QR Code & Footer */}
          <div className="pt-3 text-center space-y-2">
            <div className="flex justify-center">
              {/* Simulated ZATCA compliance QR code */}
              <div className="p-2 border border-slate-300 rounded-lg bg-white inline-block">
                <svg className="w-20 h-20" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer markers */}
                  <rect x="5" y="5" width="25" height="25" fill="#000" />
                  <rect x="9" y="9" width="17" height="17" fill="#fff" />
                  <rect x="13" y="13" width="9" height="9" fill="#000" />

                  <rect x="70" y="5" width="25" height="25" fill="#000" />
                  <rect x="74" y="9" width="17" height="17" fill="#fff" />
                  <rect x="78" y="13" width="9" height="9" fill="#000" />

                  <rect x="5" y="70" width="25" height="25" fill="#000" />
                  <rect x="9" y="74" width="17" height="17" fill="#fff" />
                  <rect x="13" y="78" width="9" height="9" fill="#000" />

                  {/* Random QR bit patterns */}
                  <rect x="36" y="10" width="5" height="5" fill="#000" />
                  <rect x="46" y="15" width="5" height="5" fill="#000" />
                  <rect x="56" y="10" width="5" height="5" fill="#000" />
                  <rect x="36" y="25" width="5" height="5" fill="#000" />
                  <rect x="50" y="25" width="5" height="5" fill="#000" />
                  <rect x="15" y="40" width="5" height="5" fill="#000" />
                  <rect x="25" y="45" width="5" height="5" fill="#000" />
                  <rect x="35" y="40" width="5" height="5" fill="#000" />
                  <rect x="45" y="45" width="5" height="5" fill="#000" />
                  <rect x="55" y="40" width="5" height="5" fill="#000" />
                  <rect x="65" y="45" width="5" height="5" fill="#000" />
                  <rect x="75" y="40" width="5" height="5" fill="#000" />
                  <rect x="85" y="45" width="5" height="5" fill="#000" />
                  <rect x="35" y="55" width="5" height="5" fill="#000" />
                  <rect x="45" y="55" width="5" height="5" fill="#000" />
                  <rect x="65" y="55" width="5" height="5" fill="#000" />
                  <rect x="40" y="70" width="5" height="5" fill="#000" />
                  <rect x="55" y="75" width="5" height="5" fill="#000" />
                  <rect x="70" y="70" width="5" height="5" fill="#000" />
                  <rect x="85" y="75" width="5" height="5" fill="#000" />
                  <rect x="45" y="85" width="5" height="5" fill="#000" />
                  <rect x="60" y="85" width="5" height="5" fill="#000" />
                  <rect x="80" y="85" width="5" height="5" fill="#000" />
                </svg>
              </div>
            </div>
            <p className="text-[9px] text-slate-500 font-sans leading-tight">
              نتمنى لكم دوام الصحة والعافية
              <br />
              {receiptFooter}
            </p>
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
            <span>طباعة الإيصال (Ctrl+P)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
