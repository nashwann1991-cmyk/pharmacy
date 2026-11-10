import React from 'react';
import {
  Pill,
  Calculator,
  UserCheck,
  LogOut,
  Clock,
  Store,
  AlertTriangle,
  RefreshCw,
  Sliders,
  DollarSign,
  FileText,
  BarChart3,
  TrendingDown,
  TrendingUp,
  Lock,
  User,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import { Shift, SystemUser, MainTabType, CURRENCY, PharmacySettings } from '../types';

interface NavbarProps {
  currentTab: MainTabType;
  setCurrentTab: (tab: MainTabType) => void;
  currentShift: Shift;
  onOpenDosageModal: () => void;
  lowStockCount: number;
  expiringCount: number;
  currentUser?: SystemUser | null;
  pharmacySettings?: PharmacySettings;
  onLockScreen?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentShift,
  onOpenDosageModal,
  lowStockCount,
  expiringCount,
  currentUser,
  pharmacySettings,
  onLockScreen,
  onLogout,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 shadow-md sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-slate-800/80">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Shift status */}
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>الوردية: {currentShift.status === 'open' ? 'نشطة (مفتوحة)' : 'مغلقة'}</span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Cash Drawer Balance */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>عهدة الدرج: <strong className="text-white">{currentShift.openingCash.toFixed(2)} {CURRENCY}</strong></span>
          </div>

          <span className="text-slate-600 hidden sm:inline">|</span>

          {/* Logged in Staff Profile */}
          {currentUser && (
            <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-2.5 py-1 rounded-xl">
              <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser.name.charAt(2) || currentUser.name.charAt(0)}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-200 font-bold">{currentUser.name}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                    currentUser.role === 'admin'
                      ? 'bg-purple-500/20 text-purple-300'
                      : currentUser.role === 'pharmacist'
                      ? 'bg-teal-500/20 text-teal-300'
                      : 'bg-blue-500/20 text-blue-300'
                  }`}
                >
                  {currentUser.role === 'admin' ? 'مدير الصيدلية' : currentUser.role === 'pharmacist' ? 'صيدلي' : 'كاشير'}
                </span>
              </div>

              {/* Lock Screen Button */}
              {onLockScreen && (
                <button
                  onClick={onLockScreen}
                  title="قفل الشاشة السريع"
                  className="text-slate-400 hover:text-amber-400 p-1 rounded transition cursor-pointer ml-1"
                >
                  <Lock className="w-3 h-3" />
                </button>
              )}

              {/* Logout Button */}
              {onLogout && (
                <button
                  onClick={onLogout}
                  title="تسجيل الخروج وتبديل المستخدم"
                  className="text-slate-400 hover:text-rose-400 p-1 rounded transition cursor-pointer"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right side utility buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Stock Alerts */}
          {(lowStockCount > 0 || expiringCount > 0) && (
            <button
              onClick={() => setCurrentTab('inventory')}
              className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 px-2.5 py-1 rounded-lg hover:bg-amber-500/25 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {lowStockCount > 0 && `${lowStockCount} نواقص `}
                {expiringCount > 0 && `| ${expiringCount} قارب انتهاؤه`}
              </span>
            </button>
          )}

          {/* Dosage Calculator */}
          <button
            onClick={onOpenDosageModal}
            className="flex items-center gap-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg transition cursor-pointer"
            title="حاسبة الجرعات والتفاعلات الدوائية"
          >
            <Calculator className="w-3.5 h-3.5 text-teal-400" />
            <span>حاسبة الجرعات</span>
          </button>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-4">
        {/* Logo and Pharmacy Name */}
        <div className="flex items-center gap-3">
          {pharmacySettings?.logoUrl ? (
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-700/80 p-1 flex items-center justify-center shadow-lg shadow-teal-500/10 overflow-hidden shrink-0">
              <img
                src={pharmacySettings.logoUrl}
                alt={pharmacySettings.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-teal-500/20 shrink-0">
              <Pill className="w-6 h-6" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">
                {pharmacySettings?.name || 'الصيدلية النموذجية'}
              </h1>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 font-bold px-2 py-0.5 rounded-full border border-teal-500/30">
                {pharmacySettings?.branchName || 'إدارة ومحاسبة'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {pharmacySettings?.subtitle || 'نقاط البيع POS • المخزون • المصروفات • صافي الدخل • اليومية والأرباح'}
            </p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700/80 flex-wrap gap-1">
          {/* POS */}
          <button
            onClick={() => setCurrentTab('pos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'pos'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>نقطة البيع (POS)</span>
          </button>

          {/* Inventory */}
          <button
            onClick={() => setCurrentTab('inventory')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer relative ${
              currentTab === 'inventory'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Pill className="w-3.5 h-3.5" />
            <span>المخزون والأدوية</span>
            {(lowStockCount > 0 || expiringCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1.5 left-1.5"></span>
            )}
          </button>

          {/* Expenses (NEW DEDICATED TAB) */}
          <button
            onClick={() => setCurrentTab('expenses')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'expenses'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <TrendingDown className="w-3.5 h-3.5 text-rose-300" />
            <span>المصروفات</span>
          </button>

          {/* Daily Net Income (NEW DEDICATED TAB) */}
          <button
            onClick={() => setCurrentTab('daily-income')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'daily-income'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-300" />
            <span>صافي الدخل اليومي</span>
          </button>

          {/* Accounting */}
          <button
            onClick={() => setCurrentTab('accounting')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'accounting'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>المحاسبة والورديات</span>
          </button>

          {/* Invoices */}
          <button
            onClick={() => setCurrentTab('invoices')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'invoices'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>سجل الفواتير</span>
          </button>

          {/* Reports */}
          <button
            onClick={() => setCurrentTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              currentTab === 'reports'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>التقارير المالية</span>
          </button>

          {/* Admin Control Panel (ADMIN ONLY) */}
          {currentUser?.role === 'admin' && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                currentTab === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 ring-2 ring-indigo-400/40'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-950/70 border border-indigo-500/40 bg-indigo-950/30'
              }`}
              title="لوحة الإدارة - إعدادات الصيدلية وحسابات الدكاترة (F8) - للمدراء فقط"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>لوحة الإدارة</span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse"></span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
