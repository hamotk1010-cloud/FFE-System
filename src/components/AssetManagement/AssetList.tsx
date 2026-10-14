import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Box,
  Filter,
  Grid,
  List as ListIcon,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  ExternalLink,
  Tag,
  MapPin,
  Barcode,
  Armchair,
  Tv,
  Lamp,
  FileDown
} from 'lucide-react';
import { AssetCategory, AssetStatus, Employee, FFEAsset } from '../../types';
import { formatCurrency, formatGoogleDriveUrl, getFallbackAssetImageUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { exportAssetsToPdf } from '../../lib/pdfExport';

interface AssetListProps {
  assets: FFEAsset[];
  employees: Employee[];
  onOpenAddModal: () => void;
  onEditAsset: (asset: FFEAsset) => void;
  onDeleteAsset: (asset: FFEAsset) => void;
  onQuickToggleAssign: (asset: FFEAsset) => void;
  onViewEmployeeProfile: (employeeId: string) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  assets,
  employees,
  onOpenAddModal,
  onEditAsset,
  onDeleteAsset,
  onQuickToggleAssign,
  onViewEmployeeProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');

  // Filter & Search Logic
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const assignedEmp = asset.status === 'Assigned' && asset.assignedToEmployeeId
        ? employees.find((e) => e.id === asset.assignedToEmployeeId)
        : null;
      const searchLower = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !searchLower ||
        asset.name.toLowerCase().includes(searchLower) ||
        asset.id.toLowerCase().includes(searchLower) ||
        (asset.tagNumber && asset.tagNumber.toLowerCase().includes(searchLower)) ||
        asset.serialNumber.toLowerCase().includes(searchLower) ||
        asset.location.toLowerCase().includes(searchLower) ||
        (assignedEmp && assignedEmp.fullName.toLowerCase().includes(searchLower));

      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [assets, employees, searchTerm, categoryFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-white/60 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Master FFE Inventory</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
              {filteredAssets.length} Items
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Furniture, Fixtures, and Technical Equipment workplace directory
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => exportAssetsToPdf(filteredAssets, employees, categoryFilter !== 'ALL' || statusFilter !== 'ALL' || searchTerm ? 'Filtered Selection' : undefined)}
            className="px-4 py-2.5 bg-white/80 hover:bg-white text-slate-700 hover:text-indigo-600 border border-slate-200/80 text-xs font-semibold rounded-full shadow-sm flex items-center justify-center gap-2 transition-all shrink-0"
            title="Export professional PDF report"
          >
            <FileDown className="w-4 h-4 text-indigo-600" />
            <span>Export FFE Report (PDF)</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add New FFE Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Asset ID, Tag Number, Name, Serial Number, Location, or Employee..."
              className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 pl-10 pr-4 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-white/60 p-1 rounded-2xl border border-white/80 self-end lg:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl text-xs font-medium transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category & Status Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/30 text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-slate-400" /> Category:
            </span>
            {['ALL', 'Furniture', 'Fixture', 'Equipment'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  categoryFilter === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/50 text-slate-600 hover:bg-white/80 border border-white/60'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-slate-500 font-semibold mr-1">Status:</span>
            {['ALL', 'Available', 'Assigned', 'Maintenance', 'Retired'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white/50 text-slate-600 hover:bg-white/80 border border-white/60'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Asset Display */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-12 text-center text-slate-500 shadow-sm">
          <Box className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800">No FFE items match your search</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting category or status filters</p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50/40 text-slate-500 text-[10px] uppercase font-bold sticky top-0 backdrop-blur-md border-b border-white/20">
                <tr>
                  <th className="py-3.5 px-6">Asset Details</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Location</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned Custodian</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/20">
                {filteredAssets.map((asset) => {
                  const assignedEmp = asset.status === 'Assigned' && asset.assignedToEmployeeId
                    ? employees.find((e) => e.id === asset.assignedToEmployeeId)
                    : null;
                  const imageSrc = formatGoogleDriveUrl(asset.photoUrl) || getFallbackAssetImageUrl(asset.category);

                  return (
                    <tr key={asset.id} className="hover:bg-white/50 transition-colors group">
                      {/* Asset Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={imageSrc}
                            alt={asset.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(asset.category);
                            }}
                            className="w-12 h-12 rounded-2xl object-cover bg-white border border-white/80 shrink-0 shadow-sm"
                          />
                          <div>
                            <p className="font-bold text-slate-900 text-sm">{asset.name}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 font-mono flex-wrap">
                              <span className="text-indigo-600 font-bold">{asset.id}</span>
                              {asset.tagNumber && (
                                <>
                                  <span>•</span>
                                  <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded text-[10px] font-bold">
                                    <Tag className="w-2.5 h-2.5 text-indigo-500" />
                                    Tag: {asset.tagNumber}
                                  </span>
                                </>
                              )}
                              <span>•</span>
                              <span>S/N: {asset.serialNumber}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
                            asset.category === 'Furniture'
                              ? 'bg-amber-100 text-amber-700'
                              : asset.category === 'Fixture'
                              ? 'bg-sky-100 text-sky-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}
                        >
                          {asset.category === 'Furniture' && <Armchair className="w-3 h-3" />}
                          {asset.category === 'Fixture' && <Lamp className="w-3 h-3" />}
                          {asset.category === 'Equipment' && <Tv className="w-3 h-3" />}
                          {asset.category}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5 text-slate-600 font-medium max-w-[180px] truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{asset.location}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                            asset.status === 'Assigned'
                              ? 'bg-indigo-100 text-indigo-700'
                              : asset.status === 'Available'
                              ? 'bg-emerald-100 text-emerald-700'
                              : asset.status === 'Maintenance'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {asset.status}
                        </span>
                      </td>

                      {/* Assigned Employee */}
                      <td className="py-4 px-6">
                        {assignedEmp ? (
                          <button
                            onClick={() => onViewEmployeeProfile(assignedEmp.id)}
                            className="flex items-center gap-2 p-1.5 bg-white/60 hover:bg-white/90 rounded-2xl border border-white/80 text-slate-800 transition-colors text-left shadow-sm"
                          >
                            <img
                              src={formatGoogleDriveUrl(assignedEmp.photoUrl) || getFallbackAvatarUrl(assignedEmp.fullName)}
                              alt={assignedEmp.fullName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(assignedEmp.fullName);
                              }}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                            <div className="truncate max-w-[130px]">
                              <p className="font-bold text-xs text-slate-900 truncate">{assignedEmp.fullName}</p>
                              <p className="text-[10px] text-slate-400 truncate">{assignedEmp.id}</p>
                            </div>
                            <ExternalLink className="w-3 h-3 text-indigo-600 shrink-0 ml-1" />
                          </button>
                        ) : (
                          <span className="text-slate-400 italic text-xs">Unassigned</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onQuickToggleAssign(asset)}
                            className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                              asset.status === 'Assigned'
                                ? 'bg-white/60 border-white/80 text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700 border-indigo-600 shadow-sm'
                            }`}
                            title={asset.status === 'Assigned' ? 'Unassign Item' : 'Assign to Staff'}
                          >
                            {asset.status === 'Assigned' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>

                          <button
                            onClick={() => onEditAsset(asset)}
                            className="p-2 bg-white/60 hover:bg-white/90 border border-white/80 text-slate-700 rounded-xl transition-colors shadow-sm"
                            title="Edit Asset"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onDeleteAsset(asset)}
                            className="p-2 bg-white/60 hover:bg-rose-50 border border-white/80 hover:border-rose-200 text-slate-400 hover:text-rose-600 rounded-xl transition-colors shadow-sm"
                            title="Delete / Retire Asset"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => {
            const assignedEmp = asset.status === 'Assigned' && asset.assignedToEmployeeId
              ? employees.find((e) => e.id === asset.assignedToEmployeeId)
              : null;
            const imageSrc = formatGoogleDriveUrl(asset.photoUrl) || getFallbackAssetImageUrl(asset.category);

            return (
              <div
                key={asset.id}
                className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 overflow-hidden shadow-sm hover:bg-white/60 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Image Banner */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={imageSrc}
                      alt={asset.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(asset.category);
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-white/80 backdrop-blur-md text-slate-900 border border-white/80 shadow-sm">
                        {asset.id}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                          asset.status === 'Assigned'
                            ? 'bg-indigo-600 text-white'
                            : asset.status === 'Available'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-600 text-white'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">{asset.category}</span>
                      <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-1">{asset.name}</h3>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                      {asset.tagNumber && (
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-indigo-700 font-bold">
                          <Tag className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span className="truncate">Tag: {asset.tagNumber}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-500">
                        <Barcode className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">S/N: {asset.serialNumber}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{asset.location}</span>
                      </div>
                    </div>

                    {/* Custodian Badge */}
                    <div className="pt-3 border-t border-white/30">
                      {assignedEmp ? (
                        <div
                          onClick={() => onViewEmployeeProfile(assignedEmp.id)}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white/60 border border-white/80 cursor-pointer hover:bg-white/90 transition-colors shadow-sm"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={formatGoogleDriveUrl(assignedEmp.photoUrl) || getFallbackAvatarUrl(assignedEmp.fullName)}
                              alt={assignedEmp.fullName}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(assignedEmp.fullName);
                              }}
                              className="w-7 h-7 rounded-full object-cover shrink-0"
                            />
                            <div>
                              <p className="text-xs font-bold text-slate-900 leading-none">{assignedEmp.fullName}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">{assignedEmp.department}</p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-2xl bg-white/30 text-center text-slate-400 text-xs italic border border-white/40">
                          Unassigned (Available)
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-white/20 border-t border-white/30 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onQuickToggleAssign(asset)}
                    className="flex-1 py-2 bg-white/60 hover:bg-white/90 text-slate-800 text-xs font-semibold rounded-xl border border-white/80 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {asset.status === 'Assigned' ? (
                      <>
                        <UserX className="w-3.5 h-3.5 text-amber-600" />
                        <span>Unassign</span>
                      </>
                    ) : (
                      <>
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Assign</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onEditAsset(asset)}
                    className="p-2 bg-white/60 hover:bg-white/90 text-slate-700 rounded-xl border border-white/80 transition-colors shadow-sm"
                    title="Edit Item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteAsset(asset)}
                    className="p-2 bg-white/60 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl border border-white/80 transition-colors shadow-sm"
                    title="Delete Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
