import React, { useEffect, useState } from 'react';
import { X, Download, ExternalLink, QrCode as QrIcon, Check, Copy, Box, Sparkles, ShieldCheck, Printer } from 'lucide-react';
import QRCode from 'qrcode';
import { Employee, FFEAsset } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';
import { getFixedEmployeeQRUrl } from '../../lib/qrSync';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee | null;
  assignedAssets?: FFEAsset[];
  onViewProfile: (empId: string) => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  isOpen,
  onClose,
  employee,
  assignedAssets = [],
  onViewProfile,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [fixedUrl, setFixedUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const strictlyAssigned = employee
    ? assignedAssets.filter((a) => a.status === 'Assigned' && a.assignedToEmployeeId === employee.id)
    : [];

  useEffect(() => {
    if (employee && isOpen) {
      // Fixed permanent URL for this employee ID (Never changes)
      const url = getFixedEmployeeQRUrl(employee.id);
      setFixedUrl(url);

      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((dataUrl) => setQrDataUrl(dataUrl))
        .catch((err) => {
          console.error('QR code generation error:', err);
        });
    }
  }, [employee, isOpen]);

  if (!isOpen || !employee) return null;

  const photoSrc = formatGoogleDriveUrl(employee.photoUrl) || getFallbackAvatarUrl(employee.fullName);

  const handleDownloadPNG = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `QR_${employee.id}_${employee.fullName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const urlToCopy = fixedUrl || getFixedEmployeeQRUrl(employee.id);
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintBadge = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Badge - ${employee.fullName} (${employee.id})</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              padding: 24px;
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
            }
            .header-org {
              font-size: 11px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #4f46e5;
              margin-bottom: 12px;
            }
            .avatar {
              width: 64px;
              height: 64px;
              border-radius: 50%;
              object-fit: cover;
              margin: 0 auto 10px auto;
              display: block;
              border: 2px solid #0f172a;
            }
            .name {
              font-size: 18px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 2px 0;
            }
            .role {
              font-size: 12px;
              color: #64748b;
              margin: 0 0 10px 0;
            }
            .id-pill {
              display: inline-block;
              font-family: monospace;
              font-size: 12px;
              font-weight: 700;
              background: #e0e7ff;
              color: #3730a3;
              padding: 2px 8px;
              border-radius: 12px;
              margin-bottom: 12px;
            }
            .qr-container img {
              width: 200px;
              height: 200px;
              display: block;
              margin: 0 auto;
            }
            .asset-badge {
              margin-top: 12px;
              font-size: 11px;
              font-weight: 700;
              color: #059669;
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              padding: 4px 10px;
              border-radius: 20px;
              display: inline-block;
            }
            .footer-info {
              font-size: 9px;
              color: #94a3b8;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="badge-card">
            <div class="header-org">Fixed Permanent Asset QR</div>
            <img class="avatar" src="${photoSrc}" alt="${employee.fullName}" />
            <h1 class="name">${employee.fullName}</h1>
            <p class="role">${employee.title || employee.department}</p>
            <span class="id-pill">${employee.id}</span>
            <div class="qr-container">
              <img src="${qrDataUrl}" alt="QR Code" />
            </div>
            <div class="asset-badge">${strictlyAssigned.length} FFE Items Assigned (Live)</div>
            <div class="footer-info">Permanent QR Badge. Scanning always loads current live workplace assets automatically.</div>
          </div>
          <script>
            window.onload = () => { window.print(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative text-slate-800 my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex p-3 bg-indigo-100 text-indigo-700 rounded-2xl mb-2">
            <QrIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Fixed Employee QR Badge</h2>
          <p className="text-xs text-slate-500 mt-0.5">Permanent QR Code with Automatic Live Asset Sync</p>
        </div>

        {/* Printable Employee Badge Layout */}
        <div id="printable-badge" className="bg-white/80 rounded-2xl p-6 shadow-md text-center space-y-4 border border-white">
          <div className="flex items-center justify-center gap-3">
            <img
              src={photoSrc}
              alt={employee.fullName}
              onError={(e) => {
                (e.target as HTMLImageElement).src = getFallbackAvatarUrl(employee.fullName);
              }}
              className="w-14 h-14 rounded-full object-cover border-2 border-slate-900 shrink-0 shadow-sm"
            />
            <div className="text-left">
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">{employee.fullName}</h3>
              <p className="text-xs font-semibold text-indigo-700">{employee.title || employee.department}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-mono font-bold text-slate-500">{employee.id}</span>
                <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                  Fixed QR
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 inline-block shadow-sm">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code for ${employee.fullName}`} className="w-48 h-48 mx-auto" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
            )}
          </div>

          {/* Dynamic real-time asset count badge */}
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold shadow-2xs">
              <Box className="w-3.5 h-3.5 text-emerald-600" />
              <span>{strictlyAssigned.length} FFE Assets Assigned (Live Sync)</span>
            </div>
            <p className="text-[11px] text-slate-500">
              This QR code never changes. The system automatically updates what is displayed when scanned.
            </p>
          </div>

          <div className="text-[10px] text-slate-400 font-mono bg-slate-50 py-1 px-2 rounded-lg border border-slate-100 truncate">
            {fixedUrl}
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-5 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDownloadPNG}
              className="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-2.5 px-3 bg-white/60 hover:bg-white/80 text-slate-700 font-semibold text-xs rounded-xl border border-white/80 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handlePrintBadge}
              className="py-2.5 px-3 bg-white/60 hover:bg-white/80 text-slate-700 font-semibold text-xs rounded-xl border border-white/80 flex items-center justify-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onViewProfile(employee.id);
            }}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Assigned Assets Profile View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
