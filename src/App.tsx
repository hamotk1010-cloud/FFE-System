import React, { useState, useEffect } from 'react';
import { ActiveTab, Employee, FFEAsset } from './types';
import {
  getStoredAssets,
  getStoredEmployees,
  isAuthenticated,
  setAuthenticated,
  setStoredAssets,
  setStoredEmployees,
  cacheAssetsLocally,
  cacheEmployeesLocally,
  markEmployeeDeleted,
  markAssetDeleted,
  unmarkEmployeeDeleted,
  unmarkAssetDeleted,
  getDeletedEmployeeIds,
} from './lib/storage';

import { LoginScreen } from './components/LoginScreen';
import { Navbar } from './components/Navbar';
import { PasswordModal } from './components/PasswordModal';
import { DashboardOverview } from './components/DashboardOverview';

import { AssetList } from './components/AssetManagement/AssetList';
import { AssetModal } from './components/AssetManagement/AssetModal';
import { PhotoGalleryView } from './components/AssetManagement/PhotoGalleryView';

import { EmployeeList } from './components/EmployeeDirectory/EmployeeList';
import { EmployeeModal } from './components/EmployeeDirectory/EmployeeModal';
import { EmployeeDeleteConfirmModal } from './components/EmployeeDirectory/EmployeeDeleteConfirmModal';
import { QRCodeModal } from './components/EmployeeDirectory/QRCodeModal';
import { QRCodeManager } from './components/QRCodeManager/QRCodeManager';

import { EmployeeProfileView } from './components/ProfileView/EmployeeProfileView';
import { PublicProfileView } from './components/ProfileView/PublicProfileView';
import { QRScannerModal } from './components/QRScanner/QRScannerModal';
import { syncFromUrlParams, parseEmployeeIdFromScan } from './lib/qrSync';
import { fetchAppData, fetchEmployeeAudit, assignAssetApi } from './lib/api';

function getEmpIdFromCurrentLocation(): string | null {
  try {
    const deletedEmployeeSet = new Set(getDeletedEmployeeIds().map((id) => id.toLowerCase()));
    const searchParams = new URLSearchParams(window.location.search);
    
    const directId =
      searchParams.get('profile') ||
      searchParams.get('id') ||
      searchParams.get('employeeId') ||
      searchParams.get('emp') ||
      searchParams.get('scan');

    if (directId && !deletedEmployeeSet.has(directId.toLowerCase())) {
      return directId;
    }

    if (searchParams.get('view') === 'employee') {
      const vId = searchParams.get('id') || searchParams.get('emp');
      if (vId && !deletedEmployeeSet.has(vId.toLowerCase())) {
        return vId;
      }
      return null;
    }

    if (searchParams.get('view') === 'public' || searchParams.has('public')) {
      const pId = searchParams.get('id');
      if (pId && !deletedEmployeeSet.has(pId.toLowerCase())) {
        return pId;
      }
      return null;
    }

    const hash = window.location.hash;
    if (hash) {
      const hashSlashMatch = hash.match(/(?:profile|employee|emp|id)\/([a-zA-Z0-9_-]+)/i);
      if (hashSlashMatch && hashSlashMatch[1] && !deletedEmployeeSet.has(hashSlashMatch[1].toLowerCase())) {
        return hashSlashMatch[1];
      }

      const hashQueryIndex = hash.indexOf('?');
      if (hashQueryIndex !== -1) {
        const hashParams = new URLSearchParams(hash.substring(hashQueryIndex));
        const matched =
          hashParams.get('profile') ||
          hashParams.get('id') ||
          hashParams.get('employeeId') ||
          (hashParams.get('view') === 'employee' ? hashParams.get('id') : null) ||
          null;
        if (matched && !deletedEmployeeSet.has(matched.toLowerCase())) {
          return matched;
        }
      }
    }
  } catch (e) {
    console.error('Error reading URL parameters', e);
  }
  return null;
}

function PublicStatusScreen({
  title,
  message,
  loading,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  message: string;
  loading?: boolean;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="max-w-sm w-full bg-slate-800/60 border border-slate-700/80 rounded-3xl p-8 text-center space-y-4 shadow-xl">
        {loading && (
          <div className="mx-auto w-10 h-10 rounded-full border-4 border-slate-600 border-t-indigo-500 animate-spin" />
        )}
        <h1 className="text-lg font-extrabold text-white">{title}</h1>
        <p className="text-sm text-slate-400 leading-relaxed">{message}</p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="w-full px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState<boolean>(() => isAuthenticated());
  const [assets, setAssets] = useState<FFEAsset[]>(() => getStoredAssets());
  const [employees, setEmployees] = useState<Employee[]>(() => getStoredEmployees());

  const [publicProfileEmpId, setPublicProfileEmpId] = useState<string | null>(() => {
    return getEmpIdFromCurrentLocation();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [selectedProfileEmpId, setSelectedProfileEmpId] = useState<string | null>(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<FFEAsset | null>(null);

  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<FFEAsset | null>(null);

  const [selectedQREmployee, setSelectedQREmployee] = useState<Employee | null>(null);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Live data for the public QR profile page, loaded straight from the server.
  const [audit, setAudit] = useState<{
    empId: string;
    employee: Employee;
    assignedAssets: FFEAsset[];
  } | null>(null);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'loading' | 'ok' | 'not_found' | 'error'>('idle');
  const [auditRetry, setAuditRetry] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const initSync = syncFromUrlParams(window.location.search);
    if (initSync.syncedAssets) {
      setAssets(initSync.syncedAssets);
    }
    if (initSync.syncedEmployees) {
      setEmployees(initSync.syncedEmployees);
    }

    const syncWithServer = async () => {
      try {
        const serverData = await fetchAppData();
        if (serverData && isMounted) {
          if (Array.isArray(serverData.assets)) {
            setAssets(serverData.assets);
            cacheAssetsLocally(serverData.assets);
          }
          if (Array.isArray(serverData.employees)) {
            setEmployees(serverData.employees);
            cacheEmployeesLocally(serverData.employees);
          }
        }
      } catch (err) {
        console.warn('Initial server sync warning:', err);
      }
    };

    syncWithServer();

    const handleStorageChange = () => {
      setAssets(getStoredAssets());
      setEmployees(getStoredEmployees());
    };

    const handlePopState = () => {
      const popSync = syncFromUrlParams(window.location.search);
      if (popSync.syncedAssets) {
        setAssets(popSync.syncedAssets);
      }
      if (popSync.syncedEmployees) {
        setEmployees(popSync.syncedEmployees);
      }
      setPublicProfileEmpId(getEmpIdFromCurrentLocation());
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('ffe_state_updated', handleStorageChange);
    window.addEventListener('popstate', handlePopState);

    const pollInterval = setInterval(async () => {
      try {
        const serverData = await fetchAppData();
        if (serverData && isMounted) {
          if (Array.isArray(serverData.assets)) {
            setAssets((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.assets)) {
                cacheAssetsLocally(serverData.assets);
                return serverData.assets;
              }
              return prev;
            });
          }
          if (Array.isArray(serverData.employees)) {
            setEmployees((prev) => {
              if (JSON.stringify(prev) !== JSON.stringify(serverData.employees)) {
                cacheEmployeesLocally(serverData.employees);
                return serverData.employees;
              }
              return prev;
            });
          }
        }
      } catch {
        const freshAssets = getStoredAssets();
        const freshEmployees = getStoredEmployees();
        setAssets((prev) => (JSON.stringify(prev) !== JSON.stringify(freshAssets) ? freshAssets : prev));
        setEmployees((prev) => (JSON.stringify(prev) !== JSON.stringify(freshEmployees) ? freshEmployees : prev));
      }
    }, 1500);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('ffe_state_updated', handleStorageChange);
      window.removeEventListener('popstate', handlePopState);
      clearInterval(pollInterval);
    };
  }, []);

  // FIX: When a profile is opened (e.g. by scanning a QR code) ask the server for that employee
  // and the assets assigned to them, instead of relying on this browser's localStorage, which is
  // empty on a phone that has never used the admin app.
  useEffect(() => {
    if (!publicProfileEmpId) {
      setAudit(null);
      setAuditStatus('idle');
      return;
    }

    let cancelled = false;
    setAudit(null);
    setAuditStatus('loading');

    const load = async () => {
      const result = await fetchEmployeeAudit(publicProfileEmpId);
      if (cancelled) return;

      if (result.status === 'ok') {
        setAudit({
          empId: publicProfileEmpId,
          employee: result.employee,
          assignedAssets: result.assignedAssets,
        });
        setAuditStatus('ok');
      } else if (result.status === 'not_found') {
        setAudit(null);
        setAuditStatus('not_found');
      } else {
        // Keep showing the last good server data if a refresh fails.
        setAuditStatus((prev) => (prev === 'ok' ? 'ok' : 'error'));
      }
    };

    load();
    const timer = setInterval(load, 5000); // keep the profile live while it is open

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [publicProfileEmpId, auditRetry]);

  const navigateToPublicProfile = (empId: string, mode: 'push' | 'replace' = 'push') => {
    const url = new URL(window.location.href);
    ['profile', 'employeeId', 'emp', 'scan', 'assigned', 'public'].forEach((k) =>
      url.searchParams.delete(k)
    );
    url.searchParams.set('view', 'employee');
    url.searchParams.set('id', empId);
    if (mode === 'push') {
      window.history.pushState({}, '', url.toString());
    } else {
      window.history.replaceState({}, '', url.toString());
    }
    setPublicProfileEmpId(empId);
  };

  const leavePublicProfile = () => {
    setPublicProfileEmpId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('profile');
    url.searchParams.delete('id');
    url.searchParams.delete('view');
    url.searchParams.delete('employeeId');
    url.searchParams.delete('emp');
    url.searchParams.delete('scan');
    window.history.replaceState({}, '', url.toString());
  };

  const updateAssetsState = (newAssets: FFEAsset[]) => {
    setAssets(newAssets);
    setStoredAssets(newAssets);
    window.dispatchEvent(new CustomEvent('ffe_state_updated'));
  };

  const updateEmployeesState = (newEmployees: Employee[]) => {
    setEmployees(newEmployees);
    setStoredEmployees(newEmployees);
    window.dispatchEvent(new CustomEvent('ffe_state_updated'));
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
    setAuthed(true);
  };

  const handleLogout = () => {
    setAuthenticated(false);
    setAuthed(false);
  };

  const handleSaveAsset = (assetData: Partial<FFEAsset> | Partial<FFEAsset>[]) => {
    if (Array.isArray(assetData)) {
      const timestamp = Date.now().toString().slice(-4);
      const newAssetsList: FFEAsset[] = assetData.map((data, index) => {
        const generatedId = data.id || `AST-${Math.floor(1000 + Math.random() * 9000)}-${timestamp}-${index + 1}`;
        unmarkAssetDeleted(generatedId);
        return {
          id: generatedId,
          tagNumber: data.tagNumber ? data.tagNumber.trim() : undefined,
          name: data.name ? data.name.trim() : 'New FFE Item',
          category: data.category || 'Furniture',
          serialNumber: data.serialNumber ? data.serialNumber.trim() : `SN-${Date.now()}-${index + 1}`,
          status: data.status || 'Available',
          location: data.location ? data.location.trim() : 'Building A',
          assignedToEmployeeId: data.assignedToEmployeeId || null,
          photoUrl: data.photoUrl ? data.photoUrl.trim() : '',
          dateAdded: new Date().toISOString().split('T')[0],
          purchaseCost: data.purchaseCost || 0,
          notes: data.notes ? data.notes.trim() : '',
        };
      });
      updateAssetsState([...newAssetsList, ...assets]);
    } else if (editingAsset) {
      unmarkAssetDeleted(editingAsset.id);
      const updated = assets.map((a) =>
        a.id === editingAsset.id ? ({ ...a, ...assetData } as FFEAsset) : a
      );
      updateAssetsState(updated);
    } else {
      const generatedId = assetData.id || `AST-${Math.floor(1000 + Math.random() * 9000)}`;
      unmarkAssetDeleted(generatedId);
      const newAsset: FFEAsset = {
        id: generatedId,
        tagNumber: assetData.tagNumber ? assetData.tagNumber.trim() : undefined,
        name: assetData.name ? assetData.name.trim() : 'New FFE Item',
        category: assetData.category || 'Furniture',
        serialNumber: assetData.serialNumber ? assetData.serialNumber.trim() : `SN-${Date.now().toString().slice(-6)}`,
        status: assetData.status || 'Available',
        location: assetData.location ? assetData.location.trim() : 'Building A',
        assignedToEmployeeId: assetData.assignedToEmployeeId || null,
        photoUrl: assetData.photoUrl ? assetData.photoUrl.trim() : '',
        dateAdded: new Date().toISOString().split('T')[0],
        purchaseCost: assetData.purchaseCost || 0,
        notes: assetData.notes ? assetData.notes.trim() : '',
      };
      updateAssetsState([newAsset, ...assets]);
    }
    setEditingAsset(null);
  };

  const handleDeleteAssetConfirm = () => {
    if (!deletingAsset) return;
    markAssetDeleted(deletingAsset.id);
    const updated = assets.filter((a) => a.id !== deletingAsset.id);
    updateAssetsState(updated);
    setDeletingAsset(null);
  };

  const handleQuickToggleAssign = (asset: FFEAsset) => {
    if (asset.status === 'Assigned') {
      const updated = assets.map((a) =>
        a.id === asset.id ? { ...a, status: 'Available' as const, assignedToEmployeeId: null } : a
      );
      updateAssetsState(updated);
      assignAssetApi(asset.id, null).catch(() => {});
    } else {
      setEditingAsset(asset);
      setShowAssetModal(true);
    }
  };

  const handleSaveEmployee = (empData: Partial<Employee>) => {
    if (editingEmployee) {
      unmarkEmployeeDeleted(editingEmployee.id);
      const updated = employees.map((e) =>
        e.id === editingEmployee.id ? ({ ...e, ...empData } as Employee) : e
      );
      updateEmployeesState(updated);
    } else {
      const generatedEmpId = empData.id || `EMP-${Math.floor(100 + Math.random() * 900)}`;
      unmarkEmployeeDeleted(generatedEmpId);
      const newEmp: Employee = {
        id: generatedEmpId,
        fullName: empData.fullName || 'New Employee',
        department: empData.department || 'General',
        title: empData.title || 'Staff',
        email: empData.email || 'employee@workplace.co',
        photoUrl: empData.photoUrl || '',
        joinedDate: new Date().toISOString().split('T')[0],
      };
      updateEmployeesState([newEmp, ...employees]);
    }
    setEditingEmployee(null);
  };

  const handleDeleteEmployeeConfirm = () => {
    if (!deletingEmployee) return;

    markEmployeeDeleted(deletingEmployee.id);

    const updatedEmployees = employees.filter((e) => e.id !== deletingEmployee.id);
    updateEmployeesState(updatedEmployees);

    const updatedAssets = assets.map((a) =>
      a.assignedToEmployeeId === deletingEmployee.id
        ? { ...a, status: 'Available' as const, assignedToEmployeeId: null }
        : a
    );
    updateAssetsState(updatedAssets);

    try {
      const url = new URL(window.location.href);
      if (
        url.searchParams.get('id') === deletingEmployee.id ||
        url.searchParams.get('profile') === deletingEmployee.id ||
        url.searchParams.get('employeeId') === deletingEmployee.id ||
        url.searchParams.get('emp') === deletingEmployee.id
      ) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch (e) {
      console.error('Error cleaning URL on employee delete', e);
    }

    if (publicProfileEmpId === deletingEmployee.id) {
      setPublicProfileEmpId(null);
    }

    if (selectedProfileEmpId === deletingEmployee.id) {
      setSelectedProfileEmpId(null);
      setActiveTab('employees');
    }

    setDeletingEmployee(null);
  };

  const handleQRScanSuccess = (scannedText: string) => {
    const extractedId = parseEmployeeIdFromScan(scannedText);

    if (!extractedId) {
      alert('This QR code does not contain a valid employee ID.');
      return;
    }

    // FIX: Always open exactly the employee that was scanned. The old code fell back to the
    // FIRST employee in the local list when the ID wasn't found locally (showing the wrong
    // person's assets) and did nothing at all when the local list was empty (a fresh phone).
    // The server lookup in the effect above decides whether the employee exists.
    const known = employees.find((e) => e.id.toLowerCase() === extractedId.toLowerCase());
    navigateToPublicProfile(known ? known.id : extractedId, 'push');
    setShowScannerModal(false);
  };

  const handleViewEmployeeProfile = (empId: string) => {
    if (authed) {
      setSelectedProfileEmpId(empId);
      setActiveTab('profile');
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('view', 'employee');
      url.searchParams.set('id', empId);
      window.history.pushState({}, '', url.toString());
      setPublicProfileEmpId(empId);
    }
  };

  if (publicProfileEmpId) {
    const scannerModal = (
      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleQRScanSuccess}
        employees={employees}
      />
    );

    const serverAudit =
      audit && audit.empId.toLowerCase() === publicProfileEmpId.toLowerCase() ? audit : null;

    // Still waiting for the server: show a spinner rather than stale or empty local data.
    if (!serverAudit && (auditStatus === 'idle' || auditStatus === 'loading')) {
      return (
        <PublicStatusScreen
          loading
          title="Loading assigned assets…"
          message={`Looking up ${publicProfileEmpId}.`}
        />
      );
    }

    // The server answered and there is no such employee.
    if (!serverAudit && auditStatus === 'not_found') {
      return (
        <>
          <PublicStatusScreen
            title="Employee not found"
            message={`No employee with ID "${publicProfileEmpId}" exists in the system. The QR code may be outdated.`}
            actionLabel="Scan another QR code"
            onAction={() => setShowScannerModal(true)}
            secondaryLabel="Go to login"
            onSecondary={leavePublicProfile}
          />
          {scannerModal}
        </>
      );
    }

    // Server unreachable: fall back to this device's saved copy, if it has one.
    let targetEmp: Employee | undefined = serverAudit?.employee;
    if (!targetEmp) {
      targetEmp =
        employees.find((e) => e.id.toLowerCase() === publicProfileEmpId.toLowerCase()) ||
        getStoredEmployees().find((e) => e.id.toLowerCase() === publicProfileEmpId.toLowerCase());
    }

    if (!targetEmp) {
      return (
        <>
          <PublicStatusScreen
            title="Can't reach the server"
            message="The assigned assets could not be loaded. Check your internet connection and try again."
            actionLabel="Try again"
            onAction={() => setAuditRetry((n) => n + 1)}
            secondaryLabel="Go to login"
            onSecondary={leavePublicProfile}
          />
          {scannerModal}
        </>
      );
    }

    const displayEmployee = targetEmp;
    const displayAssets: FFEAsset[] = serverAudit
      ? serverAudit.assignedAssets
      : assets.filter(
          (a) =>
            !!a.assignedToEmployeeId &&
            a.assignedToEmployeeId.trim().toLowerCase() === displayEmployee.id.trim().toLowerCase()
        );

    return (
      <>
        {!serverAudit && (
          <div className="bg-amber-500 text-slate-900 text-xs font-semibold text-center px-3 py-2">
            Couldn&apos;t reach the server. Showing data saved on this device, which may be out of date.
          </div>
        )}
        <PublicProfileView
          employee={displayEmployee}
          assignedAssets={displayAssets}
          employees={employees.length > 0 ? employees : [displayEmployee]}
          onSelectEmployee={(empId) => navigateToPublicProfile(empId, 'replace')}
          onGoToLogin={leavePublicProfile}
          onOpenScanner={() => setShowScannerModal(true)}
        />
        {scannerModal}
      </>
    );
  }

  if (!authed) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenPublicProfile={() => {
            const defaultId = employees[0]?.id || 'EMP-101';
            const url = new URL(window.location.href);
            url.searchParams.set('view', 'employee');
            url.searchParams.set('id', defaultId);
            window.history.pushState({}, '', url.toString());
            setPublicProfileEmpId(defaultId);
          }}
          onOpenPublicScanner={() => setShowScannerModal(true)}
        />
        <QRScannerModal
          isOpen={showScannerModal}
          onClose={() => setShowScannerModal(false)}
          onScanSuccess={handleQRScanSuccess}
          employees={employees}
        />
      </>
    );
  }

  const selectedEmployeeForProfile = employees.find(
    (e) => e.id === selectedProfileEmpId
  );

  return (
    <div
      className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans selection:bg-indigo-500 selection:text-white"
      style={{ backgroundImage: 'radial-gradient(at top left, #e0e7ff, #f1f5f9, #dcfce7)' }}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'profile') setSelectedProfileEmpId(null);
        }}
        onOpenPasswordModal={() => setShowPasswordModal(true)}
        onOpenScannerModal={() => setShowScannerModal(true)}
        onLogout={handleLogout}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DashboardOverview
            assets={assets}
            employees={employees}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenAddAsset={() => {
              setEditingAsset(null);
              setShowAssetModal(true);
            }}
            onOpenAddEmployee={() => {
              setEditingEmployee(null);
              setShowEmployeeModal(true);
            }}
            onOpenScanner={() => setShowScannerModal(true)}
            onViewEmployeeProfile={handleViewEmployeeProfile}
          />
        )}

        {activeTab === 'assets' && (
          <AssetList
            assets={assets}
            employees={employees}
            onOpenAddModal={() => {
              setEditingAsset(null);
              setShowAssetModal(true);
            }}
            onEditAsset={(asset) => {
              setEditingAsset(asset);
              setShowAssetModal(true);
            }}
            onDeleteAsset={(asset) => setDeletingAsset(asset)}
            onQuickToggleAssign={handleQuickToggleAssign}
            onViewEmployeeProfile={handleViewEmployeeProfile}
          />
        )}

        {activeTab === 'gallery' && (
          <PhotoGalleryView
            assets={assets}
            employees={employees}
            onEditAsset={(asset) => {
              setEditingAsset(asset);
              setShowAssetModal(true);
            }}
            onViewEmployeeProfile={handleViewEmployeeProfile}
          />
        )}

        {activeTab === 'employees' && (
          <EmployeeList
            employees={employees}
            assets={assets}
            onOpenAddModal={() => {
              setEditingEmployee(null);
              setShowEmployeeModal(true);
            }}
            onEditEmployee={(emp) => {
              setEditingEmployee(emp);
              setShowEmployeeModal(true);
            }}
            onDeleteEmployee={(emp) => setDeletingEmployee(emp)}
            onShowQRModal={(emp) => setSelectedQREmployee(emp)}
            onViewEmployeeProfile={handleViewEmployeeProfile}
          />
        )}

        {activeTab === 'qrcodes' && (
          <QRCodeManager
            employees={employees}
            assets={assets}
            onViewPublicProfile={(empId) => {
              const url = new URL(window.location.href);
              url.searchParams.set('view', 'employee');
              url.searchParams.set('id', empId);
              window.history.pushState({}, '', url.toString());
              setPublicProfileEmpId(empId);
            }}
            onOpenScanner={() => setShowScannerModal(true)}
            onSelectEmployeeForProfile={handleViewEmployeeProfile}
          />
        )}

        {activeTab === 'profile' && selectedEmployeeForProfile && (
          <EmployeeProfileView
            employee={selectedEmployeeForProfile}
            assignedAssets={assets.filter(
              (a) => a.status === 'Assigned' && a.assignedToEmployeeId === selectedEmployeeForProfile.id
            )}
            allAssets={assets}
            onBackToDirectory={() => setActiveTab('employees')}
            onUnassignAsset={(asset) => {
              const updated = assets.map((a) =>
                a.id === asset.id
                  ? { ...a, status: 'Available' as const, assignedToEmployeeId: null }
                  : a
              );
              updateAssetsState(updated);
              assignAssetApi(asset.id, null).catch(() => {});
            }}
            onAssignAssetToEmployee={(assetId, empId) => {
              const updated = assets.map((a) =>
                a.id === assetId
                  ? { ...a, status: 'Assigned' as const, assignedToEmployeeId: empId }
                  : a
              );
              updateAssetsState(updated);
              assignAssetApi(assetId, empId).catch(() => {});
            }}
            onShowQRModal={(emp) => setSelectedQREmployee(emp)}
          />
        )}
      </main>

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
      />

      <AssetModal
        isOpen={showAssetModal}
        onClose={() => {
          setShowAssetModal(false);
          setEditingAsset(null);
        }}
        onSave={handleSaveAsset}
        assetToEdit={editingAsset}
        employees={employees}
      />

      <EmployeeModal
        isOpen={showEmployeeModal}
        onClose={() => {
          setShowEmployeeModal(false);
          setEditingEmployee(null);
        }}
        onSave={handleSaveEmployee}
        employeeToEdit={editingEmployee}
      />

      <EmployeeDeleteConfirmModal
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteEmployeeConfirm}
        employee={deletingEmployee}
        assignedAssetsCount={
          deletingEmployee
            ? assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === deletingEmployee.id).length
            : 0
        }
      />

      {deletingAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white/80 backdrop-blur-2xl border border-white/60 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-slate-800">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Delete FFE Asset?</h3>
            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Are you sure you want to remove <strong>{deletingAsset.name}</strong> ({deletingAsset.id}) from inventory?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeletingAsset(null)}
                className="px-4 py-2 bg-white/60 hover:bg-white/90 text-slate-700 text-xs font-semibold rounded-xl border border-white/80 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAssetConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-lg shadow-rose-500/20 transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}

      <QRCodeModal
        isOpen={!!selectedQREmployee}
        onClose={() => setSelectedQREmployee(null)}
        employee={selectedQREmployee}
        assignedAssets={
          selectedQREmployee
            ? assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === selectedQREmployee.id)
            : []
        }
        onViewProfile={(empId) => handleViewEmployeeProfile(empId)}
      />

      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScanSuccess={handleQRScanSuccess}
        employees={employees}
      />
    </div>
  );
}