import React, { useState, useEffect } from 'react';
import {
  QrCode,
  Download,
  Printer,
  Copy,
  Check,
  ExternalLink,
  Search,
  Box,
  User,
  ScanLine,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import QRCode from 'qrcode';
import { Employee, FFEAsset } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { getFixedEmployeeQRUrl } from '../../lib/qrSync';

interface QRCodeManagerProps {
  employees: Employee[];
  assets: FFEAsset[];
  onViewPublicProfile: (empId: string) => void;
  onOpenScanner: () => void;
  onSelectEmployeeForProfile: (empId: string) => void;
}

interface EmployeeQRItem {
  employee: Employee;
  assignedCount: number;
  qrDataUrl: string;
  publicUrl: string;
}

export const QRCodeManager: React.FC<QRCodeManagerProps> = ({
  employees,
  assets,
  onViewPublicProfile,
  onOpenScanner,
  onSelectEmployeeForProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [qrItems, setQrItems] = useState<EmployeeQRItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  useEffect(() => {
    let isMounted = true;
    setIsGenerating(true);

    const generateAllQRs = async () => {
      const results: EmployeeQRItem[] = await Promise.all(
        employees.map(async (emp) => {
          const empAssignedAssets = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id);
          const assignedCount = empAssignedAssets.length;
          const publicUrl = getFixedEmployeeQRUrl(emp.id);

          try {
            const qrDataUrl = await QRCode.toDataURL(publicUrl, {
              width: 280,
              margin: 2,
              errorCorrectionLevel: 'M',
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            return {
              employee: emp,
              assignedCount,
              qrDataUrl,
              publicUrl,
            };
          } catch (fallbackError) {
            console.error('Failed to generate QR for', emp.id, fallbackError);
            return {
              employee: emp,
              assignedCount,
              qrDataUrl: '',
              publicUrl,
            };
          }
        })
      );

      if (isMounted) {
        setQrItems(results);
        setIsGenerating(false);
      }
    };

    generateAllQRs();

    return () => {
      isMounted = false;
    };
  }, [employees, assets]);

  const handleCopyLink = (empId: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(empId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownloadPNG = (emp: Employee, dataUrl: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `QR_Badge_${emp.id}_${emp.fullName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintBadge = (emp: Employee, dataUrl: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print badge.');
      return;
    }

    const photoSrc = formatGoogleDriveUrl(emp.photoUrl) || getFallbackAvatarUrl(emp.fullName);
    const assignedAssets = assets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === emp.id);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Badge - ${emp.fullName} (${emp.id})</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 20px;
              margin: 0;
              display: flex;
              justify-content: center;
              background-color: #f8fafc;
            }
            .badge-card {
              width: 320px;
              border: 2px solid #0f172a;
              border-radius: 16px;
              padding: 24px;
              background: #ffffff;
              text-align: center;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .header-org {
              font-size: 14px;
              font-weight: 800;
              color: #4338ca;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 12px;
            }
            .avatar {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              object-fit: cover;
              margin: 0 auto 12px;
              border: 2px solid #4338ca;
            }
            .name {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px;
            }
            .role {
              font-size: 12px;
              font-weight: 600;
              color: #475569;
              margin: 0 0 4px;
            }
            .id-pill {
              display: inline-block;
              font-size: 11px;
              font-family: monospace;
              font-weight: bold;
              background: #e0e7ff;
              color: #3730a3;
              padding: 2px 10px;
              border-radius: 9999px;
              margin-bottom: 16px;
            }
            .qr-container {
              background: #ffffff;
              padding: 12px;
              border-radius: 12px;
              border: 1px solid #e2e8f0;
              margin-bottom: 14px;
            }
            .qr-container img {
              width: 180px;
              height: 180px;
              display: block;
              margin: 0 auto;
            }
            .footer-info {
              font-size: 10px;
              color: #64748b;
              margin-top: 8px;
            }
            .asset-badge {
              font-size: 11px;
              font-weight: bold;
              color: #059669;
              background: #d1fae5;
              padding: 4px 8px;
              border-radius: 6px;
              margin-top: 8px;
              display: inline-block;
            }
            @media print {
              body { background: transparent; padding: 0; }
              .badge-card { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header-org">WorkSpace FFE Asset Badge</div>
            <img class="avatar" src="${photoSrc}" alt="${emp.fullName}" />
            <h1 class="name">${emp.fullName}</h1>
            <p class="role">${emp.title} &bull; ${emp.department}</p>
            <span class="id-pill">${emp.id}</span>
            
            <div class="qr-container">
              <img src="${dataUrl}" alt="QR Code" />
            </div>
            
            <div class="asset-badge">${assignedAssets.length} FFE Items Assigned (Live Sync)</div>
            <div class="footer-info">Scan with mobile camera to view real-time assigned FFE assets without login.</div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredItems = qrItems.filter((item) => {
    const matchesSearch =
      item.employee.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.employee.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDept = departmentFilter === 'all' || item.employee.department === departmentFilter;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-md shadow-indigo-200">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Fixed QR Code & Live Badge Manager
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Permanent QR codes packed with live assigned assets for universal mobile device scanning
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <button
            onClick={onOpenScanner}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200/80 flex items-center justify-center gap-2 transition-all"
          >
            <ScanLine className="w-4 h-4" />
            <span>Launch Camera Scanner</span>
          </button>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md border border-white/80 rounded-2xl p-4 shadow-sm flex items-start gap-3.5">
        <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs text-slate-600 space-y-1">
          <p className="font-bold text-slate-800 text-sm">
            Universal Cross-Device QR Sync
          </p>
          <p className="leading-relaxed">
            QR badges automatically pack assigned item payloads into the link. Scanning them on any phone, tablet, or incognito browser will now instantly display the assigned FFE assets.
          </p>
        </div>
      </div>

      <div className="bg-white/40 backdrop-blur-md border border-white/60 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by employee name, ID (e.g., EMP-101), or department..."
              className="w-full bg-white/70 border border-white/80 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-white/70 border border-white/80 rounded-2xl py-2.5 px-3 text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm"
            >
              <option value="all">All Departments ({employees.length})</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {isGenerating ? (
        <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm space-y-3">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Generating live QR badges with real-time assignment payloads...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-sm space-y-2">
          <User className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-base font-bold text-slate-800">No matching employee badges found</p>
          <p className="text-xs text-slate-500">Adjust your search keyword or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const { employee, assignedCount, qrDataUrl, publicUrl } = item;
            const photoSrc = formatGoogleDriveUrl(employee.photoUrl) || getFallbackAvatarUrl(employee.fullName);

            return (
              <div
                key={employee.id}
                className="bg-white/60 backdrop-blur-md border border-white/90 rounded-3xl p-5 shadow-sm hover:shadow-md hover:bg-white/80 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3.5 mb-4">
                    <img
                      src={photoSrc}
                      alt={employee.fullName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getFallbackAvatarUrl(employee.fullName);
                      }}
                      className="w-13 h-13 rounded-2xl object-cover bg-white border border-white shadow-sm shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-mono text-[10px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          {employee.id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 truncate">
                          {employee.department}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-sm truncate leading-tight">
                        {employee.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium truncate">{employee.title}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200/80 text-center shadow-inner mb-4 flex flex-col items-center justify-center">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR Badge for ${employee.fullName}`}
                        className="w-44 h-44 object-contain mx-auto"
                      />
                    ) : (
                      <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                        Rendering QR...
                      </div>
                    )}

                    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-bold">
                      <Box className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{assignedCount} Assigned FFE Assets</span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-mono mt-1 truncate max-w-full">
                      Payload active with live sync
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200/60">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDownloadPNG(employee, qrDataUrl)}
                      className="py-2 px-3 bg-white/80 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                      title="Download PNG QR Image"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>Download</span>
                    </button>

                    <button
                      onClick={() => handlePrintBadge(employee, qrDataUrl)}
                      className="py-2 px-3 bg-white/80 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                      title="Print Official Physical Badge"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-500" />
                      <span>Print Badge</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleCopyLink(employee.id, publicUrl)}
                      className="py-2 px-3 bg-white/80 hover:bg-white text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/80 shadow-2xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      {copiedId === employee.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => onViewPublicProfile(employee.id)}
                      className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200/80 flex items-center justify-center gap-1.5 transition-all"
                      title="Test Public Profile Route Without Admin Login"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test Scan</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectEmployeeForProfile(employee.id)}
                    className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-xl transition-colors text-center"
                  >
                    Manage Assigned Assets in Admin Console &rarr;
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