import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Building,
  Building2,
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  KeyRound,
  Phone,
  Mail,
  MapPin,
  Clock,
  Printer,
  ShieldAlert,
  Sliders,
  DollarSign,
  Percent,
  AlertTriangle,
  Stethoscope,
  Briefcase,
  Award,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  RefreshCw,
  Sparkles,
  Check,
  X,
  FileText,
  HelpCircle,
  LogIn,
  Upload,
  Download,
  Database,
  Image as ImageIcon,
  FileUp,
  CheckSquare,
  Square,
  Layers,
  Archive,
} from 'lucide-react';
import {
  PharmacySettings,
  SystemUser,
  UserRole,
  Medicine,
  Invoice,
  Expense,
  StockAdjustment,
  Shift,
  Supplier,
  SupplierPayment,
  SalesReturn,
  PurchaseReturn,
  CURRENCY,
} from '../types';
import { SuppliersManagement } from './SuppliersManagement';

export const PRESET_LOGOS = [
  {
    label: 'صليب صيدلي أخضر',
    emoji: '🟢',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%230d9488"/><path d="M40 20h20v20h20v20H60v20H40V60H20V40h20z" fill="%23ffffff"/><circle cx="50" cy="50" r="6" fill="%230d9488"/></svg>',
  },
  {
    label: 'كأس وهيجيا الصيدلي',
    emoji: '⚕️',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%234f46e5"/><path d="M50 18c-3 0-5 2-5 5v52c0 2 2 4 5 4s5-2 5-4V23c0-3-2-5-5-5z" fill="%23ffffff"/><path d="M30 45c0 10 9 18 20 18s20-8 20-18H30z" fill="%2338bdf8"/><circle cx="50" cy="22" r="5" fill="%23fbbf24"/></svg>',
  },
  {
    label: 'كبسولة دوائية',
    emoji: '💊',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23059669"/><g transform="rotate(45 50 50)"><rect x="25" y="32" width="50" height="18" rx="9" fill="%23ffffff"/><rect x="25" y="50" width="50" height="18" rx="9" fill="%23f43f5e"/><line x1="25" y1="50" x2="75" y2="50" stroke="%23334155" stroke-width="2"/></g></svg>',
  },
  {
    label: 'رعاية صحية وقلب',
    emoji: '❤️',
    dataUrl:
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23e11d48"/><path d="M50 78s-28-18-28-36c0-10 8-18 18-18 6 0 10 3 10 3s4-3 10-3c10 0 18 8 18 18 0 18-28 36-28 36z" fill="%23ffffff"/><path d="M46 36h8v8h8v8h-8v8h-8v-8h-8v-8h8z" fill="%23e11d48"/></svg>',
  },
];

interface AdminViewProps {
  settings: PharmacySettings;
  onUpdateSettings: (newSettings: PharmacySettings) => void;
  users: SystemUser[];
  onAddUser: (user: SystemUser) => void;
  onUpdateUser: (user: SystemUser) => void;
  onDeleteUser: (userId: string) => void;
  currentUser: SystemUser | null;
  onSwitchUser?: (user: SystemUser) => void;
  onShowToast: (text: string, type: 'success' | 'info' | 'error') => void;
  medicines?: Medicine[];
  invoices?: Invoice[];
  expenses?: Expense[];
  stockAdjustments?: StockAdjustment[];
  currentShift?: Shift;
  onRestoreBackup?: (backupData: any) => void;
  onReturnToPos?: () => void;
  suppliers?: Supplier[];
  onAddSupplier?: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier?: (supplier: Supplier) => void;
  onDeleteSupplier?: (id: string) => void;
  onRecordSupplierPayment?: (payment: Omit<SupplierPayment, 'id'>) => void;
  salesReturns?: SalesReturn[];
  purchaseReturns?: PurchaseReturn[];
  onOpenPurchaseReturn?: (supplierId?: string) => void;
  onOpenSalesReturn?: () => void;
  onOpenReturnReceipt?: (salesReturn?: SalesReturn, purchaseReturn?: PurchaseReturn) => void;
  onOpenSuppliersReport?: (supplierId?: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  settings,
  onUpdateSettings,
  users,
  onAddUser,
  onUpdateUser,
  onDeleteUser,
  currentUser,
  onSwitchUser,
  onShowToast,
  medicines = [],
  invoices = [],
  expenses = [],
  stockAdjustments = [],
  currentShift,
  onRestoreBackup,
  onReturnToPos,
  suppliers = [],
  onAddSupplier = () => {},
  onUpdateSupplier = () => {},
  onDeleteSupplier = () => {},
  onRecordSupplierPayment,
  salesReturns = [],
  purchaseReturns = [],
  onOpenPurchaseReturn,
  onOpenSalesReturn,
  onOpenReturnReceipt,
  onOpenSuppliersReport,
}) => {
  // Navigation inside Admin Panel
  const [activeTab, setActiveTab] = useState<'settings' | 'doctors' | 'suppliers' | 'returns' | 'receipt' | 'overview'>('settings');

  // Form State for Pharmacy Settings
  const [formSettings, setFormSettings] = useState<PharmacySettings>(settings);
  const [isSettingsSaved, setIsSettingsSaved] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormSettings(settings);
    }
  }, [settings]);

  // Doctors & Staff Management State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [shiftFilter, setShiftFilter] = useState<'all' | 'morning' | 'evening' | 'night'>('all');
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<SystemUser | null>(null);
  const [revealedPins, setRevealedPins] = useState<{ [id: string]: boolean }>({});

  // Doctor Form State
  const initialDoctorForm = {
    name: '',
    username: '',
    role: 'pharmacist' as UserRole,
    roleNameAr: 'دكتور صيدلي مسؤول',
    pin: '',
    password: '',
    email: '',
    phone: '',
    licenseNumber: '',
    specialty: 'دكتور صيدلي (PharmD)',
    shiftType: 'morning' as 'morning' | 'evening' | 'night' | 'all',
    isActive: true,
    permissions: {
      canSell: true,
      canManageInventory: true,
      canManageExpenses: true,
      canCloseShift: true,
      canAccessAdmin: false,
      canViewReports: true,
    },
    notes: '',
  };

  const [doctorFormData, setDoctorFormData] = useState(initialDoctorForm);

  // Open modal for new doctor
  const handleOpenNewDoctorModal = () => {
    setEditingUser(null);
    setDoctorFormData({
      ...initialDoctorForm,
      pin: Math.floor(1000 + Math.random() * 9000).toString(), // auto generate friendly 4-digit PIN
    });
    setShowDoctorModal(true);
  };

  // Open modal for editing existing doctor
  const handleOpenEditDoctorModal = (user: SystemUser) => {
    setEditingUser(user);
    setDoctorFormData({
      name: user.name,
      username: user.username,
      role: user.role,
      roleNameAr: user.roleNameAr || '',
      pin: user.pin,
      password: user.password || '',
      email: user.email || '',
      phone: user.phone || '',
      licenseNumber: user.licenseNumber || '',
      specialty: user.specialty || '',
      shiftType: user.shiftType || 'all',
      isActive: user.isActive !== false,
      permissions: {
        canSell: user.permissions?.canSell !== false,
        canManageInventory: user.permissions?.canManageInventory ?? (user.role === 'admin' || user.role === 'pharmacist'),
        canManageExpenses: user.permissions?.canManageExpenses ?? (user.role === 'admin' || user.role === 'pharmacist'),
        canCloseShift: user.permissions?.canCloseShift !== false,
        canAccessAdmin: user.permissions?.canAccessAdmin ?? (user.role === 'admin'),
        canViewReports: user.permissions?.canViewReports !== false,
      },
      notes: user.notes || '',
    });
    setShowDoctorModal(true);
  };

  // Save Doctor (New or Edit)
  const handleSaveDoctor = (e: React.FormEvent) => {
    e.preventDefault();

    if (!doctorFormData.name.trim()) {
      onShowToast('يرجى إدخال اسم الدكتور / الصيدلي', 'error');
      return;
    }

    if (!doctorFormData.username.trim()) {
      onShowToast('يرجى إدخال اسم مستخدم صالح', 'error');
      return;
    }

    if (!doctorFormData.pin || doctorFormData.pin.length < 4) {
      onShowToast('رمز PIN السريع يجب أن يتكون من 4 أرقام على الأقل', 'error');
      return;
    }

    // Check username duplication
    const duplicate = users.find(
      (u) =>
        u.username.toLowerCase() === doctorFormData.username.toLowerCase() &&
        u.id !== editingUser?.id
    );
    if (duplicate) {
      onShowToast(`اسم المستخدم "${doctorFormData.username}" محجوز مسبقاً لموظف آخر`, 'error');
      return;
    }

    if (editingUser) {
      // Update
      const updated: SystemUser = {
        ...editingUser,
        ...doctorFormData,
      };
      onUpdateUser(updated);
      onShowToast(`تم تحديث حساب ${updated.name} بنجاح`, 'success');
    } else {
      // Create new
      const newUser: SystemUser = {
        id: `usr-${Date.now()}`,
        ...doctorFormData,
        createdAt: new Date().toISOString().split('T')[0],
      };
      onAddUser(newUser);
      onShowToast(`تم إنشاء حساب الدكتور / الصيدلي (${newUser.name}) بنجاح`, 'success');
    }

    setShowDoctorModal(false);
  };

  // Toggle user active status
  const handleToggleUserStatus = (user: SystemUser) => {
    const updated: SystemUser = {
      ...user,
      isActive: user.isActive === false ? true : false,
    };
    onUpdateUser(updated);
    onShowToast(
      `تم ${updated.isActive ? 'تفعيل' : 'تعطيل'} حساب ${user.name}`,
      updated.isActive ? 'success' : 'info'
    );
  };

  // Save Settings
  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings(formSettings);
    setIsSettingsSaved(true);
    onShowToast('تم حفظ وتحديث إعدادات الصيدلية في النظام بنجاح', 'success');
    setTimeout(() => setIsSettingsSaved(false), 3000);
  };

  // Toggle PIN visibility
  const togglePinReveal = (userId: string) => {
    setRevealedPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  // Filtered Doctors / Staff
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery)) ||
        (u.licenseNumber && u.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (u.specialty && u.specialty.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesShift = shiftFilter === 'all' || u.shiftType === shiftFilter || u.shiftType === 'all';

      return matchesSearch && matchesRole && matchesShift;
    });
  }, [users, searchQuery, roleFilter, shiftFilter]);

  // Statistics
  const doctorStats = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.isActive !== false).length;
    const doctors = users.filter((u) => u.role === 'pharmacist' || u.role === 'admin').length;
    const morningShift = users.filter((u) => u.shiftType === 'morning' || u.shiftType === 'all').length;
    const eveningShift = users.filter((u) => u.shiftType === 'evening' || u.shiftType === 'all').length;
    const nightShift = users.filter((u) => u.shiftType === 'night' || u.shiftType === 'all').length;

    return { total, active, doctors, morningShift, eveningShift, nightShift };
  }, [users]);

  // Backup & Restore State
  const [restoreModalData, setRestoreModalData] = useState<{
    fileName: string;
    data: any;
    exportedAt: string;
    medicinesCount: number;
    invoicesCount: number;
    expensesCount: number;
    usersCount: number;
    pharmacyName: string;
    logoAvailable: boolean;
  } | null>(null);

  const [restoreOptions, setRestoreOptions] = useState({
    medicines: true,
    invoices: true,
    expenses: true,
    settings: true,
    users: true,
    shifts: true,
  });

  const handleBackupFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        const hasSettings = Boolean(parsed.settings);
        const hasUsers = Array.isArray(parsed.users);
        const hasMedicines = Array.isArray(parsed.medicines);
        const hasInvoices = Array.isArray(parsed.invoices);
        const hasExpenses = Array.isArray(parsed.expenses);

        if (!hasSettings && !hasUsers && !hasMedicines && !hasInvoices && !hasExpenses) {
          onShowToast('الملف المختار غير صالح كنسخة احتياطية لنظام الصيدلية', 'error');
          return;
        }

        setRestoreModalData({
          fileName: file.name,
          data: parsed,
          exportedAt: parsed.exportedAt || parsed.date || new Date().toISOString(),
          medicinesCount: parsed.medicines && Array.isArray(parsed.medicines) ? parsed.medicines.length : 0,
          invoicesCount: parsed.invoices && Array.isArray(parsed.invoices) ? parsed.invoices.length : 0,
          expensesCount: parsed.expenses && Array.isArray(parsed.expenses) ? parsed.expenses.length : 0,
          usersCount: parsed.users && Array.isArray(parsed.users) ? parsed.users.length : 0,
          pharmacyName: parsed.settings?.name || 'غير محدد',
          logoAvailable: Boolean(parsed.settings?.logoUrl),
        });
      } catch (err) {
        onShowToast('فشل في قراءة ملف JSON، يرجى التأكد من صحة الملف', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = () => {
    if (!restoreModalData || !onRestoreBackup) return;

    const filtered: any = {};
    const d = restoreModalData.data;

    if (restoreOptions.settings && d.settings) {
      filtered.settings = d.settings;
      setFormSettings(d.settings);
    }
    if (restoreOptions.users && Array.isArray(d.users)) {
      filtered.users = d.users;
    }
    if (restoreOptions.medicines && Array.isArray(d.medicines)) {
      filtered.medicines = d.medicines;
    }
    if (restoreOptions.invoices && Array.isArray(d.invoices)) {
      filtered.invoices = d.invoices;
    }
    if (restoreOptions.expenses && Array.isArray(d.expenses)) {
      filtered.expenses = d.expenses;
    }
    if (restoreOptions.shifts && d.currentShift) {
      filtered.currentShift = d.currentShift;
    }
    if (d.stockAdjustments && Array.isArray(d.stockAdjustments)) {
      filtered.stockAdjustments = d.stockAdjustments;
    }
    if (d.suppliers && Array.isArray(d.suppliers)) {
      filtered.suppliers = d.suppliers;
    }
    if (d.salesReturns && Array.isArray(d.salesReturns)) {
      filtered.salesReturns = d.salesReturns;
    }
    if (d.purchaseReturns && Array.isArray(d.purchaseReturns)) {
      filtered.purchaseReturns = d.purchaseReturns;
    }

    onRestoreBackup(filtered);
    setRestoreModalData(null);
  };

  // RESTRICTION: Admin Only Access Check
  if (currentUser?.role !== 'admin') {
    return (
      <div className="bg-white rounded-3xl p-8 sm:p-12 text-center shadow-lg border border-slate-200 max-w-xl mx-auto my-12 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner border border-rose-100">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-rose-100 text-rose-800 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>منطقة محظورة - وصول مقيد</span>
          </div>
          <h2 className="text-2xl font-black text-slate-800">لوحة الإدارة مخصصة للأدمن فقط</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            لا يمكن الدخول إلى لوحة تحكم وإعدادات الصيدلية إلا للمشرف الإداري (Admin). حسابك الحالي (
            <span className="font-bold text-slate-700">{currentUser?.name || 'غير معروف'}</span> - {currentUser?.roleNameAr || 'مستخدم عادي'}) لا يملك صلاحية الإدارة.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-3">
          {onReturnToPos && (
            <button
              onClick={onReturnToPos}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              العودة إلى شاشة البيع (POS)
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>لوحة الإدارة والتحكم المركزي</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>إدارة الصيدلية وحسابات الدكاترة</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-sans font-bold">
                {settings.name}
              </span>
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              تكوين الهوية الرسمية للصيدلية، أرقام السجلات والتراخيص، وحدود تنبيهات النواقص والصلاحية، مع إنشاء وإدارة حسابات الدكاترة والصيادلة وصلاحياتهم.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-indigo-300">{doctorStats.total}</div>
              <div className="text-[11px] text-slate-300 font-medium">إجمالي الكادر</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-2xl font-black text-emerald-400">{doctorStats.active}</div>
              <div className="text-[11px] text-slate-300 font-medium">حسابات نشطة</div>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-3 text-center col-span-2 sm:col-span-1">
              <div className="text-2xl font-black text-teal-300">{doctorStats.doctors}</div>
              <div className="text-[11px] text-slate-300 font-medium">أطباء وصيادلة</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation inside Admin Panel */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/10 overflow-x-auto pb-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-4 h-4 text-indigo-300" />
            <span>إعدادات وبيانات الصيدلية</span>
          </button>

          <button
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'doctors'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-teal-300" />
            <span>حسابات الدكاترة والكادر ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-300" />
            <span>مستودعات وشركات التوزيع (الذمم الدائنة) ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'returns'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-rose-300" />
            <span>سجل المرتجعات ({salesReturns.length + purchaseReturns.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('receipt')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'receipt'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Printer className="w-4 h-4 text-amber-300" />
            <span>معاينة وترويسة الفاتورة</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-300" />
            <span>أمان النظام والنسخ الاحتياطي</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: PHARMACY SETTINGS (إعدادات الصيدلية)                    */}
      {/* ============================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Main Settings Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Basic Identity */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">الهوية التجارية والاسم</h2>
                    <p className="text-xs text-slate-500">اسم الصيدلية وشعارها كما يظهر في النظام والشاشات والفواتير</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الصيدلية الرسمي <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formSettings.name}
                      onChange={(e) => setFormSettings({ ...formSettings, name: e.target.value })}
                      required
                      placeholder="أدخل اسم الصيدلية الرسمي"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-semibold outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الوصف والشعار المختصر
                    </label>
                    <input
                      type="text"
                      value={formSettings.subtitle}
                      onChange={(e) => setFormSettings({ ...formSettings, subtitle: e.target.value })}
                      placeholder="مثال: أدوية ومستلزمات طبية - خدمة 24 ساعة"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم الفرع / المركز
                    </label>
                    <input
                      type="text"
                      value={formSettings.branchName}
                      onChange={(e) => setFormSettings({ ...formSettings, branchName: e.target.value })}
                      placeholder="مثال: الفرع الرئيسي - شارع الزبيري"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>

                  {/* Logo Image Picker & Preview */}
                  <div className="sm:col-span-2 bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        <span>صورة شعار الصيدلية (Logo)</span>
                      </label>
                      {formSettings.logoUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setFormSettings({ ...formSettings, logoUrl: '' });
                            onShowToast('تمت إزالة الشعار، احفظ الإعدادات للتأكيد', 'info');
                          }}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>إزالة الشعار</span>
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      {/* Logo Visual Preview */}
                      <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-indigo-200 flex items-center justify-center p-2 shrink-0 shadow-sm overflow-hidden">
                        {formSettings.logoUrl ? (
                          <img
                            src={formSettings.logoUrl}
                            alt="شعار الصيدلية"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-400 space-y-1">
                            <Building2 className="w-7 h-7 mx-auto text-slate-300" />
                            <span className="text-[10px] block font-bold text-slate-400">لا يوجد شعار</span>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="space-y-2.5 flex-1 w-full text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <label className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-3.5 rounded-xl cursor-pointer transition shadow-sm flex items-center gap-1.5 text-xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>رفع صورة الشعار من الجهاز</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp,image/svg+xml"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 2 * 1024 * 1024) {
                                    onShowToast('حجم الصورة كبير جداً، الحد الأقصى 2 ميغابايت', 'error');
                                    return;
                                  }
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    const base64 = reader.result as string;
                                    setFormSettings((prev) => ({ ...prev, logoUrl: base64 }));
                                    onShowToast('تم تحميل صورة الشعار بنجاح! اضغط حفظ الإعدادات لتثبيتها', 'success');
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                          <span className="text-[10px] text-slate-500">يدعم PNG, JPG, WebP, SVG (حتى 2MB)</span>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={formSettings.logoUrl || ''}
                            onChange={(e) => setFormSettings({ ...formSettings, logoUrl: e.target.value })}
                            placeholder="أو ألصق رابط صورة الشعار مباشرة (URL)"
                            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono outline-none focus:border-indigo-500 bg-white"
                          />
                        </div>

                        {/* Preset logos */}
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[10px] text-slate-500 font-bold">شعارات طبية جاهزة:</span>
                          {PRESET_LOGOS.map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormSettings({ ...formSettings, logoUrl: preset.dataUrl });
                                onShowToast(`تم تعيين "${preset.label}" كشعار للصيدلية`, 'info');
                              }}
                              className="text-[10px] bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 text-slate-700 px-2 py-0.5 rounded-lg font-medium cursor-pointer transition flex items-center gap-1"
                            >
                              <span>{preset.emoji}</span>
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Legal & Licenses */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">التراخيص والبيانات الرسمية</h2>
                    <p className="text-xs text-slate-500">أرقام السجلات النظامية وترخيص وزارة الصحة والمزاولة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم السجل التجاري
                    </label>
                    <input
                      type="text"
                      value={formSettings.commercialRegister}
                      onChange={(e) => setFormSettings({ ...formSettings, commercialRegister: e.target.value })}
                      placeholder="مثال: CR-7489201"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-mono outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم ترخيص وزارة الصحة
                    </label>
                    <input
                      type="text"
                      value={formSettings.licenseNumber}
                      onChange={(e) => setFormSettings({ ...formSettings, licenseNumber: e.target.value })}
                      placeholder="مثال: MOH-YE-2024-889"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-mono outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      الرقم الضريبي (إن وجد)
                    </label>
                    <input
                      type="text"
                      value={formSettings.taxNumber}
                      onChange={(e) => setFormSettings({ ...formSettings, taxNumber: e.target.value })}
                      placeholder="مثال: 300123456700003"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-mono outline-none transition"
                    />
                  </div>

                  {/* Dedicated VAT / Value Added Tax Configuration Section */}
                  <div className="sm:col-span-3 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 border-2 border-indigo-200/90 rounded-2xl p-4.5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-xs">
                          <Percent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                            <span>تحديد نسبة ضريبة القيمة المضافة (VAT %)</span>
                            <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                              خاص بالمدير (Admin Only)
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            يحدد مدير النظام هنا نسبة الضريبة ليتم تطبيقها تلقائياً على فواتير المبيعات ونقاط البيع POS والإيصالات
                          </p>
                        </div>
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500 font-bold">خيارات سريعة:</span>
                        {[
                          { label: '0% (معفاة)', val: 0 },
                          { label: '5%', val: 5 },
                          { label: '10%', val: 10 },
                          { label: '15%', val: 15 },
                        ].map((preset) => (
                          <button
                            key={preset.val}
                            type="button"
                            onClick={() => {
                              setFormSettings({ ...formSettings, taxRate: preset.val });
                              onShowToast(`تم اختيار نسبة الضريبة (${preset.val}%) - اضغط حفظ لتطبيقها`, 'info');
                            }}
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                              Number(formSettings.taxRate) === preset.val
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/60'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-slate-800 mb-1">
                          النسبة المئوية المعتمدة للضريبة (%):
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={formSettings.taxRate !== undefined ? formSettings.taxRate : 0}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value);
                              setFormSettings({
                                ...formSettings,
                                taxRate: isNaN(val) ? 0 : Math.max(0, Math.min(100, val)),
                              });
                            }}
                            placeholder="0"
                            className="w-full px-3.5 py-2.5 rounded-xl border-2 border-indigo-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-black font-mono outline-none transition bg-white"
                          />
                          <span className="absolute left-3 top-2.5 text-xs text-indigo-700 font-black">%</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1">
                          يمكنك إدخال أي رقم (مثال: 0 للإعفاء، أو 5 أو 15 أو أي نسبة رسمية مطلوبة)
                        </p>
                      </div>

                      <div className="flex items-center bg-white/90 p-3.5 rounded-xl border border-indigo-100 text-xs">
                        <div>
                          <span className="text-slate-500 font-semibold block text-[11px]">حالة التطبيق في فواتير الصيدلية:</span>
                          <strong className="text-slate-900 font-bold block text-xs mt-0.5">
                            {Number(formSettings.taxRate) > 0 ? (
                              <span className="text-indigo-700">
                                يتم احتساب ضريبة بنسبة <strong>{formSettings.taxRate}%</strong> على كل عملية بيع في الكاشير
                              </span>
                            ) : (
                              <span className="text-emerald-700">
                                معفاة من الضريبة (0%) - لا يتم إضافة أي ضريبة على المبيعات
                              </span>
                            )}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Contact & Address */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">بيانات الاتصال والموقع</h2>
                    <p className="text-xs text-slate-500">أرقام الهواتف، خدمة العملاء والعنوان المطبوع بالفاتورة</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      هاتف الصيدلية الأرضي
                    </label>
                    <input
                      type="text"
                      value={formSettings.phone}
                      onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                      placeholder="مثال: 01-234567"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رقم الجوال والواتساب
                    </label>
                    <input
                      type="text"
                      value={formSettings.mobile}
                      onChange={(e) => setFormSettings({ ...formSettings, mobile: e.target.value })}
                      placeholder="مثال: 777123456"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      البريد الإلكتروني
                    </label>
                    <input
                      type="email"
                      value={formSettings.email}
                      onChange={(e) => setFormSettings({ ...formSettings, email: e.target.value })}
                      placeholder="info@alnoor-pharma.ye"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      العنوان بالتفصيل
                    </label>
                    <input
                      type="text"
                      value={formSettings.address}
                      onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                      placeholder="مثال: شارع الزبيري - تقاطع حدة - صنعاء، الجمهورية اليمنية"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Inventory Alerts & Thresholds */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">حدود تنبيهات النواقص والصلاحية</h2>
                    <p className="text-xs text-slate-500">معايير التحذير التلقائي في شريط الإشعارات وقسم المخزون</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      حد تنبيه النواقص (أقل كمية للعبوات)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="200"
                        value={formSettings.lowStockThreshold}
                        onChange={(e) =>
                          setFormSettings({ ...formSettings, lowStockThreshold: parseInt(e.target.value) || 10 })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-bold outline-none transition"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">عبوة</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">يظهر تنبيه باللون البرتقالي عندما يقل المخزون عن هذا الرقم</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      مهلة التحذير قبل انتهاء الصلاحية
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="15"
                        max="365"
                        value={formSettings.expiryWarningDays}
                        onChange={(e) =>
                          setFormSettings({ ...formSettings, expiryWarningDays: parseInt(e.target.value) || 60 })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm font-bold outline-none transition"
                      />
                      <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">يوم</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">تنبيه تلقائي للأدوية التي يقترب تاريخ انتهائها خلال هذه الأيام</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Quick Preview & Actions */}
            <div className="space-y-6">
              {/* Save Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4 sticky top-24">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <Save className="w-4 h-4 text-indigo-600" />
                  <span>تأكيد وحفظ الإعدادات</span>
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  يتم حفظ التعديلات فوراً وتطبيقها على جميع شاشات النظام، فواتير المبيعات POS، وتقارير PDF المحاسبية.
                </p>

                <div className="space-y-2 pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                  >
                    {isSettingsSaved ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                    <span>{isSettingsSaved ? 'تم الحفظ بنجاح!' : 'حفظ إعدادات الصيدلية'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormSettings(settings);
                      onShowToast('تم التراجع عن التعديلات غير المحفوظة', 'info');
                    }}
                    className="w-full flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>إلغاء التغييرات</span>
                  </button>
                </div>

                {/* Information Card */}
                <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-[11px] text-indigo-900 space-y-1.5">
                  <div className="font-bold flex items-center gap-1.5 text-indigo-950">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>ملاحظة أمان:</span>
                  </div>
                  <p>تعديل إعدادات الصيدلية متاح حصرياً لحسابات المدراء (Admin). يتم تخزين هذه الإعدادات بشكل آمن ومحلي في متصفحك.</p>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ============================================================== */}
      {/* TAB 2: DOCTOR & STAFF ACCOUNTS (حسابات الدكاترة والكادر)     */}
      {/* ============================================================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 flex-wrap">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="بحث باسم الدكتور، التخصص، رقم الترخيص أو الهاتف..."
                  className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-xs font-medium outline-none transition"
                />
              </div>

              {/* Role Filter */}
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">جميع الأدوار</option>
                <option value="pharmacist">أطباء وصيادلة</option>
                <option value="admin">مدراء النظام (Admin)</option>
                <option value="cashier">كاشير ومبيعات</option>
                <option value="accountant">محاسبين</option>
              </select>

              {/* Shift Filter */}
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="all">جميع الورديات</option>
                <option value="morning">وردية صباحية</option>
                <option value="evening">وردية مسائية</option>
                <option value="night">وردية ليلية</option>
              </select>
            </div>

            {/* Add Doctor Button */}
            <button
              onClick={handleOpenNewDoctorModal}
              className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-teal-600/30 transition cursor-pointer text-xs whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة حساب دكتور / صيدلي جديد</span>
            </button>
          </div>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((user) => {
              const isCurrentUser = currentUser?.id === user.id;
              const isDoctorRole = user.role === 'pharmacist' || user.role === 'admin';
              const isRevealed = !!revealedPins[user.id];

              return (
                <div
                  key={user.id}
                  className={`bg-white rounded-3xl p-5 shadow-sm border transition relative flex flex-col justify-between ${
                    user.isActive === false
                      ? 'border-slate-200 opacity-60 bg-slate-50/70'
                      : isCurrentUser
                      ? 'border-teal-500 ring-2 ring-teal-100'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  <div>
                    {/* Top Row: Role Badge & Status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : user.role === 'pharmacist'
                              ? 'bg-teal-100 text-teal-800 border border-teal-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {user.role === 'admin'
                            ? 'مدير الصيدلية'
                            : user.role === 'pharmacist'
                            ? 'دكتور صيدلي'
                            : user.role === 'cashier'
                            ? 'كاشير مبيعات'
                            : 'محاسب'}
                        </span>

                        {isCurrentUser && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                            أنت الآن
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleToggleUserStatus(user)}
                        title={user.isActive === false ? 'تفعيل الحساب' : 'تعطيل الحساب مؤقتاً'}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 transition cursor-pointer ${
                          user.isActive === false
                            ? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        }`}
                      >
                        {user.isActive === false ? (
                          <>
                            <XCircle className="w-3 h-3" />
                            <span>معطل</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>نشط</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Doctor Info */}
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-md flex-shrink-0 ${
                          user.role === 'admin'
                            ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
                            : user.role === 'pharmacist'
                            ? 'bg-gradient-to-br from-teal-500 to-emerald-600'
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}
                      >
                        {isDoctorRole ? (
                          <Stethoscope className="w-6 h-6" />
                        ) : (
                          <Briefcase className="w-6 h-6" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{user.name}</h3>
                        <p className="text-[11px] text-slate-500 truncate">
                          {user.roleNameAr || user.specialty || `@${user.username}`}
                        </p>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>اسم المستخدم:</span>
                          <span className="font-mono font-bold text-slate-600">@{user.username}</span>
                        </div>
                      </div>
                    </div>

                    {/* Metadata chips */}
                    <div className="space-y-1.5 py-2.5 border-y border-slate-100 text-[11px] text-slate-600">
                      {user.licenseNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Award className="w-3 h-3 text-teal-600" />
                            <span>رقم الترخيص:</span>
                          </span>
                          <span className="font-mono font-bold text-slate-700 text-[10px] bg-slate-50 px-1.5 py-0.5 rounded">
                            {user.licenseNumber}
                          </span>
                        </div>
                      )}

                      {user.specialty && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">المؤهل / التخصص:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[150px] text-left">
                            {user.specialty}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" />
                          <span>وردية العمل:</span>
                        </span>
                        <span className="font-bold text-slate-800">
                          {user.shiftType === 'morning'
                            ? 'صباحية (8:00 ص - 4:00 م)'
                            : user.shiftType === 'evening'
                            ? 'مسائية (4:00 م - 12:00 م)'
                            : user.shiftType === 'night'
                            ? 'ليلية (12:00 م - 8:00 ص)'
                            : 'كل الورديات'}
                        </span>
                      </div>

                      {user.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>الهاتف:</span>
                          </span>
                          <span className="font-mono text-slate-700">{user.phone}</span>
                        </div>
                      )}

                      {/* Quick PIN */}
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1.5 rounded-xl">
                        <span className="text-slate-500 font-semibold flex items-center gap-1 text-[10px]">
                          <KeyRound className="w-3 h-3 text-amber-500" />
                          <span>رمز PIN السريع:</span>
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="font-mono font-bold text-slate-900 text-xs tracking-wider">
                            {isRevealed ? user.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => togglePinReveal(user.id)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between gap-1.5 pt-3 mt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditDoctorModal(user)}
                        className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>تعديل</span>
                      </button>

                      {onSwitchUser && !isCurrentUser && user.isActive !== false && (
                        <button
                          onClick={() => {
                            onSwitchUser(user);
                            onShowToast(`تم التبديل إلى حساب (${user.name}) بنجاح`, 'info');
                          }}
                          title="تسجيل الدخول الفوري بحساب هذا الدكتور للتجربة"
                          className="flex items-center gap-1 text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                        >
                          <LogIn className="w-3 h-3" />
                          <span>دخول كـ</span>
                        </button>
                      )}
                    </div>

                    {!isCurrentUser && (
                      <button
                        onClick={() => setDeleteConfirmUser(user)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="حذف الحساب"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-slate-700 mb-1">لا توجد نتائج مطابقة للبحث</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                جرب تغيير كلمة البحث أو فلاتر الأدوار والورديات، أو قم بإضافة حساب دكتور جديد.
              </p>
              <button
                onClick={handleOpenNewDoctorModal}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة حساب دكتور الآن</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: SUPPLIERS & WAREHOUSES (المستودعات والذمم الدائنة)       */}
      {/* ============================================================== */}
      {activeTab === 'suppliers' && (
        <SuppliersManagement
          suppliers={suppliers}
          onAddSupplier={onAddSupplier}
          onUpdateSupplier={onUpdateSupplier}
          onDeleteSupplier={onDeleteSupplier}
          onRecordSupplierPayment={onRecordSupplierPayment}
          onOpenPurchaseReturn={onOpenPurchaseReturn}
          pharmacySettings={settings}
          onShowToast={onShowToast}
          onOpenSuppliersReport={onOpenSuppliersReport}
        />
      )}

      {/* ============================================================== */}
      {/* TAB 4: RETURNS LOG (سجل مرتجعات المبيعات والمشتريات)           */}
      {/* ============================================================== */}
      {activeTab === 'returns' && (
        <div className="space-y-4 text-xs">
          {/* Header & KPI Summary */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-800 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-600/20">
                  <RotateCcw className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <span>سجل مرتجعات المبيعات والمشتريات</span>
                    <span className="text-xs bg-rose-50 text-rose-700 border border-rose-200 font-bold px-2.5 py-0.5 rounded-full">
                      تدقيق حركات الإرجاع
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    متابعة الأدوية المسترجعة من العملاء (مرتجع مبيعات) والأدوية المرتجعة للمستودعات وشركات التوزيع (مرتجع مشتريات)
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2">
                {onOpenSalesReturn && (
                  <button
                    onClick={onOpenSalesReturn}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold transition shadow-md cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>مرتجع مبيعات لعميل</span>
                  </button>
                )}

                {onOpenPurchaseReturn && (
                  <button
                    onClick={() => onOpenPurchaseReturn()}
                    className="flex items-center gap-1.5 bg-teal-700 hover:bg-teal-800 text-white px-4 py-2 rounded-xl font-bold transition shadow-md cursor-pointer"
                  >
                    <Building className="w-4 h-4" />
                    <span>مرتجع مشتريات لمستودع</span>
                  </button>
                )}
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <div className="flex items-center justify-between text-amber-900 font-bold mb-1">
                  <span>إجمالي مرتجعات المبيعات</span>
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                </div>
                <div className="text-xl font-black text-amber-950 font-mono">
                  {salesReturns.reduce((sum, r) => sum + r.totalAmount, 0).toFixed(2)} {CURRENCY}
                </div>
                <span className="text-[10px] text-amber-700 block mt-1">
                  {salesReturns.length} حركة إرجاع لعملاء
                </span>
              </div>

              <div className="bg-teal-50 p-4 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between text-teal-900 font-bold mb-1">
                  <span>إجمالي مرتجعات المشتريات</span>
                  <Building className="w-4 h-4 text-teal-700" />
                </div>
                <div className="text-xl font-black text-teal-950 font-mono">
                  {purchaseReturns.reduce((sum, r) => sum + r.totalAmount, 0).toFixed(2)} {CURRENCY}
                </div>
                <span className="text-[10px] text-teal-700 block mt-1">
                  {purchaseReturns.length} حركة مرتجع لمستودعات
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block mb-1">صافي أثر المرتجعات المالية:</span>
                <span className="text-lg font-black text-slate-800 font-mono">
                  {(
                    purchaseReturns.reduce((sum, r) => sum + r.totalAmount, 0) -
                    salesReturns.reduce((sum, r) => sum + r.totalAmount, 0)
                  ).toFixed(2)} {CURRENCY}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  فارق الاستردادات والخصم
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-slate-500 block mb-1">إجمالي الحركات:</span>
                <span className="text-lg font-black text-indigo-700 font-mono">
                  {salesReturns.length + purchaseReturns.length} عملية إرجاع
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">
                  مسجلة وموثقة بالنظام
                </span>
              </div>
            </div>
          </div>

          {/* Table: Sales Returns */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">أولاً: سجل مرتجعات المبيعات (العملاء)</h3>
                  <p className="text-[11px] text-slate-400">استرداد نقدي، إرجاع محفظة إلكترونية، أو رصيد للعميل</p>
                </div>
              </div>
              <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {salesReturns.length} سند إرجاع
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">الفاتورة الأصلية</th>
                    <th className="p-3">العميل</th>
                    <th className="p-3">الأصناف المرتجعة</th>
                    <th className="p-3">طريقة الاسترداد</th>
                    <th className="p-3 text-left">المبلغ المسترد</th>
                    <th className="p-3">الصيدلي</th>
                    <th className="p-3 text-center">طباعة السند</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReturns.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        لا توجد مرتجعات مبيعات مسجلة حتى الآن
                      </td>
                    </tr>
                  ) : (
                    salesReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-amber-800">{ret.returnNumber}</td>
                        <td className="p-3 text-slate-600 font-mono">
                          {new Date(ret.date).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-mono font-bold text-teal-700">
                          {ret.invoiceNumber || 'إرجاع مباشر'}
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{ret.customerName || 'عميل نقدي'}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700">
                            {ret.items.length} أصناف ({ret.items.reduce((s, i) => s + i.quantity, 0)} عبوة)
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700">
                            {ret.refundMethod === 'cash' ? 'نقداً من الصندوق' : ret.refundMethod === 'card' ? 'إرجاع محفظة إلكترونية' : 'رصيد دائن'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-black text-rose-700 font-mono text-sm">
                          {ret.totalAmount.toFixed(2)} {CURRENCY}
                        </td>
                        <td className="p-3 text-slate-500">{ret.pharmacistName}</td>
                        <td className="p-3 text-center">
                          {onOpenReturnReceipt && (
                            <button
                              onClick={() => onOpenReturnReceipt(ret, undefined)}
                              className="p-1.5 text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer"
                              title="معاينة وطباعة سند إرجاع المبيعات"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table: Purchase Returns */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">ثانياً: سجل مرتجعات المشتريات (المستودعات والشركات)</h3>
                  <p className="text-[11px] text-slate-400">إرجاع بضاعة وتخفيض الذمم الدائنة المستحقة للموردين</p>
                </div>
              </div>
              <span className="font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                {purchaseReturns.length} سند إرجاع
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600">
                  <tr>
                    <th className="p-3">رقم السند</th>
                    <th className="p-3">التاريخ والوقت</th>
                    <th className="p-3">المستودع / شركة التوزيع</th>
                    <th className="p-3">الأصناف المرتجعة</th>
                    <th className="p-3">طريقة التسوية المالية</th>
                    <th className="p-3 text-left">القيمة المخصومة</th>
                    <th className="p-3">الصيدلي</th>
                    <th className="p-3 text-center">طباعة السند</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {purchaseReturns.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        لا توجد مرتجعات مشتريات مسجلة للمستودعات حتى الآن
                      </td>
                    </tr>
                  ) : (
                    purchaseReturns.map((ret) => (
                      <tr key={ret.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-mono font-bold text-teal-800">{ret.returnNumber}</td>
                        <td className="p-3 text-slate-600 font-mono">
                          {new Date(ret.date).toLocaleString('ar-EG')}
                        </td>
                        <td className="p-3 font-bold text-slate-900">{ret.supplierName}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700">
                            {ret.items.length} أصناف ({ret.items.reduce((s, i) => s + i.quantity, 0)} عبوة)
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            {ret.settlementMethod === 'deduct_balance' ? 'خصم من الذمة الدائنة' : 'استرداد نقدي'}
                          </span>
                        </td>
                        <td className="p-3 text-left font-black text-teal-800 font-mono text-sm">
                          {ret.totalAmount.toFixed(2)} {CURRENCY}
                        </td>
                        <td className="p-3 text-slate-500">{ret.pharmacistName}</td>
                        <td className="p-3 text-center">
                          {onOpenReturnReceipt && (
                            <button
                              onClick={() => onOpenReturnReceipt(undefined, ret)}
                              className="p-1.5 text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 rounded-lg cursor-pointer"
                              title="معاينة وطباعة سند مرتجع المشتريات"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: RECEIPT & PRINTING PREVIEW (الفواتير والطباعة)           */}
      {/* ============================================================== */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings for Receipt */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800">تخصيص الفاتورة الحرارية (80mm POS)</h2>
                <p className="text-xs text-slate-500">الترويسة، الهوامش وسياسة الاسترجاع المطبوعة للعملاء</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص الترويسة أعلى الفاتورة
                </label>
                <input
                  type="text"
                  value={formSettings.receiptHeader}
                  onChange={(e) => setFormSettings({ ...formSettings, receiptHeader: e.target.value })}
                  placeholder="مثال: خدمة ورعاية صيدلانية متكاملة 24 ساعة"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سياسة الاسترجاع والتبديل (أسفل الفاتورة)
                </label>
                <textarea
                  rows={3}
                  value={formSettings.receiptFooter}
                  onChange={(e) => setFormSettings({ ...formSettings, receiptFooter: e.target.value })}
                  placeholder="نص سياسة التبديل والاسترجاع وعبارات الشكر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs outline-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العملة المطبوعة
                  </label>
                  <input
                    type="text"
                    value={formSettings.currency}
                    onChange={(e) => setFormSettings({ ...formSettings, currency: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ساعات الدوام
                  </label>
                  <input
                    type="text"
                    value={formSettings.workingHours}
                    onChange={(e) => setFormSettings({ ...formSettings, workingHours: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                <span>حفظ إعدادات الفاتورة</span>
              </button>
            </div>
          </div>

          {/* Live Receipt Preview */}
          <div className="bg-slate-100 rounded-3xl p-6 border border-slate-200 flex flex-col items-center justify-center">
            <div className="text-xs font-bold text-slate-500 mb-3 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>معاينة حية ومباشرة لإيصال الفاتورة الحرارية</span>
            </div>

            {/* Thermal Slip Mockup */}
            <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl p-5 border border-slate-300 font-mono text-[11px] text-slate-800 space-y-3 leading-relaxed">
              <div className="text-center pb-3 border-b-2 border-dashed border-slate-300">
                {formSettings.logoUrl && (
                  <div className="flex justify-center mb-1.5">
                    <img
                      src={formSettings.logoUrl}
                      alt="شعار الصيدلية"
                      className="w-12 h-12 object-contain mx-auto"
                    />
                  </div>
                )}
                <div className="font-sans font-black text-sm text-slate-900">{formSettings.name}</div>
                <div className="text-[10px] text-slate-500 font-sans">{formSettings.subtitle}</div>
                <div className="text-[9px] text-slate-500 font-sans mt-0.5">{formSettings.address}</div>
                <div className="text-[9px] text-slate-600 mt-0.5">
                  هاتف: {formSettings.phone} | جوال: {formSettings.mobile}
                </div>
                {formSettings.taxNumber && (
                  <div className="text-[9px] font-bold text-slate-700 mt-0.5">
                    الرقم الضريبي: {formSettings.taxNumber}
                  </div>
                )}
                {formSettings.licenseNumber && (
                  <div className="text-[9px] text-teal-800 font-bold mt-0.5">
                    ترخيص رقم: {formSettings.licenseNumber}
                  </div>
                )}
                <div className="mt-2 inline-block bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded text-[9px]">
                  فاتورة ضريبية مبسطة
                </div>
              </div>

              {/* Sample items */}
              <div className="border-b border-dashed border-slate-300 pb-2 space-y-1">
                <div className="flex justify-between font-bold text-[10px]">
                  <span>بنادول إكسترا 24 قرص</span>
                  <span>1,200 {formSettings.currency}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>1 × 1,200</span>
                  <span></span>
                </div>
                <div className="flex justify-between font-bold text-[10px]">
                  <span>أوجمنتين 1 جم 14 قرص</span>
                  <span>4,800 {formSettings.currency}</span>
                </div>
              </div>

              {/* Sample Total */}
              <div className="flex justify-between font-black text-xs pt-1 border-b-2 border-dashed border-slate-300 pb-2">
                <span>الإجمالي النهائي:</span>
                <span className="text-teal-700">6,000 {formSettings.currency}</span>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 text-[9px] text-slate-500 font-sans leading-tight">
                <p className="font-bold text-slate-700 mb-1">{formSettings.receiptHeader}</p>
                <p className="text-[8.5px] text-slate-500">{formSettings.receiptFooter}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: SYSTEM OVERVIEW & BACKUP (أمان النظام)                  */}
      {/* ============================================================== */}
      {/* ============================================================== */}
      {/* TAB 4: SYSTEM OVERVIEW & BACKUP (أمان النظام واسترداد النسخ)    */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: System Security Status */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">حالة أمان النظام</h2>
                  <p className="text-xs text-slate-500">حماية البيانات والتحكم في الوصول</p>
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <span className="font-semibold">تأمين شاشة البيع برمز PIN سريع:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">مفعل</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <span className="font-semibold">حسابات الكادر والورديات:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {users.length} حسابات
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <span className="font-semibold">قاعدة البيانات المحلية المتزامنة:</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">مستقرة ونشطة</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                  <span className="font-semibold">صلاحيات لوحة الإدارة:</span>
                  <span className="text-indigo-700 font-bold bg-indigo-100 px-2.5 py-0.5 rounded-full">المدير العام فقط</span>
                </div>
              </div>
            </div>

            {/* Column 2: Export Backups */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">تصدير النسخ الاحتياطية</h2>
                  <p className="text-xs text-slate-500">تنزيل نسخة آمنة من البيانات بصيغة JSON</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                احرص على أخذ نسخ احتياطية دورية لحفظ سجلات الأدوية والمبيعات والمصروفات، لحمايتها وإمكانية استرجاعها في أي وقت.
              </p>

              <div className="space-y-2.5 pt-1">
                {/* Export Full System Backup */}
                <button
                  type="button"
                  onClick={() => {
                    const fullBackup = {
                      version: '2.0',
                      exportedAt: new Date().toISOString(),
                      settings,
                      users: users.map((u) => ({ ...u, password: '***' })),
                      medicines,
                      invoices,
                      expenses,
                      suppliers,
                      salesReturns,
                      purchaseReturns,
                      stockAdjustments,
                      currentShift,
                    };
                    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pharmacy-full-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    onShowToast('تم تصدير النسخة الاحتياطية الشاملة لكافة بيانات الصيدلية بنجاح', 'success');
                  }}
                  className="w-full bg-slate-900 hover:bg-black text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>تصدير نسخة شاملة للنظام (كل البيانات)</span>
                </button>

                {/* Export Settings & Users Only */}
                <button
                  type="button"
                  onClick={() => {
                    const settingsBackup = {
                      version: '1.0',
                      exportedAt: new Date().toISOString(),
                      settings,
                      users: users.map((u) => ({ ...u, password: '***' })),
                    };
                    const blob = new Blob([JSON.stringify(settingsBackup, null, 2)], {
                      type: 'application/json',
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `pharmacy-settings-backup-${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    onShowToast('تم تصدير نسخة احتياطية من الإعدادات والحسابات بنجاح', 'success');
                  }}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-slate-200"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>تصدير الإعدادات وحسابات الكادر فقط</span>
                </button>
              </div>
            </div>

            {/* Column 3: Restore Backup (استرداد النسخ الاحتياطية) */}
            <div className="bg-gradient-to-b from-indigo-50/70 to-white rounded-3xl p-6 shadow-sm border border-indigo-200/80 space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-indigo-100">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-800">استرداد النسخ الاحتياطية</h2>
                  <p className="text-xs text-slate-500">استعادة البيانات من ملف نسخة سابقة</p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                يمكنك رفع ملف نسخة احتياطية بصيغة (JSON) لاسترجاع الأدوية، الفواتير، المصروفات، إعدادات الصيدلية، أو حسابات الدكاترة بعد معاينتها.
              </p>

              <div className="pt-2">
                <label className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-2xl text-xs shadow-lg shadow-indigo-600/20 transition cursor-pointer flex items-center justify-center gap-2 border border-indigo-500">
                  <FileUp className="w-4 h-4 text-indigo-200" />
                  <span>اختيار ملف النسخة الاحتياطية (.json)</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    className="hidden"
                    onChange={handleBackupFileSelect}
                  />
                </label>
              </div>

              <div className="bg-white/90 border border-indigo-100 rounded-2xl p-3 text-[11px] text-slate-500 space-y-1">
                <span className="font-bold text-slate-700 block">خطوات الاسترداد الآمن:</span>
                <p>1. اختر الملف من جهازك للمعاينة.</p>
                <p>2. ستظهر شاشة تتيح لك تحديد ما تريد استرجاعه.</p>
                <p>3. اضغط تأكيد ليتم تطبيق البيانات فوراً دون فقدان.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: RESTORE BACKUP CONFIRMATION (استرداد النسخة الاحتياطية) */}
      {/* ============================================================== */}
      {restoreModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">معاينة واسترداد النسخة الاحتياطية</h3>
                  <p className="text-[11px] text-slate-300">
                    ملف: {restoreModalData.fileName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Backup details summary card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <span className="text-slate-500">تاريخ تصدير النسخة:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {new Date(restoreModalData.exportedAt).toLocaleString('ar-EG')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">اسم الصيدلية في النسخة:</span>
                  <span className="font-bold text-teal-800">
                    {restoreModalData.pharmacyName}
                  </span>
                </div>
                {restoreModalData.logoAvailable && (
                  <div className="flex items-center justify-between text-xs text-indigo-700 bg-indigo-50 p-2 rounded-xl">
                    <span className="font-semibold">شعار الصيدلية (Logo):</span>
                    <span className="font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>متوفر وجاهز للاستعادة</span>
                    </span>
                  </div>
                )}
              </div>

              {/* Data components in the backup file */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700">حدد البيانات التي ترغب في استعادتها:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Medicines */}
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    restoreOptions.medicines ? 'border-teal-400 bg-teal-50/50 text-teal-900' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.medicines}
                        onChange={(e) => setRestoreOptions({ ...restoreOptions, medicines: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="font-bold">دليل الأدوية والمخزون</span>
                    </div>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border font-bold">
                      {restoreModalData.medicinesCount} صنف
                    </span>
                  </label>

                  {/* Invoices */}
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    restoreOptions.invoices ? 'border-teal-400 bg-teal-50/50 text-teal-900' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.invoices}
                        onChange={(e) => setRestoreOptions({ ...restoreOptions, invoices: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="font-bold">فواتير ومبيعات الصيدلية</span>
                    </div>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border font-bold">
                      {restoreModalData.invoicesCount} فاتورة
                    </span>
                  </label>

                  {/* Expenses */}
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    restoreOptions.expenses ? 'border-teal-400 bg-teal-50/50 text-teal-900' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.expenses}
                        onChange={(e) => setRestoreOptions({ ...restoreOptions, expenses: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="font-bold">سندات المصروفات التشغيلية</span>
                    </div>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border font-bold">
                      {restoreModalData.expensesCount} سند
                    </span>
                  </label>

                  {/* Settings & Logo */}
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    restoreOptions.settings ? 'border-teal-400 bg-teal-50/50 text-teal-900' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.settings}
                        onChange={(e) => setRestoreOptions({ ...restoreOptions, settings: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="font-bold">إعدادات الصيدلية والشعار</span>
                    </div>
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-lg border font-bold">
                      تكوين وهوية
                    </span>
                  </label>

                  {/* Users / Staff */}
                  <label className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition ${
                    restoreOptions.users ? 'border-teal-400 bg-teal-50/50 text-teal-900' : 'border-slate-200 bg-white text-slate-600'
                  }`}>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={restoreOptions.users}
                        onChange={(e) => setRestoreOptions({ ...restoreOptions, users: e.target.checked })}
                        className="rounded text-teal-600"
                      />
                      <span className="font-bold">حسابات الدكاترة والصيادلة</span>
                    </div>
                    <span className="font-mono text-xs bg-white px-2 py-0.5 rounded-lg border font-bold">
                      {restoreModalData.usersCount} حسابات
                    </span>
                  </label>
                </div>
              </div>

              {/* Caution Banner */}
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">تنبيه تأكيد الاسترداد:</span>
                  <span>سيتم تطبيق البيانات المحددة في النظام وتحديث الذاكرة المحلية فورياً. يمكنك دائماً أخذ نسخة جديدة مسبقاً.</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRestoreModalData(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmRestore}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>تأكيد واستعادة البيانات الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD / EDIT DOCTOR & STAFF ACCOUNT                       */}
      {/* ============================================================== */}
      {showDoctorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {editingUser ? `تعديل حساب: ${editingUser.name}` : 'إنشاء حساب دكتور / صيدلي جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    إدخال البيانات الطبية، التراخيص، الورديات، ورمز الدخول السريع PIN
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDoctorModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDoctor} className="p-6 overflow-y-auto space-y-5">
              {/* Row 1: Name & Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الاسم الكامل للدكتور / الصيدلي <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorFormData.name}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, name: e.target.value })}
                    placeholder="مثال: د. ماجد سالم باوزير"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm font-semibold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم المستخدم للدخول <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={doctorFormData.username}
                    onChange={(e) =>
                      setDoctorFormData({ ...doctorFormData, username: e.target.value.toLowerCase().trim() })
                    }
                    placeholder="مثال: majed (أحرف إنجليزية)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm font-mono outline-none"
                  />
                </div>
              </div>

              {/* Row 2: Role & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الدور الوظيفي <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={doctorFormData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      let defaultTitle = 'دكتور صيدلي ممارس';
                      if (newRole === 'admin') defaultTitle = 'مدير الصيدلية وصيدلي مسؤول';
                      if (newRole === 'cashier') defaultTitle = 'كاشير مبيعات وخدمة عملاء';
                      if (newRole === 'accountant') defaultTitle = 'محاسب مالي ومسؤول خزينة';

                      setDoctorFormData({
                        ...doctorFormData,
                        role: newRole,
                        roleNameAr: defaultTitle,
                        permissions: {
                          ...doctorFormData.permissions,
                          canAccessAdmin: newRole === 'admin',
                          canManageInventory: newRole === 'admin' || newRole === 'pharmacist',
                          canManageExpenses: newRole === 'admin' || newRole === 'pharmacist',
                        },
                      });
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm font-bold text-slate-700 bg-white outline-none"
                  >
                    <option value="pharmacist">دكتور صيدلي / طبيب (Pharmacist)</option>
                    <option value="admin">مدير الصيدلية (Admin)</option>
                    <option value="cashier">كاشير مبيعات (Cashier)</option>
                    <option value="accountant">محاسب (Accountant)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المسمى الوظيفي بالعربي
                  </label>
                  <input
                    type="text"
                    value={doctorFormData.roleNameAr}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, roleNameAr: e.target.value })}
                    placeholder="مثال: دكتور صيدلي - وردية ليلية"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Row 3: Medical Credentials & Shift */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم ترخيص مزاولة المهنة
                  </label>
                  <input
                    type="text"
                    value={doctorFormData.licenseNumber}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, licenseNumber: e.target.value })}
                    placeholder="مثال: PHARM-YE-2023-112"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    المؤهل / التخصص الدوائي
                  </label>
                  <input
                    type="text"
                    value={doctorFormData.specialty}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, specialty: e.target.value })}
                    placeholder="مثال: دكتوراه صيدلة PharmD"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وردية العمل المعتادة
                  </label>
                  <select
                    value={doctorFormData.shiftType}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, shiftType: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs font-bold text-slate-700 bg-white outline-none"
                  >
                    <option value="morning">وردية صباحية (8ص - 4م)</option>
                    <option value="evening">وردية مسائية (4م - 12م)</option>
                    <option value="night">وردية ليلية (12م - 8ص)</option>
                    <option value="all">كل الورديات</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Security PIN & Password */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>بيانات الدخول السريع وكلمة المرور</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      رمز PIN السريع (4 أرقام) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={doctorFormData.pin}
                      onChange={(e) =>
                        setDoctorFormData({ ...doctorFormData, pin: e.target.value.replace(/\D/g, '') })
                      }
                      placeholder="مثال: 1234"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm font-mono font-bold tracking-widest text-center outline-none bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">يستخدم لتسجيل الدخول السريع بنقرة واحدة</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور (اختياري)
                    </label>
                    <input
                      type="password"
                      value={doctorFormData.password}
                      onChange={(e) => setDoctorFormData({ ...doctorFormData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-sm outline-none bg-white"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">للدخول التقليدي باسم المستخدم وكلمة السر</p>
                  </div>
                </div>
              </div>

              {/* Row 5: Contact details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    رقم هاتف الدكتور / الواتساب
                  </label>
                  <input
                    type="text"
                    value={doctorFormData.phone}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, phone: e.target.value })}
                    placeholder="مثال: 771234567"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={doctorFormData.email}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, email: e.target.value })}
                    placeholder="doctor@alnoor-pharma.ye"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 text-xs outline-none"
                  />
                </div>
              </div>

              {/* Row 6: Permissions Checklist */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  صلاحيات النظام الممنوحة:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canSell}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canSell: e.target.checked },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">البيع ونقاط البيع (POS)</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canManageInventory}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canManageInventory: e.target.checked },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">إدارة الأدوية والمخزون</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canManageExpenses}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canManageExpenses: e.target.checked },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">سندات الصرف والمصروفات</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canCloseShift}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canCloseShift: e.target.checked },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">إغلاق وفتح الوردية</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canViewReports}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canViewReports: e.target.checked },
                        })
                      }
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-semibold text-slate-700">مشاهدة التقارير وصافي الدخل</span>
                  </label>

                  <label className="flex items-center gap-2 p-2 bg-purple-50 hover:bg-purple-100 rounded-xl cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={doctorFormData.permissions.canAccessAdmin}
                      onChange={(e) =>
                        setDoctorFormData({
                          ...doctorFormData,
                          permissions: { ...doctorFormData.permissions, canAccessAdmin: e.target.checked },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span className="font-bold text-purple-900">الدخول للوحة الإدارة</span>
                  </label>
                </div>
              </div>

              {/* Status active */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-800">حالة الحساب</span>
                  <p className="text-[11px] text-slate-400">الحسابات النشطة فقط هي التي تستطيع تسجيل الدخول والبيع</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doctorFormData.isActive}
                    onChange={(e) => setDoctorFormData({ ...doctorFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-700">
                    {doctorFormData.isActive ? 'حساب نشط' : 'حساب معطل'}
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDoctorModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingUser ? 'حفظ التعديلات' : 'إنشاء حساب الدكتور'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: DELETE CONFIRMATION                                     */}
      {/* ============================================================== */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200">
            <div className="w-14 h-14 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">هل أنت متأكد من حذف الحساب؟</h3>
              <p className="text-xs text-slate-500 mt-1">
                سيتم حذف حساب الدكتور ({deleteConfirmUser.name}) نهائياً من قائمة موظفي الصيدلية.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer flex-1"
              >
                تراجع
              </button>
              <button
                onClick={() => {
                  onDeleteUser(deleteConfirmUser.id);
                  onShowToast(`تم حذف حساب ${deleteConfirmUser.name}`, 'info');
                  setDeleteConfirmUser(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex-1"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
