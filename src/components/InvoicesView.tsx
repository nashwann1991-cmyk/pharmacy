import React, { useState } from 'react';
import {
  FileText,
  Search,
  Printer,
  RotateCcw,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  Banknote,
  ShieldCheck,
  Clock,
  Eye,
  Wallet,
} from 'lucide-react';
import { Invoice } from '../types';

interface InvoicesViewProps {
  invoices: Invoice[];
  onOpenReceipt: (invoice: Invoice) => void;
  onRefundInvoice?: (invoiceId: string) => void;
  onOpenSalesReturn?: (invoice?: Invoice) => void;
}

export const InvoicesView: React.FC<InvoicesViewProps> = ({
  invoices,
  onOpenReceipt,
  onOpenSalesReturn,
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      (inv.customer?.name && inv.customer.name.toLowerCase().includes(search.toLowerCase())) ||
      inv.items.some((i) => i.medicine.tradeName.toLowerCase().includes(search.toLowerCase()));

    const matchesMethod = methodFilter === 'all' || inv.paymentMethod === methodFilter;

    return matchesSearch && matchesMethod;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-4">
      {/* Header and filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-800">سجل فواتير المبيعات</h2>
          <p className="text-xs text-slate-500">استعراض، إعادة طباعة، وتفاصيل فواتير الأدوية المصروفة</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onOpenSalesReturn && (
            <button
              onClick={() => onOpenSalesReturn()}
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2 rounded-xl font-bold transition shadow-sm cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>مرتجع مبيعات جديد</span>
            </button>
          )}

          <div className="relative w-64">
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة أو اسم العميل أو الدواء..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border rounded-xl outline-none focus:border-teal-500 text-xs"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="p-2 border rounded-xl bg-slate-50 outline-none text-xs"
          >
            <option value="all">كل طرق الدفع</option>
            <option value="cash">نقداً</option>
            <option value="card">محفظة إلكترونية (جيب / كاش / محفظتي / وان كاش)</option>
            <option value="insurance">تأمين طبي</option>
            <option value="credit">آجل</option>
          </select>
        </div>
      </div>

      {/* Invoices List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
              <tr>
                <th className="p-3">رقم الفاتورة</th>
                <th className="p-3">التاريخ والوقت</th>
                <th className="p-3">العميل</th>
                <th className="p-3">عدد الأصناف</th>
                <th className="p-3">المبلغ الإجمالي</th>
                <th className="p-3">طريقة السداد</th>
                <th className="p-3">الصيدلي</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    لم يتم العثور على فواتير مطابقة
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-teal-800">{inv.invoiceNumber}</td>
                    <td className="p-3 text-slate-600">{new Date(inv.date).toLocaleString('ar-EG')}</td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-800">{inv.customer?.name || 'عميل نقدي'}</span>
                      {inv.customer?.phone && <span className="text-[10px] text-slate-400 block">{inv.customer.phone}</span>}
                    </td>
                    <td className="p-3 text-slate-600">{inv.items.length} صنف ({inv.items.reduce((s, i) => s + i.quantity, 0)} عبوة)</td>
                    <td className="p-3 font-extrabold text-slate-900">{inv.grandTotal.toFixed(2)} ر.ي</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold inline-flex items-center gap-1 ${
                          inv.paymentMethod === 'cash'
                            ? 'bg-emerald-50 text-emerald-800'
                            : inv.paymentMethod === 'card'
                            ? 'bg-blue-50 text-blue-800'
                            : inv.paymentMethod === 'insurance'
                            ? 'bg-purple-50 text-purple-800'
                            : 'bg-amber-50 text-amber-800'
                        }`}
                      >
                        {inv.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                        {inv.paymentMethod === 'card' && <Wallet className="w-3 h-3" />}
                        {inv.paymentMethod === 'insurance' && <ShieldCheck className="w-3 h-3" />}
                        {inv.paymentMethod === 'credit' && <Clock className="w-3 h-3" />}
                        {inv.paymentMethod === 'cash'
                          ? 'نقداً'
                          : inv.paymentMethod === 'card'
                          ? inv.walletProvider
                            ? `محفظة ${inv.walletProvider}`
                            : 'محفظة إلكترونية'
                          : inv.paymentMethod === 'insurance'
                          ? 'تأمين طبي'
                          : 'آجل'}
                      </span>
                      {inv.paymentMethod === 'insurance' && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          <span className="block text-indigo-700 font-semibold">{inv.customer?.insuranceCompany}</span>
                          {inv.insuranceApprovalNumber && (
                            <span className="block text-slate-400">موافقة: {inv.insuranceApprovalNumber}</span>
                          )}
                          <span className="block text-slate-600">
                            شركة: <strong className="text-indigo-800">{(inv.insuranceCompanyAmount ?? (inv.grandTotal - (inv.customerCopayAmount ?? 0))).toFixed(2)}</strong> | 
                            عميل: <strong className="text-teal-800">{(inv.customerCopayAmount ?? 0).toFixed(2)}</strong>
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">{inv.pharmacistName}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {onOpenSalesReturn && (
                          <button
                            onClick={() => onOpenSalesReturn(inv)}
                            className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="إرجاع صنف من هذه الفاتورة (مرتجع مبيعات)"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-slate-100 rounded-lg cursor-pointer"
                          title="عرض الأصناف"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenReceipt(inv)}
                          className="p-1.5 text-teal-700 hover:text-teal-900 hover:bg-teal-50 rounded-lg cursor-pointer"
                          title="طباعة الفاتورة"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice details modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                تفاصيل الفاتورة: {selectedInvoice.invoiceNumber}
              </h3>
              <button onClick={() => setSelectedInvoice(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {selectedInvoice.items.map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center">
                  <div>
                    <span className="font-bold text-slate-800 block">{it.medicine.tradeName}</span>
                    <span className="text-[10px] text-slate-400">
                      {it.quantity} × {it.unitPrice.toFixed(2)} ر.ي
                      {it.dosageNotes && ` • ${it.dosageNotes}`}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-900">{it.total.toFixed(2)} ر.ي</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t space-y-1 text-slate-600 bg-slate-50 p-3 rounded-xl">
              <div className="flex justify-between">
                <span>الإجمالي قبل الضريبة:</span>
                <span>{selectedInvoice.subtotal.toFixed(2)} ر.ي</span>
              </div>
              <div className="flex justify-between">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span>{selectedInvoice.taxAmount.toFixed(2)} ر.ي</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t text-sm">
                <span>الإجمالي النهائي:</span>
                <span className="text-teal-800">{selectedInvoice.grandTotal.toFixed(2)} ر.ي</span>
              </div>
              {selectedInvoice.paymentMethod === 'insurance' && (
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-2 text-[11px] text-teal-900 space-y-1 mt-2">
                  <div className="flex justify-between font-bold">
                    <span>شركة التأمين:</span>
                    <span>{selectedInvoice.customer?.insuranceCompany || 'تأمين طبي'}</span>
                  </div>
                  {(selectedInvoice.insuranceApprovalNumber || selectedInvoice.customer?.insuranceApprovalNumber) && (
                    <div className="flex justify-between">
                      <span>رقم الموافقة الطبية:</span>
                      <span className="font-mono font-bold text-teal-800">
                        {selectedInvoice.insuranceApprovalNumber || selectedInvoice.customer?.insuranceApprovalNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-700">
                    <span>كم على العميل (التحمل):</span>
                    <span className="font-bold font-mono text-teal-800">
                      {(selectedInvoice.customerCopayAmount ?? 0).toFixed(2)} ر.ي
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-700">
                    <span>كم على شركة التأمين (المطالبة):</span>
                    <span className="font-bold font-mono text-indigo-800">
                      {(selectedInvoice.insuranceCompanyAmount ?? (selectedInvoice.grandTotal - (selectedInvoice.customerCopayAmount ?? 0))).toFixed(2)} ر.ي
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {onOpenSalesReturn && (
                <button
                  onClick={() => {
                    const inv = selectedInvoice;
                    setSelectedInvoice(null);
                    onOpenSalesReturn(inv);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>عمل مرتجع من هذه الفاتورة</span>
                </button>
              )}
              <button
                onClick={() => {
                  onOpenReceipt(selectedInvoice);
                  setSelectedInvoice(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>معاينة الطباعة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
