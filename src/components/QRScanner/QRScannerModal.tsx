import React, { useEffect, useRef, useState } from 'react';
import { X, Camera, ScanLine, AlertCircle, Upload, CheckCircle2, User, Sparkles } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Employee } from '../../types';
import { formatGoogleDriveUrl, getFallbackAvatarUrl } from '../../lib/driveUtils';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (scannedText: string) => void;
  employees: Employee[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
  employees,
}) => {
  const [activeTab, setActiveTab] = useState<'camera' | 'upload' | 'quick'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'camera') {
      const qrRegionId = 'qr-camera-reader';
      const html5QrcodeScanner = new Html5Qrcode(qrRegionId);
      scannerRef.current = html5QrcodeScanner;

      setIsScanning(true);
      setCameraError(null);

      html5QrcodeScanner
        .start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 220, height: 220 },
          },
          (decodedText) => {
            // Stop scanning on success
            if (scannerRef.current && scannerRef.current.isScanning) {
              scannerRef.current
                .stop()
                .then(() => {
                  onScanSuccess(decodedText);
                  onClose();
                })
                .catch(() => {
                  onScanSuccess(decodedText);
                  onClose();
                });
            } else {
              onScanSuccess(decodedText);
              onClose();
            }
          },
          (errorMessage) => {
            // Ignore minor frame read errors
          }
        )
        .catch((err) => {
          console.warn('Camera access error:', err);
          setIsScanning(false);
          setCameraError(
            'Camera permission denied or camera unavailable in iframe context. Use Quick-Scan below or upload an image.'
          );
        });

      return () => {
        if (scannerRef.current) {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current?.clear();
            }).catch(() => {});
          } else {
            try {
              scannerRef.current.clear();
            } catch (e) {}
          }
        }
      };
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const html5Qrcode = new Html5Qrcode('qr-file-reader');
    html5Qrcode
      .scanFile(file, true)
      .then((decodedText) => {
        onScanSuccess(decodedText);
        onClose();
      })
      .catch((err) => {
        alert('Could not decode QR code from uploaded image. Please ensure the image contains a clear employee QR code.');
      });
  };

  const handleQuickSelectEmployee = (empId: string) => {
    onScanSuccess(`?profile=${empId}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative text-slate-800 my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-white/50 transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex p-3 bg-indigo-100 text-indigo-700 rounded-2xl mb-2">
            <ScanLine className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">QR Code Badge Scanner</h2>
          <p className="text-xs text-slate-500 mt-0.5">Scan employee QR code to view assigned FFE workplace assets</p>
        </div>

        {/* Scanner Mode Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-white/60 p-1 rounded-2xl border border-white/80 mb-5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('camera')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'camera' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Camera</span>
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image</span>
          </button>

          <button
            onClick={() => setActiveTab('quick')}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
              activeTab === 'quick' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Quick Test</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="space-y-4">
            <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-white/80 min-h-[260px] flex items-center justify-center shadow-sm">
              <div id="qr-camera-reader" className="w-full h-full" />

              {cameraError && (
                <div className="absolute inset-0 p-6 bg-slate-900/90 flex flex-col items-center justify-center text-center space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-400" />
                  <p className="text-xs text-slate-300 leading-relaxed">{cameraError}</p>
                  <button
                    onClick={() => setActiveTab('quick')}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-200"
                  >
                    Use Quick Test Badges
                  </button>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500 text-center font-medium">
              Position employee QR badge inside the camera viewport
            </p>
          </div>
        )}

        {/* Tab 2: Upload Image */}
        {activeTab === 'upload' && (
          <div className="space-y-4">
            <div id="qr-file-reader" className="hidden" />
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl p-8 text-center bg-white/50 hover:bg-white/80 transition-all cursor-pointer space-y-3"
            >
              <Upload className="w-10 h-10 mx-auto text-indigo-600" />
              <div>
                <p className="font-bold text-slate-900 text-sm">Click to select QR Code photo</p>
                <p className="text-xs text-slate-500 mt-0.5">Supports PNG, JPG, WEBP badge screenshots</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Quick Test Badge Selector */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-600 font-bold mb-2">
              Select an employee badge below to simulate instant scanning:
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {employees.map((emp) => {
                const photoSrc = formatGoogleDriveUrl(emp.photoUrl) || getFallbackAvatarUrl(emp.fullName);

                return (
                  <div
                    key={emp.id}
                    onClick={() => handleQuickSelectEmployee(emp.id)}
                    className="p-3 bg-white/60 hover:bg-white/90 border border-white/80 rounded-2xl cursor-pointer flex items-center justify-between transition-all group shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={photoSrc}
                        alt={emp.fullName}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackAvatarUrl(emp.fullName);
                        }}
                        className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm"
                      />
                      <div>
                        <p className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {emp.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {emp.id} • {emp.department}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      Simulate Scan
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
