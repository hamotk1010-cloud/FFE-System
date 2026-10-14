import { DEFAULT_ADMIN } from '../data/initialData';
import { Employee, FFEAsset } from '../types';
import { saveAssetsApi, saveEmployeesApi } from './api';

const STORAGE_KEYS = {
  ADMIN_PASSWORD: 'ffe_admin_password',
  AUTH_SESSION: 'ffe_auth_session',
  EMPLOYEES: 'ffe_employees_v1',
  ASSETS: 'ffe_assets_v1',
  DELETED_EMPLOYEES: 'ffe_deleted_employees_v1',
  DELETED_ASSETS: 'ffe_deleted_assets_v1',
};

// Tombstone Management for permanent deletion
export function getDeletedEmployeeIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_EMPLOYEES);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading deleted employees tombstone', e);
  }
  return [];
}

export function markEmployeeDeleted(id: string): void {
  try {
    const deleted = getDeletedEmployeeIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_EMPLOYEES, JSON.stringify(deleted));
    }
  } catch (e) {
    console.error('Error marking employee deleted', e);
  }
}

export function unmarkEmployeeDeleted(id: string): void {
  try {
    const deleted = getDeletedEmployeeIds();
    const filtered = deleted.filter((dId) => dId.toLowerCase() !== id.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.DELETED_EMPLOYEES, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error unmarking employee deleted', e);
  }
}

export function getDeletedAssetIds(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DELETED_ASSETS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading deleted assets tombstone', e);
  }
  return [];
}

export function markAssetDeleted(id: string): void {
  try {
    const deleted = getDeletedAssetIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
      localStorage.setItem(STORAGE_KEYS.DELETED_ASSETS, JSON.stringify(deleted));
    }
  } catch (e) {
    console.error('Error marking asset deleted', e);
  }
}

export function unmarkAssetDeleted(id: string): void {
  try {
    const deleted = getDeletedAssetIds();
    const filtered = deleted.filter((dId) => dId.toLowerCase() !== id.toLowerCase());
    localStorage.setItem(STORAGE_KEYS.DELETED_ASSETS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error unmarking asset deleted', e);
  }
}

export function clearDeletedTombstones(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.DELETED_EMPLOYEES);
    localStorage.removeItem(STORAGE_KEYS.DELETED_ASSETS);
  } catch (e) {
    console.error('Error clearing deleted tombstones', e);
  }
}

// Admin Password Management
export function getAdminPassword(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD);
    return saved || DEFAULT_ADMIN.password;
  } catch (e) {
    return DEFAULT_ADMIN.password;
  }
}

export function setAdminPassword(newPassword: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, newPassword);
  } catch (e) {
    console.error('Failed to save admin password', e);
  }
}

// Authentication Session
export function isAuthenticated(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
  } catch (e) {
    return false;
  }
}

export function setAuthenticated(status: boolean): void {
  try {
    if (status) {
      sessionStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    }
  } catch (e) {
    console.error('Failed to update session auth', e);
  }
}

// Employees Data (Returns empty array instead of fallback sample data)
export function getStoredEmployees(): Employee[] {
  const deletedSet = new Set(getDeletedEmployeeIds().map((id) => id.toLowerCase()));

  try {
    const data = localStorage.getItem(STORAGE_KEYS.EMPLOYEES);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter((emp) => !deletedSet.has(emp.id.toLowerCase()));
      }
    }
  } catch (e) {
    console.error('Error reading stored employees', e);
  }

  return [];
}

export function setStoredEmployees(employees: Employee[]): void {
  try {
    const deletedSet = new Set(getDeletedEmployeeIds().map((id) => id.toLowerCase()));
    const filtered = employees.filter((emp) => !deletedSet.has(emp.id.toLowerCase()));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
    saveEmployeesApi(filtered).catch(() => {});
  } catch (e) {
    console.error('Error saving employees', e);
  }
}

// Assets Data
export function sanitizeAssets(assets: FFEAsset[]): FFEAsset[] {
  // Simply return assets as-is to preserve valid employee assignments on public views
  return assets.map((a) => {
    return {
      ...a,
      status: a.status || 'Available',
      assignedToEmployeeId: a.assignedToEmployeeId || null,
    };
  });
}

export function getStoredAssets(): FFEAsset[] {
  const deletedSet = new Set(getDeletedAssetIds().map((id) => id.toLowerCase()));

  try {
    const data = localStorage.getItem(STORAGE_KEYS.ASSETS);
    if (data !== null) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((asset) => !deletedSet.has(asset.id.toLowerCase()));
        return sanitizeAssets(filtered);
      }
    }
  } catch (e) {
    console.error('Error reading stored assets', e);
  }

  return [];
}

export function setStoredAssets(assets: FFEAsset[]): void {
  try {
    const deletedSet = new Set(getDeletedAssetIds().map((id) => id.toLowerCase()));
    const filtered = assets.filter((asset) => !deletedSet.has(asset.id.toLowerCase()));
    const cleanAssets = sanitizeAssets(filtered);
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(cleanAssets));
    saveAssetsApi(cleanAssets).catch(() => {});
  } catch (e) {
    console.error('Error saving assets', e);
  }
}

// Cache-only writers.
// FIX: Data that was just downloaded FROM the server must not be uploaded straight back to it.
// Previously every poll/scan called setStoredAssets/setStoredEmployees, which POSTed the full
// list to /api/assets and /api/employees. That meant a phone viewing a profile could overwrite
// the database with its own (possibly stale) copy. Use these when the server is the source.
export function cacheEmployeesLocally(employees: Employee[]): void {
  try {
    const deletedSet = new Set(getDeletedEmployeeIds().map((id) => id.toLowerCase()));
    const filtered = employees.filter((emp) => !deletedSet.has(emp.id.toLowerCase()));
    localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify(filtered));
  } catch (e) {
    console.error('Error caching employees', e);
  }
}

export function cacheAssetsLocally(assets: FFEAsset[]): void {
  try {
    const deletedSet = new Set(getDeletedAssetIds().map((id) => id.toLowerCase()));
    const filtered = assets.filter((asset) => !deletedSet.has(asset.id.toLowerCase()));
    localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify(sanitizeAssets(filtered)));
  } catch (e) {
    console.error('Error caching assets', e);
  }
}

// Reset Data (Now clears to empty instead of sample data)
export function resetToDefaults(): void {
  clearDeletedTombstones();
  localStorage.setItem(STORAGE_KEYS.EMPLOYEES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ASSETS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, DEFAULT_ADMIN.password);
}