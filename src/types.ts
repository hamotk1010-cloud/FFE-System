export type AssetCategory = 'Furniture' | 'Fixture' | 'Equipment';

export type AssetStatus = 'Available' | 'Assigned' | 'Maintenance' | 'Retired';

export interface FFEAsset {
  id: string; // e.g., AST-1001
  tagNumber?: string; // Physical Asset Tag / Barcode Tag Number (e.g., TAG-2024-001)
  name: string;
  category: AssetCategory;
  serialNumber: string;
  status: AssetStatus;
  location: string;
  assignedToEmployeeId?: string | null; // Employee ID if assigned
  photoUrl: string; // Direct link or Google Drive link
  dateAdded: string; // YYYY-MM-DD
  purchaseCost?: number;
  notes?: string;
}

export interface Employee {
  id: string; // e.g., EMP-101
  fullName: string;
  department: string;
  title: string;
  email: string;
  photoUrl: string; // Google Drive profile picture link or standard photo URL
  joinedDate: string;
}

export interface AdminUser {
  username: string;
  passwordHash: string; // Simple encoded password string stored in localStorage
  lastLogin?: string;
}

export type ActiveTab = 'overview' | 'assets' | 'gallery' | 'employees' | 'qrcodes' | 'profile' | 'scanner';
