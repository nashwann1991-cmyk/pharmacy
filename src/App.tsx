import React, { useState, useEffect, useCallback } from 'react';
import {
  Medicine,
  Invoice,
  Expense,
  Shift,
  Supplier,
  SupplierPayment,
  SalesReturn,
  PurchaseReturn,
  StockAdjustment,
  SystemUser,
  MainTabType,
  PharmacySettings,
} from './types';
import {
  INITIAL_MEDICINES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_CURRENT_SHIFT,
  INITIAL_SUPPLIERS,
  INITIAL_SUPPLIER_PAYMENTS,
  INITIAL_SYSTEM_USERS,
  INITIAL_PHARMACY_SETTINGS,
} from './data/initialData';
import { Navbar } from './components/Navbar';
import { POSView } from './components/POSView';
import { InventoryView } from './components/InventoryView';
import { AccountingView } from './components/AccountingView';
import { ExpensesView } from './components/ExpensesView';
import { DailyNetIncomeView } from './components/DailyNetIncomeView';
import { InvoicesView } from './components/InvoicesView';
import { ReportsView } from './components/ReportsView';
import { AdminView } from './components/AdminView';
import { PDFReportModal } from './components/PDFReportModal';
import { ReceiptModal } from './components/ReceiptModal';
import { DrugDosageTool } from './components/DrugDosageTool';
import { LoginView } from './components/LoginView';
import { SalesReturnModal } from './components/SalesReturnModal';
import { PurchaseReturnModal } from './components/PurchaseReturnModal';
import { ReturnReceiptModal } from './components/ReturnReceiptModal';
import { SuppliersReportModal } from './components/SuppliersReportModal';
import { FinancialReportData } from './utils/exportUtils';

export default function App() {
  // Purge legacy demo/test data so the application starts completely clean
  if (typeof window !== 'undefined' && localStorage.getItem('pharma_demo_data_purged_v1') !== 'true') {
    localStorage.removeItem('pharma_medicines');
    localStorage.removeItem('pharma_invoices');
    localStorage.removeItem('pharma_expenses');
    localStorage.removeItem('pharma_current_shift');
    localStorage.removeItem('pharma_suppliers');
    localStorage.removeItem('pharma_supplier_payments');
    localStorage.removeItem('pharma_sales_returns');
    localStorage.removeItem('pharma_purchase_returns');
    localStorage.removeItem('pharma_stock_adjustments');
    localStorage.removeItem('pharma_system_users');
    localStorage.removeItem('pharma_auth_user');
    localStorage.setItem('pharma_demo_data_purged_v1', 'true');
  }

  // Pharmacy Settings State
  const [pharmacySettings, setPharmacySettings] = useState<PharmacySettings>(() => {
    const saved = localStorage.getItem('pharma_settings');
    return saved ? JSON.parse(saved) : INITIAL_PHARMACY_SETTINGS;
  });

  // System User / Login State
  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const saved = localStorage.getItem('pharma_system_users');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS;
  });
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const saved = localStorage.getItem('pharma_auth_user');
    return saved ? JSON.parse(saved) : INITIAL_SYSTEM_USERS[0];
  });
  const [isScreenLocked, setIsScreenLocked] = useState<boolean>(false);

  // Navigation State
  const [currentTab, setCurrentTab] = useState<MainTabType>('pos');

  // Persistence State
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem('pharma_medicines');
    return saved ? JSON.parse(saved) : INITIAL_MEDICINES;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('pharma_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('pharma_expenses');
    return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
  });

  const [currentShift, setCurrentShift] = useState<Shift>(() => {
    const saved = localStorage.getItem('pharma_current_shift');
    return saved ? JSON.parse(saved) : INITIAL_CURRENT_SHIFT;
  });

  // Suppliers & Accounts Payable State
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('pharma_suppliers');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIERS;
  });

  const [supplierPayments, setSupplierPayments] = useState<SupplierPayment[]>(() => {
    const saved = localStorage.getItem('pharma_supplier_payments');
    return saved ? JSON.parse(saved) : INITIAL_SUPPLIER_PAYMENTS;
  });

  // Returns State (Sales Returns & Purchase Returns)
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() => {
    const saved = localStorage.getItem('pharma_sales_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() => {
    const saved = localStorage.getItem('pharma_purchase_returns');
    return saved ? JSON.parse(saved) : [];
  });

  const [stockAdjustments, setStockAdjustments] = useState<StockAdjustment[]>(() => {
    const saved = localStorage.getItem('pharma_stock_adjustments');
    return saved ? JSON.parse(saved) : [];
  });

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Modals State
  const [selectedReceiptInvoice, setSelectedReceiptInvoice] = useState<Invoice | null>(null);
  const [selectedPdfReportData, setSelectedPdfReportData] = useState<FinancialReportData | null>(null);
  const [isDosageModalOpen, setIsDosageModalOpen] = useState<boolean>(false);

  // Return Modals State
  const [isSalesReturnModalOpen, setIsSalesReturnModalOpen] = useState<boolean>(false);
  const [salesReturnInvoiceToPrefill, setSalesReturnInvoiceToPrefill] = useState<Invoice | null>(null);
  const [isPurchaseReturnModalOpen, setIsPurchaseReturnModalOpen] = useState<boolean>(false);
  const [purchaseReturnSupplierToPrefill, setPurchaseReturnSupplierToPrefill] = useState<string | undefined>(undefined);
  const [activeReturnReceipt, setActiveReturnReceipt] = useState<{
    salesReturn?: SalesReturn;
    purchaseReturn?: PurchaseReturn;
  } | null>(null);

  // Suppliers & Warehouses Official Printable Report Modal State
  const [isSuppliersReportModalOpen, setIsSuppliersReportModalOpen] = useState<boolean>(false);
  const [suppliersReportInitialId, setSuppliersReportInitialId] = useState<string | undefined>(undefined);

  const handleOpenSuppliersReport = (supplierId?: string) => {
    setSuppliersReportInitialId(supplierId);
    setIsSuppliersReportModalOpen(true);
  };

  // Auto-dismiss toast
  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    localStorage.setItem('pharma_medicines', JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem('pharma_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('pharma_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('pharma_current_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('pharma_stock_adjustments', JSON.stringify(stockAdjustments));
  }, [stockAdjustments]);

  useEffect(() => {
    localStorage.setItem('pharma_settings', JSON.stringify(pharmacySettings));
  }, [pharmacySettings]);

  useEffect(() => {
    localStorage.setItem('pharma_system_users', JSON.stringify(systemUsers));
  }, [systemUsers]);

  useEffect(() => {
    localStorage.setItem('pharma_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('pharma_supplier_payments', JSON.stringify(supplierPayments));
  }, [supplierPayments]);

  useEffect(() => {
    localStorage.setItem('pharma_sales_returns', JSON.stringify(salesReturns));
  }, [salesReturns]);

  useEffect(() => {
    localStorage.setItem('pharma_purchase_returns', JSON.stringify(purchaseReturns));
  }, [purchaseReturns]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setCurrentTab('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        setCurrentTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setCurrentTab('expenses');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setCurrentTab('daily-income');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setCurrentTab('accounting');
      } else if (e.key === 'F6') {
        e.preventDefault();
        setCurrentTab('invoices');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setCurrentTab('reports');
      } else if (e.key === 'F8') {
        e.preventDefault();
        if (currentUser?.role === 'admin') {
          setCurrentTab('admin');
        } else {
          showToast('عفواً، لوحة الإدارة مخصصة للأدمن فقط', 'error');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentUser]);

  // System Staff Authentication Handlers
  const handleLogin = (user: SystemUser) => {
    setCurrentUser(user);
    setIsScreenLocked(false);
    localStorage.setItem('pharma_auth_user', JSON.stringify(user));
    setCurrentShift((prev) => ({
      ...prev,
      pharmacistName: user.name,
    }));
    showToast(`مرحباً بك د/ ${user.name} (${user.roleNameAr})`, 'success');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsScreenLocked(false);
    localStorage.removeItem('pharma_auth_user');
    showToast('تم تسجيل الخروج من النظام بنجاح', 'info');
  };

  const handleLockScreen = () => {
    setIsScreenLocked(true);
    showToast('تم قفل شاشة الصيدلية لحماية البيانات', 'info');
  };

  // Admin Control Panel Handlers
  const handleUpdatePharmacySettings = (newSettings: PharmacySettings) => {
    setPharmacySettings(newSettings);
  };

  const handleAddSystemUser = (newUser: SystemUser) => {
    setSystemUsers((prev) => [newUser, ...prev]);
  };

  const handleUpdateSystemUser = (updatedUser: SystemUser) => {
    setSystemUsers((prev) =>
      prev.map((u) => (u.id === updatedUser.id ? updatedUser : u))
    );
    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem('pharma_auth_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteSystemUser = (userId: string) => {
    setSystemUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const handleSwitchUser = (user: SystemUser) => {
    setCurrentUser(user);
    setIsScreenLocked(false);
    localStorage.setItem('pharma_auth_user', JSON.stringify(user));
    setCurrentShift((prev) => ({
      ...prev,
      pharmacistName: user.name,
    }));
  };



  // System Restore Backup Handler
  const handleRestoreBackup = (backupData: any) => {
    try {
      if (backupData.settings) {
        setPharmacySettings(backupData.settings);
        localStorage.setItem('pharma_settings', JSON.stringify(backupData.settings));
      }
      if (backupData.users && Array.isArray(backupData.users) && backupData.users.length > 0) {
        const mergedUsers = backupData.users.map((u: SystemUser) => {
          const existing = systemUsers.find((eu) => eu.id === u.id || eu.username === u.username);
          return {
            ...u,
            password: u.password && u.password !== '***' ? u.password : existing?.password || '1234',
          };
        });
        setSystemUsers(mergedUsers);
        localStorage.setItem('pharma_system_users', JSON.stringify(mergedUsers));
      }
      if (backupData.medicines && Array.isArray(backupData.medicines)) {
        setMedicines(backupData.medicines);
        localStorage.setItem('pharma_medicines', JSON.stringify(backupData.medicines));
      }
      if (backupData.invoices && Array.isArray(backupData.invoices)) {
        setInvoices(backupData.invoices);
        localStorage.setItem('pharma_invoices', JSON.stringify(backupData.invoices));
      }
      if (backupData.expenses && Array.isArray(backupData.expenses)) {
        setExpenses(backupData.expenses);
        localStorage.setItem('pharma_expenses', JSON.stringify(backupData.expenses));
      }
      if (backupData.stockAdjustments && Array.isArray(backupData.stockAdjustments)) {
        setStockAdjustments(backupData.stockAdjustments);
        localStorage.setItem('pharma_stock_adjustments', JSON.stringify(backupData.stockAdjustments));
      }
      if (backupData.currentShift) {
        setCurrentShift(backupData.currentShift);
        localStorage.setItem('pharma_current_shift', JSON.stringify(backupData.currentShift));
      }
      if (backupData.suppliers && Array.isArray(backupData.suppliers)) {
        setSuppliers(backupData.suppliers);
        localStorage.setItem('pharma_suppliers', JSON.stringify(backupData.suppliers));
      }
      if (backupData.salesReturns && Array.isArray(backupData.salesReturns)) {
        setSalesReturns(backupData.salesReturns);
        localStorage.setItem('pharma_sales_returns', JSON.stringify(backupData.salesReturns));
      }
      if (backupData.purchaseReturns && Array.isArray(backupData.purchaseReturns)) {
        setPurchaseReturns(backupData.purchaseReturns);
        localStorage.setItem('pharma_purchase_returns', JSON.stringify(backupData.purchaseReturns));
      }
      showToast('تم استرداد النسخة الاحتياطية وتحديث بيانات النظام بنجاح!', 'success');
    } catch (err: any) {
      console.error('Failed to restore backup:', err);
      showToast('حدث خطأ أثناء تطبيق بيانات النسخة الاحتياطية', 'error');
    }
  };

  // Suppliers & Accounts Payable Handlers
  const handleAddSupplier = (newSupplier: Omit<Supplier, 'id'>) => {
    const created: Supplier = {
      ...newSupplier,
      id: 'sup-' + Date.now(),
    };
    setSuppliers((prev) => [...prev, created]);
    showToast(`تمت إضافة المستودع / شركة التوزيع (${created.name}) بنجاح`, 'success');
  };

  const handleUpdateSupplier = (updated: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    showToast(`تم تحديث بيانات (${updated.name})`, 'success');
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    showToast('تم حذف حساب المورد من النظام', 'info');
  };

  const handleRecordSupplierPayment = (paymentData: Omit<SupplierPayment, 'id'>) => {
    const newPayment: SupplierPayment = {
      ...paymentData,
      id: 'PAY-' + Date.now(),
    };
    setSupplierPayments((prev) => [newPayment, ...prev]);

    // Decrease accounts payable
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === paymentData.supplierId) {
          const newBalance = Math.max(0, (s.balanceDue || 0) - paymentData.amount);
          return { ...s, balanceDue: newBalance };
        }
        return s;
      })
    );

    // If paid cash from shift till, record expense and decrease shift cash
    if (paymentData.paymentMethod === 'cash') {
      const expId = 'EXP-' + (expenses.length + 101);
      const newExp: Expense = {
        id: expId,
        date: paymentData.date,
        category: 'supplies',
        title: `سداد دفعة للمستودع: ${paymentData.supplierName}`,
        amount: paymentData.amount,
        paymentMethod: 'cash',
        notes: paymentData.notes || `سند قبض ${paymentData.receiptVoucherNumber || ''}`,
        recordedBy: currentUser?.name || 'الإدارة',
      };
      setExpenses((prev) => [newExp, ...prev]);

      setCurrentShift((prev) => {
        const cashExpenses = prev.cashExpenses + paymentData.amount;
        const expectedClosingCash = prev.openingCash + prev.cashSales - cashExpenses;
        return {
          ...prev,
          cashExpenses,
          expectedClosingCash,
        };
      });
    }

    showToast(`تم تسجيل سداد مبلغ ${paymentData.amount.toFixed(2)} ر.ي للمستودع ${paymentData.supplierName} وتخفيض الذمة الدائنة`, 'success');
  };

  // Sales Return Handler (مرتجع مبيعات للعملاء)
  const handleCreateSalesReturn = (returnData: Omit<SalesReturn, 'id' | 'returnNumber'>) => {
    const returnNumber = `RET-S-${new Date().getFullYear()}-${String(salesReturns.length + 1).padStart(4, '0')}`;
    const newReturn: SalesReturn = {
      ...returnData,
      id: 'ret-s-' + Date.now(),
      returnNumber,
    };

    // 1. Restock returned medicines (+ qty)
    setMedicines((prev) =>
      prev.map((med) => {
        const returnedItem = returnData.items.find((item) => item.medicineId === med.id);
        if (returnedItem) {
          return {
            ...med,
            stock: med.stock + returnedItem.quantity,
          };
        }
        return med;
      })
    );

    // 2. Record stock adjustments
    const adjustments: StockAdjustment[] = returnData.items.map((item) => {
      const med = medicines.find((m) => m.id === item.medicineId);
      const prevStock = med ? med.stock : 0;
      return {
        id: 'adj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        medicineId: item.medicineId,
        medicineName: item.tradeName,
        date: new Date().toISOString(),
        type: 'add',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: prevStock + item.quantity,
        reason: 'return_customer',
        notes: `مرتجع مبيعات ${returnNumber} - ${item.reason}`,
        pharmacistName: currentUser?.name || 'الصيدلي',
      };
    });
    setStockAdjustments((prev) => [...adjustments, ...prev]);

    // 3. Deduct cash from shift till if refunded in cash
    if (returnData.refundMethod === 'cash') {
      setCurrentShift((prev) => {
        const cashSales = Math.max(0, prev.cashSales - returnData.totalAmount);
        const totalSales = Math.max(0, prev.totalSales - returnData.totalAmount);
        const expectedClosingCash = prev.openingCash + cashSales - prev.cashExpenses;
        return {
          ...prev,
          cashSales,
          totalSales,
          expectedClosingCash,
        };
      });
    }

    // 4. Save sales return record
    setSalesReturns((prev) => [newReturn, ...prev]);

    showToast(`تم تسجيل مرتجع المبيعات ${returnNumber} بنجاح وإعادة الأدوية للمخزون`, 'success');
    setActiveReturnReceipt({ salesReturn: newReturn });
  };

  // Purchase Return Handler (مرتجع مشتريات للمستودعات وشركات التوزيع)
  const handleCreatePurchaseReturn = (returnData: Omit<PurchaseReturn, 'id' | 'returnNumber'>) => {
    const returnNumber = `RET-P-${new Date().getFullYear()}-${String(purchaseReturns.length + 1).padStart(4, '0')}`;
    const newReturn: PurchaseReturn = {
      ...returnData,
      id: 'ret-p-' + Date.now(),
      returnNumber,
    };

    // 1. Deduct returned medicines from inventory stock (- qty)
    setMedicines((prev) =>
      prev.map((med) => {
        const returnedItem = returnData.items.find((item) => item.medicineId === med.id);
        if (returnedItem) {
          return {
            ...med,
            stock: Math.max(0, med.stock - returnedItem.quantity),
          };
        }
        return med;
      })
    );

    // 2. Record stock adjustments
    const adjustments: StockAdjustment[] = returnData.items.map((item) => {
      const med = medicines.find((m) => m.id === item.medicineId);
      const prevStock = med ? med.stock : item.quantity;
      return {
        id: 'adj-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        medicineId: item.medicineId,
        medicineName: item.tradeName,
        date: new Date().toISOString(),
        type: 'remove',
        quantity: item.quantity,
        previousStock: prevStock,
        newStock: Math.max(0, prevStock - item.quantity),
        reason: 'return_supplier',
        notes: `مرتجع مشتريات ${returnNumber} لمستودع ${returnData.supplierName} - ${item.reason}`,
        pharmacistName: currentUser?.name || 'الصيدلي',
      };
    });
    setStockAdjustments((prev) => [...adjustments, ...prev]);

    // 3. Deduct from Accounts Payable balance if settled as debt deduction
    if (returnData.settlementMethod === 'deduct_balance') {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === returnData.supplierId) {
            const newBalance = Math.max(0, (s.balanceDue || 0) - returnData.totalAmount);
            return { ...s, balanceDue: newBalance };
          }
          return s;
        })
      );
    }

    // 4. Save purchase return record
    setPurchaseReturns((prev) => [newReturn, ...prev]);

    showToast(`تم تسجيل مرتجع المشتريات ${returnNumber} لمستودع ${returnData.supplierName} بنجاح`, 'success');
    setActiveReturnReceipt({ purchaseReturn: newReturn });
  };

  // POS Complete Sale Handler
  const handleCompleteSale = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber'>): Invoice => {
    const nextInvoiceNumber = `INV-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(4, '0')}`;
    const newInvoice: Invoice = {
      ...invoiceData,
      id: 'inv-' + Date.now(),
      invoiceNumber: nextInvoiceNumber,
    };

    // 1. Decrement inventory stock
    setMedicines((prev) =>
      prev.map((med) => {
        const cartMatch = invoiceData.items.find((item) => item.medicine.id === med.id);
        if (cartMatch) {
          return {
            ...med,
            stock: Math.max(0, med.stock - cartMatch.quantity),
          };
        }
        return med;
      })
    );

    // 2. Append to invoice list
    setInvoices((prev) => [newInvoice, ...prev]);

    // 3. Update current shift registers
    setCurrentShift((prev) => {
      const isCash = invoiceData.paymentMethod === 'cash';
      const isTransferOrWallet = ['jeeb', 'mahfazati', 'onecash', 'exchanger', 'card'].includes(invoiceData.paymentMethod);
      const isCredit = invoiceData.paymentMethod === 'credit';
      const isInsurance = invoiceData.paymentMethod === 'insurance';

      const copayAmount = invoiceData.customerCopayAmount ?? 0;
      const companyAmount = invoiceData.insuranceCompanyAmount ?? (invoiceData.grandTotal - copayAmount);
      const copayMethod = invoiceData.customer?.copayPaymentMethod || 'cash';

      let cashSales = prev.cashSales;
      let cardSales = prev.cardSales;
      let creditSales = prev.creditSales;
      let insuranceSales = prev.insuranceSales;

      if (isCash) {
        cashSales += invoiceData.grandTotal;
      } else if (isTransferOrWallet) {
        cardSales += invoiceData.grandTotal;
      } else if (isCredit) {
        creditSales += invoiceData.grandTotal;
      } else if (isInsurance) {
        insuranceSales += companyAmount;
        if (copayMethod !== 'cash') {
          cardSales += copayAmount;
        } else {
          cashSales += copayAmount;
        }
      }

      const totalSales = prev.totalSales + invoiceData.grandTotal;
      const expectedClosingCash = prev.openingCash + cashSales - prev.cashExpenses;

      return {
        ...prev,
        cashSales,
        cardSales,
        creditSales,
        insuranceSales,
        totalSales,
        expectedClosingCash,
      };
    });

    showToast(`تم إتمام الفاتورة ${nextInvoiceNumber} بنجاح (${newInvoice.grandTotal.toFixed(2)} ر.ي)`, 'success');
    return newInvoice;
  };

  // Inventory Handlers
  const handleAddMedicine = (
    newMed: Omit<Medicine, 'id'>,
    shouldAddToSupplierBalance: boolean = false
  ) => {
    const created: Medicine = {
      ...newMed,
      id: 'med-' + Date.now(),
      supplier: newMed.supplierName || newMed.supplier,
    };
    setMedicines((prev) => [created, ...prev]);

    // If purchased as credit (آجل) and user opted to add to supplier liability
    if (
      shouldAddToSupplierBalance &&
      newMed.purchasePaymentType === 'credit' &&
      newMed.supplierId &&
      newMed.stock > 0 &&
      newMed.costPrice > 0
    ) {
      const purchaseTotal = newMed.stock * newMed.costPrice;
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === newMed.supplierId) {
            return {
              ...s,
              balanceDue: (s.balanceDue || 0) + purchaseTotal,
            };
          }
          return s;
        })
      );
      showToast(
        `تمت إضافة الدواء "${created.tradeName}" وتحديث ذمة المستودع (${newMed.supplierName}) بإضافة ${purchaseTotal.toFixed(2)} ر.ي كحساب آجل`,
        'success'
      );
    } else {
      showToast(`تمت إضافة الدواء "${created.tradeName}" إلى الدليل والمخزون بنجاح`, 'success');
    }
  };

  const handleUpdateMedicine = (updated: Medicine) => {
    setMedicines((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    showToast(`تم تحديث بيانات الدواء "${updated.tradeName}"`, 'success');
  };

  const handleDeleteMedicine = (id: string) => {
    setMedicines((prev) => prev.filter((m) => m.id !== id));
    showToast('تم حذف الدواء من المخزون', 'info');
  };

  const handleStockAdjustment = (adjustment: StockAdjustment) => {
    setStockAdjustments((prev) => [adjustment, ...prev]);
    showToast(`تم تسجيل حركة مخزون (${adjustment.type === 'add' ? 'توريد' : adjustment.type === 'remove' ? 'خصم' : 'جرد'}) لدواء ${adjustment.medicineName}`, 'success');
  };

  // Accounting Handlers
  const handleAddExpense = (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: 'EXP-' + (expenses.length + 101),
    };
    setExpenses((prev) => [newExpense, ...prev]);

    // If paid cash, deduct from shift till
    if (expenseData.paymentMethod === 'cash') {
      setCurrentShift((prev) => {
        const cashExpenses = prev.cashExpenses + expenseData.amount;
        const expectedClosingCash = prev.openingCash + prev.cashSales - cashExpenses;
        return {
          ...prev,
          cashExpenses,
          expectedClosingCash,
        };
      });
    }

    showToast(`تم تسجيل سند صرف بمبلغ ${newExpense.amount.toFixed(2)} ر.ي`, 'success');
  };

  const handleDeleteExpense = (expenseId: string) => {
    const toDelete = expenses.find((e) => e.id === expenseId);
    if (!toDelete) return;

    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));

    if (toDelete.paymentMethod === 'cash') {
      setCurrentShift((prev) => {
        const cashExpenses = Math.max(0, prev.cashExpenses - toDelete.amount);
        const expectedClosingCash = prev.openingCash + prev.cashSales - cashExpenses;
        return {
          ...prev,
          cashExpenses,
          expectedClosingCash,
        };
      });
    }

    showToast(`تم حذف سند المصروف (${toDelete.title}) بنجاح`, 'info');
  };


  const handleCloseShift = (actualCash: number, notes?: string) => {
    const variance = actualCash - currentShift.expectedClosingCash;
    const closedShift: Shift = {
      ...currentShift,
      endTime: new Date().toISOString(),
      actualClosingCash: actualCash,
      cashVariance: variance,
      status: 'closed',
      notes,
    };
    setCurrentShift(closedShift);

    showToast(
      `تم إغلاق الوردية وجرد الصندوق. الفرق: ${variance.toFixed(2)} ر.ي`,
      Math.abs(variance) < 0.01 ? 'success' : 'info'
    );
  };

  const handleOpenNewShift = (pharmacistName: string, openingCash: number) => {
    const newShift: Shift = {
      id: 'shift-' + Date.now(),
      pharmacistName,
      startTime: new Date().toISOString(),
      openingCash,
      cashSales: 0,
      cardSales: 0,
      creditSales: 0,
      insuranceSales: 0,
      totalSales: 0,
      cashExpenses: 0,
      expectedClosingCash: openingCash,
      status: 'open',
    };
    setCurrentShift(newShift);
    showToast(`تم افتتاح وردية جديدة بعهدة ${openingCash.toFixed(2)} ر.ي`, 'success');
  };

  // Near expiry & low stock counts
  const lowStockCount = medicines.filter((m) => m.stock <= m.minStockLevel).length;
  const expiringCount = medicines.filter((m) => {
    const expiry = new Date(m.expiryDate);
    const sixMonths = new Date();
    sixMonths.setMonth(sixMonths.getMonth() + 6);
    return expiry <= sixMonths;
  }).length;

  // Render Login Screen if user is not authenticated or screen is locked
  if (!currentUser || isScreenLocked) {
    return (
      <LoginView
        users={systemUsers}
        onLogin={handleLogin}
        lockedUser={isScreenLocked ? currentUser : null}
        pharmacySettings={pharmacySettings}
        onCancelLock={() => {
          setIsScreenLocked(false);
          setCurrentUser(null);
          localStorage.removeItem('pharma_auth_user');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 flex flex-col font-['Cairo',sans-serif]">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold transition flex items-center gap-2 animate-in fade-in slide-in-from-top-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-rose-100 border-rose-700'
              : toastMessage.type === 'info'
              ? 'bg-slate-900 text-slate-100 border-slate-700'
              : 'bg-emerald-900 text-emerald-100 border-emerald-700'
          }`}
        >
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Navbar (Hidden in print) */}
      <div className="print:hidden">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          currentShift={currentShift}
          onOpenDosageModal={() => setIsDosageModalOpen(true)}
          lowStockCount={lowStockCount}
          expiringCount={expiringCount}
          currentUser={currentUser}
          pharmacySettings={pharmacySettings}
          onLockScreen={handleLockScreen}
          onLogout={handleLogout}
        />
      </div>

      {/* View Render (Hidden when an official report modal is open so exactly one copy prints) */}
      <main
        id="app-main-layout"
        className={`flex-1 pb-6 max-w-7xl mx-auto w-full px-4 pt-4 ${
          Boolean(
            selectedPdfReportData ||
            isSuppliersReportModalOpen ||
            selectedReceiptInvoice ||
            activeReturnReceipt
          )
            ? 'print:hidden'
            : ''
        }`}
      >
        {currentTab === 'pos' && (
          <POSView
            medicines={medicines}
            onCompleteSale={handleCompleteSale}
            currentPharmacist={currentUser?.name || currentShift.pharmacistName}
            currentShiftId={currentShift.id}
            onOpenReceipt={(inv) => setSelectedReceiptInvoice(inv)}
            onOpenSalesReturn={() => {
              setSalesReturnInvoiceToPrefill(null);
              setIsSalesReturnModalOpen(true);
            }}
            pharmacySettings={pharmacySettings}
          />
        )}

        {currentTab === 'inventory' && (
          <InventoryView
            medicines={medicines}
            onAddMedicine={handleAddMedicine}
            onUpdateMedicine={handleUpdateMedicine}
            onDeleteMedicine={handleDeleteMedicine}
            onStockAdjustment={handleStockAdjustment}
            onOpenPurchaseReturn={() => {
              setPurchaseReturnSupplierToPrefill(undefined);
              setIsPurchaseReturnModalOpen(true);
            }}
            suppliers={suppliers}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
            currentShift={currentShift}
            currentUser={currentUser}
            pharmacySettings={pharmacySettings}
          />
        )}

        {currentTab === 'daily-income' && (
          <DailyNetIncomeView
            invoices={invoices}
            expenses={expenses}
            salesReturns={salesReturns}
            currentShift={currentShift}
            pharmacySettings={pharmacySettings}
            onViewInvoice={(inv) => setSelectedReceiptInvoice(inv)}
            onOpenReturnReceipt={(salesRet) => setActiveReturnReceipt({ salesReturn: salesRet })}
          />
        )}

        {currentTab === 'accounting' && (
          <AccountingView
            invoices={invoices}
            expenses={expenses}
            currentShift={currentShift}
            suppliers={suppliers}
            onAddExpense={handleAddExpense}
            onCloseShift={handleCloseShift}
            onOpenNewShift={handleOpenNewShift}
            onOpenSuppliersReport={handleOpenSuppliersReport}
            pharmacySettings={pharmacySettings}
          />
        )}

        {currentTab === 'invoices' && (
          <InvoicesView
            invoices={invoices}
            onOpenReceipt={(inv) => setSelectedReceiptInvoice(inv)}
            onOpenSalesReturn={(inv) => {
              setSalesReturnInvoiceToPrefill(inv || null);
              setIsSalesReturnModalOpen(true);
            }}
          />
        )}

        {currentTab === 'reports' && (
          <ReportsView
            invoices={invoices}
            expenses={expenses}
            medicines={medicines}
            pharmacySettings={pharmacySettings}
            suppliers={suppliers}
            onOpenPdfReportModal={(data) => setSelectedPdfReportData(data)}
            onOpenSuppliersReportModal={handleOpenSuppliersReport}
          />
        )}

        {currentTab === 'admin' && (
          currentUser?.role === 'admin' ? (
            <AdminView
              settings={pharmacySettings}
              onUpdateSettings={handleUpdatePharmacySettings}
              users={systemUsers}
              onAddUser={handleAddSystemUser}
              onUpdateUser={handleUpdateSystemUser}
              onDeleteUser={handleDeleteSystemUser}
              currentUser={currentUser}
              onSwitchUser={handleSwitchUser}
              onShowToast={showToast}
              medicines={medicines}
              invoices={invoices}
              expenses={expenses}
              stockAdjustments={stockAdjustments}
              currentShift={currentShift}
              onRestoreBackup={handleRestoreBackup}
              onReturnToPos={() => setCurrentTab('pos')}
              suppliers={suppliers}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onRecordSupplierPayment={handleRecordSupplierPayment}
              salesReturns={salesReturns}
              purchaseReturns={purchaseReturns}
              onOpenPurchaseReturn={(supplierId) => {
                setPurchaseReturnSupplierToPrefill(supplierId);
                setIsPurchaseReturnModalOpen(true);
              }}
              onOpenSalesReturn={() => {
                setSalesReturnInvoiceToPrefill(null);
                setIsSalesReturnModalOpen(true);
              }}
              onOpenReturnReceipt={(salesRet, purRet) => {
                setActiveReturnReceipt({ salesReturn: salesRet, purchaseReturn: purRet });
              }}
              onOpenSuppliersReport={handleOpenSuppliersReport}
            />
          ) : (
            <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto text-2xl font-bold">
                🔒
              </div>
              <h2 className="text-lg font-black text-slate-800">صلاحية محظورة - لوحة الإدارة</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                عفواً د/ {currentUser?.name || 'المستخدم'}، لوحة إدارة الصيدلية والإعدادات الحساسة مخصصة لمدير النظام (Admin) فقط.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setCurrentTab('pos')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition cursor-pointer"
                >
                  العودة لنقطة البيع (POS)
                </button>
              </div>
            </div>
          )
        )}
      </main>

      {/* Footer shortcut bar (Hidden in print) */}
      <footer className="bg-white border-t border-slate-200 py-2.5 px-4 text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2 max-w-7xl mx-auto w-full print:hidden">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-bold text-slate-700">اختصارات لوحة المفاتيح:</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-slate-700">F1: البيع POS</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-slate-700">F2: المخزون</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-rose-700">F3: المصروفات</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-emerald-700">F4: صافي الدخل اليومي</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-slate-700">F5: المحاسبة والورديات</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-slate-700">F6: الفواتير</span>
          <span className="bg-slate-100 px-2 py-0.5 rounded-lg font-mono font-bold text-slate-700">F7: التقارير</span>
          {currentUser?.role === 'admin' && (
            <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded-lg font-mono font-bold">
              F8: لوحة الإدارة
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400">
          <span>{pharmacySettings.name} • العملة المعتمدة: {pharmacySettings.currencyFullName} ({pharmacySettings.currency})</span>
        </div>
      </footer>

      {/* Receipt Print Preview Modal */}
      <ReceiptModal
        invoice={selectedReceiptInvoice}
        onClose={() => setSelectedReceiptInvoice(null)}
        pharmacySettings={pharmacySettings}
      />

      {/* Official PDF Financial Report Modal */}
      <PDFReportModal
        data={selectedPdfReportData}
        onClose={() => setSelectedPdfReportData(null)}
        pharmacySettings={pharmacySettings}
      />

      {/* Sales Return Modal */}
      {isSalesReturnModalOpen && (
        <SalesReturnModal
          isOpen={isSalesReturnModalOpen}
          invoices={invoices}
          medicines={medicines}
          currentPharmacist={currentUser?.name || currentShift.pharmacistName}
          currentShiftId={currentShift.id}
          initialInvoice={salesReturnInvoiceToPrefill}
          onClose={() => {
            setIsSalesReturnModalOpen(false);
            setSalesReturnInvoiceToPrefill(null);
          }}
          onCompleteReturn={handleCreateSalesReturn}
        />
      )}

      {/* Purchase Return Modal */}
      {isPurchaseReturnModalOpen && (
        <PurchaseReturnModal
          isOpen={isPurchaseReturnModalOpen}
          suppliers={suppliers}
          medicines={medicines}
          currentPharmacist={currentUser?.name || currentShift.pharmacistName}
          initialSupplierId={purchaseReturnSupplierToPrefill}
          onClose={() => {
            setIsPurchaseReturnModalOpen(false);
            setPurchaseReturnSupplierToPrefill(undefined);
          }}
          onCompletePurchaseReturn={handleCreatePurchaseReturn}
        />
      )}

      {/* Unified Return Voucher Print Preview Modal */}
      {activeReturnReceipt && (
        <ReturnReceiptModal
          salesReturn={activeReturnReceipt.salesReturn}
          purchaseReturn={activeReturnReceipt.purchaseReturn}
          pharmacySettings={pharmacySettings}
          onClose={() => setActiveReturnReceipt(null)}
        />
      )}

      {/* Clinical Drug Dosage & Interactions Modal */}
      <DrugDosageTool
        isOpen={isDosageModalOpen}
        onClose={() => setIsDosageModalOpen(false)}
      />

      {/* Official Suppliers & Warehouses Accounts Report Modal */}
      <SuppliersReportModal
        isOpen={isSuppliersReportModalOpen}
        onClose={() => setIsSuppliersReportModalOpen(false)}
        suppliers={suppliers}
        pharmacySettings={pharmacySettings}
        initialSupplierId={suppliersReportInitialId}
        medicines={medicines}
        supplierPayments={supplierPayments}
        purchaseReturns={purchaseReturns}
      />
    </div>
  );
}
