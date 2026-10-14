import React, { useState } from 'react';
import {
  Image,
  Search,
  Filter,
  MapPin,
  User,
  Armchair,
  Lamp,
  Tv,
  X,
  ExternalLink,
  Tag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Building
} from 'lucide-react';
import { FFEAsset, Employee, AssetCategory, AssetStatus } from '../../types';
import { formatGoogleDriveUrl, getFallbackAssetImageUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';

interface PhotoGalleryViewProps {
  assets: FFEAsset[];
  employees: Employee[];
  onEditAsset: (asset: FFEAsset) => void;
  onViewEmployeeProfile?: (empId: string) => void;
}

export const PhotoGalleryView: React.FC<PhotoGalleryViewProps> = ({
  assets,
  employees,
  onEditAsset,
  onViewEmployeeProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedAssetForPreview, setSelectedAssetForPreview] = useState<FFEAsset | null>(null);

  const getAssignedEmployee = (assetOrEmployeeId?: string | null, status?: string) => {
    if (status && status !== 'Assigned') return null;
    if (!assetOrEmployeeId) return null;
    return employees.find((emp) => emp.id === assetOrEmployeeId) || null;
  };

  const filteredAssets = assets.filter((asset) => {
    const assignedEmp = asset.status === 'Assigned' && asset.assignedToEmployeeId
      ? employees.find((emp) => emp.id === asset.assignedToEmployeeId)
      : null;
    const matchesSearch =
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (asset.tagNumber && asset.tagNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (assignedEmp && assignedEmp.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'All' || asset.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Gallery Header Banner */}
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-2.5 bg-indigo-100 text-indigo-700 rounded-2xl">
              <Image className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Workplace FFE Photo Gallery</h1>
          </div>
          <p className="text-xs text-slate-500 font-medium max-w-xl">
            Visual photo grid of all workplace furniture, fixtures, and technical equipment photos across offices and departments.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-2xl border border-white/80 shadow-xs">
          <Tag className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800">
            Showing {filteredAssets.length} of {assets.length} Assets
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-4 border border-white/60 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search photos by asset name, ID, location, or assigned staff..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/60 border border-white/80 rounded-2xl py-2 pl-10 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 placeholder-slate-400 shadow-sm"
          />
        </div>

        {/* Category & Status Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white/60 border border-white/80 rounded-2xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="All">All Categories</option>
            <option value="Furniture">Furniture</option>
            <option value="Fixture">Fixture</option>
            <option value="Equipment">Equipment</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white/60 border border-white/80 rounded-2xl py-2 px-3 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Photo Grid */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white/40 backdrop-blur-md rounded-3xl p-12 text-center border border-white/60 text-slate-500 space-y-3">
          <Image className="w-12 h-12 mx-auto text-slate-400" />
          <p className="text-base font-bold text-slate-800">No FFE asset photos match your criteria</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try resetting your search query or category filters to view asset imagery.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredAssets.map((asset) => {
            const assignedEmp = getAssignedEmployee(asset.assignedToEmployeeId, asset.status);
            const imageSrc = formatGoogleDriveUrl(asset.photoUrl) || getFallbackAssetImageUrl(asset.category);

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetForPreview(asset)}
                className="group bg-white/60 hover:bg-white/90 border border-white/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Photo Aspect Ratio Box */}
                <div className="relative h-48 bg-slate-100 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={asset.name}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(asset.category);
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className="font-mono text-[10px] font-extrabold bg-slate-900/80 text-white backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm">
                      {asset.id}
                    </span>

                    {/* Status Pill */}
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
                        asset.status === 'Assigned'
                          ? 'bg-blue-500/90 text-white border-blue-400'
                          : asset.status === 'Available'
                          ? 'bg-emerald-500/90 text-white border-emerald-400'
                          : asset.status === 'Maintenance'
                          ? 'bg-amber-500/90 text-white border-amber-400'
                          : 'bg-slate-700/90 text-white border-slate-600'
                      }`}
                    >
                      {asset.status}
                    </span>
                  </div>

                  {/* Overlay Quick Preview Hint */}
                  <div className="absolute inset-0 bg-indigo-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <span className="bg-white/90 text-slate-900 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Quick View Photo</span>
                    </span>
                  </div>
                </div>

                {/* Asset Metadata Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {asset.category === 'Furniture' && <Armchair className="w-3.5 h-3.5 text-amber-600" />}
                      {asset.category === 'Fixture' && <Lamp className="w-3.5 h-3.5 text-sky-600" />}
                      {asset.category === 'Equipment' && <Tv className="w-3.5 h-3.5 text-indigo-600" />}
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        {asset.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {asset.name}
                    </h3>

                    <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500 font-medium">
                      {asset.tagNumber && (
                        <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5 text-indigo-600" />
                          {asset.tagNumber}
                        </span>
                      )}
                      <p className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{asset.location}</span>
                      </p>
                    </div>
                  </div>

                  {/* Assigned User Footer */}
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    {assignedEmp ? (
                      <div className="flex items-center gap-2 truncate">
                        <img
                          src={formatGoogleDriveUrl(assignedEmp.photoUrl) || getFallbackAvatarUrl(assignedEmp.fullName)}
                          alt={assignedEmp.fullName}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getFallbackAvatarUrl(assignedEmp.fullName);
                          }}
                          className="w-5 h-5 rounded-full object-cover shrink-0"
                        />
                        <span className="font-semibold text-slate-700 truncate text-[11px]">{assignedEmp.fullName}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-medium italic">Unassigned Asset</span>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditAsset(asset);
                      }}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick View Photo Modal */}
      {selectedAssetForPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white/40 backdrop-blur-xl border border-white/70 rounded-3xl w-full max-w-2xl p-6 shadow-2xl relative text-slate-800 my-8">
            <button
              onClick={() => setSelectedAssetForPreview(null)}
              className="absolute right-5 top-5 text-slate-400 hover:text-slate-800 p-2 rounded-full hover:bg-white/60 transition-colors z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-mono text-xs font-bold rounded-full">
                  {selectedAssetForPreview.id}
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
                  {selectedAssetForPreview.category}
                </span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {selectedAssetForPreview.status}
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">{selectedAssetForPreview.name}</h2>
                <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Workplace Location: {selectedAssetForPreview.location}</span>
                </p>
              </div>

              {/* Large Image Preview */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/80 max-h-[380px] flex items-center justify-center shadow-md">
                <img
                  src={
                    formatGoogleDriveUrl(selectedAssetForPreview.photoUrl) ||
                    getFallbackAssetImageUrl(selectedAssetForPreview.category)
                  }
                  alt={selectedAssetForPreview.name}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackAssetImageUrl(
                      selectedAssetForPreview.category
                    );
                  }}
                  className="w-full max-h-[380px] object-contain bg-slate-950"
                />
              </div>

              {/* Detailed Specs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/60 p-4 rounded-2xl border border-white/80 text-xs">
                {selectedAssetForPreview.tagNumber && (
                  <div>
                    <p className="text-slate-400 font-medium text-[10px] uppercase">Tag Number</p>
                    <p className="font-mono font-bold text-indigo-700 mt-0.5">
                      {selectedAssetForPreview.tagNumber}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-slate-400 font-medium text-[10px] uppercase">Serial Number</p>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">
                    {selectedAssetForPreview.serialNumber || 'N/A'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium text-[10px] uppercase">Assigned Staff</p>
                  <p className="font-bold text-slate-800 mt-0.5">
                    {getAssignedEmployee(selectedAssetForPreview.assignedToEmployeeId, selectedAssetForPreview.status)?.fullName || 'Unassigned'}
                  </p>
                </div>

                <div>
                  <p className="text-slate-400 font-medium text-[10px] uppercase">Date Registered</p>
                  <p className="font-bold text-slate-800 mt-0.5">{selectedAssetForPreview.dateAdded}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    const currentAsset = selectedAssetForPreview;
                    setSelectedAssetForPreview(null);
                    onEditAsset(currentAsset);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-lg shadow-indigo-200 transition-all"
                >
                  Edit Asset Record
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
