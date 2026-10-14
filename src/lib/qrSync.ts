import { Employee, FFEAsset } from '../types';
import { getStoredAssets, getStoredEmployees, getDeletedEmployeeIds } from './storage';

/**
 * Base URL that gets encoded into printed QR codes.
 *
 * FIX: The original code used window.location.href. If an admin generated the QR codes while
 * on http://localhost:3000 (or an editor preview URL), the printed codes pointed to an address
 * that a phone cannot open. Set VITE_APP_URL to your deployed public URL (for example
 * https://ffe.yourcompany.com) and QR codes will always use it, whatever device generated them.
 */
export function getPublicBaseUrl(): string {
  const configured = ((import.meta as any).env?.VITE_APP_URL as string | undefined)?.trim();
  if (configured && !configured.startsWith('MY_')) {
    return configured.replace(/\/+$/, '') + '/';
  }
  // Fallback: current origin (works when you generate QR codes from the deployed site itself).
  return `${window.location.origin}/`;
}

/**
 * Permanent QR Code URL containing ONLY the employee ID.
 * The scanned page asks the server which assets are assigned right now, so a printed QR code
 * never goes stale when assignments change.
 */
export function getFixedEmployeeQRUrl(employeeId: string): string {
  try {
    const url = new URL(getPublicBaseUrl());
    url.searchParams.set('view', 'employee');
    url.searchParams.set('id', employeeId);
    return url.toString();
  } catch (e) {
    return `${getPublicBaseUrl()}?view=employee&id=${encodeURIComponent(employeeId)}`;
  }
}

/**
 * Kept for backwards compatibility with existing callers.
 *
 * FIX: It no longer embeds an `assigned=` list. That list went stale as soon as an asset was
 * reassigned, and scanning an old QR code would overwrite (unassign) current assignments.
 */
export function generateDynamicEmployeeQRUrl(
  employee: Employee,
  _assignedAssets?: FFEAsset[]
): string {
  return getFixedEmployeeQRUrl(employee.id);
}

/**
 * Pulls an employee ID out of whatever a QR scanner returned: a full URL, a bare query string
 * ("?profile=EMP-101"), a path ("/employee/EMP-101"), or just the ID ("EMP-101").
 */
export function parseEmployeeIdFromScan(scannedText: string): string | null {
  const text = (scannedText || '').trim();
  if (!text) return null;

  const qIndex = text.indexOf('?');
  if (qIndex !== -1) {
    const params = new URLSearchParams(text.substring(qIndex).split('#')[0]);
    const fromQuery =
      params.get('id') ||
      params.get('profile') ||
      params.get('employeeId') ||
      params.get('emp') ||
      params.get('scan');
    if (fromQuery && fromQuery.trim()) return fromQuery.trim();
  }

  const pathMatch = text.match(/(?:profile|employee|emp)\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch && pathMatch[1]) return pathMatch[1];

  const empMatch = text.match(/(EMP-\d+)/i);
  if (empMatch && empMatch[1]) return empMatch[1];

  // A bare ID with no URL characters in it.
  if (/^[a-zA-Z0-9_-]+$/.test(text)) return text;

  return null;
}

/**
 * Reads the employee ID from the URL on page load / back-forward navigation.
 *
 * FIX: This used to rewrite local asset assignments from the `assigned=` URL parameter and push
 * the result to the database. It is now read-only: the server is the single source of truth for
 * who has which asset, so scanning a QR code can never change data.
 */
export function syncFromUrlParams(searchStr: string = window.location.search): {
  empId: string | null;
  syncedAssets?: FFEAsset[];
  syncedEmployees?: Employee[];
} {
  try {
    const searchParams = new URLSearchParams(searchStr);

    const empId =
      searchParams.get('id') ||
      searchParams.get('profile') ||
      searchParams.get('employeeId') ||
      searchParams.get('emp') ||
      null;

    const deletedEmployeeSet = new Set(getDeletedEmployeeIds().map((id) => id.toLowerCase()));

    if (!empId || deletedEmployeeSet.has(empId.toLowerCase())) {
      return {
        empId: null,
        syncedAssets: getStoredAssets(),
        syncedEmployees: getStoredEmployees(),
      };
    }

    return {
      empId,
      syncedAssets: getStoredAssets(),
      syncedEmployees: getStoredEmployees(),
    };
  } catch (e) {
    console.error('Error reading URL parameters', e);
    return { empId: null };
  }
}
