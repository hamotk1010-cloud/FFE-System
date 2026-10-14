import React from 'react';
import {
  LayoutDashboard,
  Box,
  Image,
  Users,
  QrCode,
  LogOut,
  KeyRound,
  Building2,
  ChevronRight,
  ShieldCheck,
  ScanLine
} from 'lucide-react';
import { ActiveTab } from '../types';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenPasswordModal: () => void;
  onOpenScannerModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenPasswordModal,
  onOpenScannerModal,
  onLogout,
}) => {
  return (
    <header className="bg-white/40 backdrop-blur-xl border-b border-white/40 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-indigo-950 text-base tracking-tight">WorkSpace FFE</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200/60">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Asset & Employee Tracking</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-white/40 p-1.5 rounded-2xl border border-white/50 backdrop-blur-md shadow-inner">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                activeTab === 'overview'
                  ? 'bg-white/90 text-indigo-700 font-bold shadow-sm border border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('assets')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                activeTab === 'assets'
                  ? 'bg-white/90 text-indigo-700 font-bold shadow-sm border border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <Box className="w-4 h-4" />
              <span>FFE Inventory</span>
            </button>

            <button
              onClick={() => setActiveTab('employees')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                activeTab === 'employees' || activeTab === 'profile'
                  ? 'bg-white/90 text-indigo-700 font-bold shadow-sm border border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Employee Directory</span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                activeTab === 'gallery'
                  ? 'bg-white/90 text-indigo-700 font-bold shadow-sm border border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>Asset Gallery</span>
            </button>

            <button
              onClick={() => setActiveTab('qrcodes')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all ${
                activeTab === 'qrcodes'
                  ? 'bg-white/90 text-indigo-700 font-bold shadow-sm border border-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/40 font-medium'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code Manager</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Quick QR Camera Scanner Button */}
            <button
              onClick={onOpenScannerModal}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200/80 transition-all active:scale-95"
              title="Scan QR Code with Camera"
            >
              <ScanLine className="w-4 h-4" />
              <span className="hidden sm:inline">Scan QR Badge</span>
            </button>

            {/* Password / Settings */}
            <button
              onClick={onOpenPasswordModal}
              className="p-2 bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-900 rounded-xl border border-white/60 backdrop-blur-md shadow-sm transition-all"
              title="Admin Password Settings"
            >
              <KeyRound className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-xl border border-white/60 hover:border-rose-200 text-xs font-medium transition-all backdrop-blur-md shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-white/30">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              activeTab === 'overview' ? 'text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              activeTab === 'assets' ? 'text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <Box className="w-4 h-4" />
            <span>Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              activeTab === 'employees' || activeTab === 'profile' ? 'text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Staff</span>
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              activeTab === 'gallery' ? 'text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Gallery</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`flex flex-col items-center gap-1 text-[11px] font-medium ${
              activeTab === 'qrcodes' ? 'text-indigo-700 font-bold' : 'text-slate-600'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>QR Codes</span>
          </button>
        </div>
      </div>
    </header>
  );
};
