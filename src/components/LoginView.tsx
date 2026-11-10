import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  KeyRound,
  LogIn,
  Pill,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { SystemUser, PharmacySettings } from '../types';

interface LoginViewProps {
  users: SystemUser[];
  onLogin: (user: SystemUser) => void;
  lockedUser?: SystemUser | null;
  onCancelLock?: () => void;
  pharmacySettings?: PharmacySettings;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  onLogin,
  lockedUser,
  onCancelLock,
  pharmacySettings,
}) => {
  const [loginMode, setLoginMode] = useState<'pin' | 'credentials'>('pin');
  const [selectedUser, setSelectedUser] = useState<SystemUser>(lockedUser || users[0]);
  const [pinInput, setPinInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);

    if (!pinInput) {
      setErrorMessage('يرجى إدخال رمز PIN المكون من 4 أرقام');
      return;
    }

    if (pinInput === selectedUser.pin) {
      onLogin(selectedUser);
    } else {
      setErrorMessage('رمز PIN غير صحيح. يرجى التأكد من الرمز والمحاولة ثانية');
    }
  };

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const found = users.find(
      (u) =>
        u.username.toLowerCase() === usernameInput.trim().toLowerCase() ||
        (u.email && u.email.toLowerCase() === usernameInput.trim().toLowerCase())
    );

    if (!found) {
      setErrorMessage('اسم المستخدم أو البريد الإلكتروني غير مسجل');
      return;
    }

    if (found.password !== passwordInput && found.pin !== passwordInput) {
      setErrorMessage('كلمة المرور غير صحيحة');
      return;
    }

    onLogin(found);
  };

  const handleQuickFill = (user: SystemUser) => {
    setSelectedUser(user);
    setPinInput(user.pin);
    setUsernameInput(user.username);
    setPasswordInput(user.password || user.pin);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-teal-950 flex items-center justify-center p-4 relative overflow-hidden font-['Cairo','Inter',sans-serif]">
      {/* Decorative background glows */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          {pharmacySettings?.logoUrl ? (
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white p-2 border border-slate-700 shadow-xl shadow-teal-500/20 mb-2 overflow-hidden">
              <img
                src={pharmacySettings.logoUrl}
                alt={pharmacySettings.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-xl shadow-teal-500/20 mb-2">
              <Pill className="w-9 h-9" />
            </div>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            {pharmacySettings?.name || 'نظام إدارة الصيدلية'}
          </h1>
          <p className="text-xs text-slate-400">
            {lockedUser
              ? 'شاشة القفل السريع - يرجى إدخال الرمز السري للمتابعة'
              : pharmacySettings?.subtitle || 'النظام المحاسبي المتكامل وإدارة نقاط البيع والمخزون'}
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-400 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
            <span>
              العملة المعتمدة: {pharmacySettings?.currencyFullName || 'الريال اليمني'} ({pharmacySettings?.currency || 'ر.ي'})
            </span>
          </div>
        </div>

        {/* Locked Screen Banner */}
        {lockedUser && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-amber-300 block font-semibold">الشاشة مؤمنة للمستخدم:</span>
                <span className="text-sm font-bold text-white">{lockedUser.name}</span>
                <span className="text-[10px] text-slate-400 block">{lockedUser.roleNameAr}</span>
              </div>
            </div>
            {onCancelLock && (
              <button
                type="button"
                onClick={onCancelLock}
                className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
              >
                تبديل المستخدم
              </button>
            )}
          </div>
        )}

        {/* Mode Switcher Tabs */}
        {!lockedUser && (
          <div className="grid grid-cols-2 bg-slate-800/80 p-1 rounded-2xl border border-slate-700/80 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setLoginMode('pin');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                loginMode === 'pin'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>دخول سريع بالـ PIN</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('credentials');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                loginMode === 'credentials'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>اسم المستخدم وكلمة السر</span>
            </button>
          </div>
        )}

        {/* Quick User Selection Chips */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-slate-400 block">
            {lockedUser ? 'المستخدم المعتمد:' : 'اختر الموظف / الصيدلي المناوب:'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {users.map((u) => {
              const isSelected = selectedUser.id === u.id;
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={Boolean(lockedUser && lockedUser.id !== u.id)}
                  onClick={() => handleQuickFill(u)}
                  className={`p-2.5 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-500 bg-teal-500/15 shadow-sm shadow-teal-500/20'
                      : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700 text-slate-300'
                  } ${lockedUser && lockedUser.id !== u.id ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-teal-400 flex items-center justify-center text-xs font-bold">
                      {u.name.charAt(2) || u.name.charAt(0)}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                        u.role === 'admin'
                          ? 'bg-purple-500/20 text-purple-300'
                          : u.role === 'pharmacist'
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {u.role === 'admin' ? 'مدير' : u.role === 'pharmacist' ? 'صيدلي' : 'كاشير'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white truncate block">{u.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">PIN: {u.pin}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Feedback */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PIN Login Mode */}
        {loginMode === 'pin' && (
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                رمز المرور السري (PIN) الخاص بـ {selectedUser.name}:
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="أدخل الرمز المكون من 4 أرقام..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-3 text-center text-xl tracking-widest font-mono text-teal-400 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Quick Virtual Numpad */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '✓'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    if (key === 'C') {
                      setPinInput('');
                    } else if (key === '✓') {
                      handlePinSubmit();
                    } else {
                      if (pinInput.length < 6) {
                        setPinInput((prev) => prev + key);
                      }
                    }
                  }}
                  className={`py-3 rounded-xl font-bold text-sm transition cursor-pointer ${
                    key === '✓'
                      ? 'bg-teal-600 hover:bg-teal-500 text-white'
                      : key === 'C'
                      ? 'bg-rose-950/40 border border-rose-800/40 hover:bg-rose-900/60 text-rose-300'
                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{lockedUser ? 'إلغاء القفل واستئناف العمل' : 'دخول إلى نظام الصيدلية'}</span>
            </button>
          </form>
        )}

        {/* Credentials Login Mode */}
        {loginMode === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">اسم المستخدم أو البريد:</label>
              <div className="relative">
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="مثال: ahmed أو البريد الإلكتروني"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">كلمة المرور:</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="أدخل كلمة المرور..."
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 pl-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500"
                />
                <span>تذكر تسجيل الدخول في هذا الجهاز</span>
              </label>
              <span className="text-[11px] text-teal-400">نظام محمي بكلمة سر وتشفير</span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول للنظام</span>
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="pt-2 border-t border-slate-800 text-center text-[11px] text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-1 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>نظام الصيدلية جاهز للعمل</span>
          </div>
          <span>{pharmacySettings?.name || 'نظام الصيدلية'} • إصدار 2026</span>
        </div>
      </div>
    </div>
  );
};
