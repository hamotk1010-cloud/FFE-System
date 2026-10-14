import { Employee, FFEAsset } from '../types';

export interface AppDataResponse {
  employees: Employee[];
  assets: FFEAsset[];
  deletedEmployeeIds?: string[];
  deletedAssetIds?: string[];
}

export async function fetchAppData(): Promise<AppDataResponse | null> {
  try {
    const res = await fetch('/api/data');
    if (!res.ok) {
      throw new Error(`Failed to fetch app data: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not fetch data from server, falling back to local store', err);
    return null;
  }
}

export type EmployeeAuditResult =
  | { status: 'ok'; employee: Employee; assignedAssets: FFEAsset[] }
  | { status: 'not_found' }
  | { status: 'error' };

/**
 * Used by the public QR profile page. Asks the server (the single source of truth) for the
 * employee and their assigned assets, and distinguishes "employee doesn't exist" (404)
 * from "server unreachable / database error".
 */
export async function fetchEmployeeAudit(employeeId: string): Promise<EmployeeAuditResult> {
  try {
    const res = await fetch(`/api/employee/${encodeURIComponent(employeeId)}`, { cache: 'no-store' });
    if (res.status === 404) {
      return { status: 'not_found' };
    }
    if (!res.ok) {
      throw new Error(`Failed to fetch employee audit: ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    return {
      status: 'ok',
      employee: data.employee,
      assignedAssets: Array.isArray(data.assignedAssets) ? data.assignedAssets : [],
    };
  } catch (err) {
    console.warn('[API] Could not fetch employee audit from server', err);
    return { status: 'error' };
  }
}

export async function saveAssetsApi(assets: FFEAsset[]): Promise<FFEAsset[] | null> {
  try {
    const res = await fetch('/api/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assets }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save assets: ${res.statusText}`);
    }
    const data = await res.json();
    return data.assets;
  } catch (err) {
    console.warn('[API] Could not save assets to server', err);
    return null;
  }
}

export async function saveEmployeesApi(employees: Employee[]): Promise<Employee[] | null> {
  try {
    const res = await fetch('/api/employees', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employees }),
    });
    if (!res.ok) {
      throw new Error(`Failed to save employees: ${res.statusText}`);
    }
    const data = await res.json();
    return data.employees;
  } catch (err) {
    console.warn('[API] Could not save employees to server', err);
    return null;
  }
}

export async function assignAssetApi(assetId: string, employeeId: string | null): Promise<FFEAsset[] | null> {
  try {
    const res = await fetch('/api/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId, employeeId }),
    });
    if (!res.ok) {
      throw new Error(`Failed to assign asset: ${res.statusText}`);
    }
    const data = await res.json();
    return data.assets;
  } catch (err) {
    console.warn('[API] Could not assign asset on server', err);
    return null;
  }
}

export async function syncAppDataApi(payload: {
  employees?: Employee[];
  assets?: FFEAsset[];
  deletedEmployeeIds?: string[];
  deletedAssetIds?: string[];
}): Promise<AppDataResponse | null> {
  try {
    const res = await fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(`Failed to sync app data: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('[API] Could not sync app data with server', err);
    return null;
  }
}
