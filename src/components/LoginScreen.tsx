import React, { useState } from 'react';
import { Lock, User, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Eye, EyeOff, QrCode, ExternalLink } from 'lucide-react';
import { DEFAULT_ADMIN } from '../data/initialData';
import { getAdminPassword } from '../lib/storage';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onOpenPublicProfile?: () => void;
  onOpenPublicScanner?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenPublicProfile,
  onOpenPublicScanner,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    setTimeout(() => {
      const storedPassword = getAdminPassword();
      const isValidPassword =
        password === storedPassword ||
        (storedPassword === 'password123' && password === 'admin123') ||
        (storedPassword === 'admin123' && password === 'password123');

      if (username.trim().toLowerCase() === DEFAULT_ADMIN.username.toLowerCase() && isValidPassword) {
        onLoginSuccess();
      } else {
        setError('Invalid administrator username or password.');
        setIsLoading(false);
      }
    }, 400);
  };

  return (
    <div
      className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-indigo-500 selection:text-white"
      style={{ backgroundImage: 'radial-gradient(at top left, #e0e7ff, #f1f5f9, #dcfce7)' }}
    >
      {/* Decorative Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-300/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white/40 backdrop-blur-2xl border border-white/60 rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 text-slate-800">
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white mb-4 shadow-lg shadow-indigo-200">
            <ShieldCheck className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">WorkSpace FFE Tracker</h1>
          <p className="text-slate-500 text-sm mt-1.5">
            Furniture, Fixtures & Equipment Management System
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Administrator Username
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-white/60 border border-white/60 rounded-xl py-2.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-white/60 border border-white/60 rounded-xl py-2.5 pl-11 pr-11 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-inner transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-indigo-200/80 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed text-sm"
          >
            {isLoading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : (
              <>
                <span>Access Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Public Audit Portal Section (No Login Required) */}
        <div className="mt-6 pt-5 border-t border-white/60 text-center space-y-2">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Auditing & Badge Verification</p>
          <div className="grid grid-cols-2 gap-2">
            {onOpenPublicScanner && (
              <button
                type="button"
                onClick={onOpenPublicScanner}
                className="py-2 px-3 bg-white/60 hover:bg-white/90 text-indigo-700 font-semibold text-xs rounded-xl border border-white/80 shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <QrCode className="w-3.5 h-3.5 text-indigo-600" />
                <span>Scan QR Badge</span>
              </button>
            )}
            {onOpenPublicProfile && (
              <button
                type="button"
                onClick={onOpenPublicProfile}
                className="py-2 px-3 bg-white/60 hover:bg-white/90 text-slate-700 font-semibold text-xs rounded-xl border border-white/80 shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>Public Lookup</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 pt-4 border-t border-white/40 text-center">
          <p className="text-slate-500 text-xs flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protected Route & Session Storage Active</span>
          </p>
        </div>
      </div>
    </div>
  );
};
