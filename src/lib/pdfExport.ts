import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, FFEAsset } from '../types';

/**
 * Format currency safely for PDF Helvetica standard font (avoids unicode symbol font missing bugs)
 */
function formatPdfCurrency(amount: number): string {
  const numStr = (amount || 0).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `PHP ${numStr}`;
}

/**
 * Formats current date and time for document headers and audit trails
 */
function getFormattedDateTime(): string {
  const now = new Date();
  return now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Adds an executive, professional header to the PDF
 */
function addDocumentHeader(
  doc: jsPDF,
  title: string,
  subtitle: string,
  docType: string
): number {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top accent banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setFillColor(79, 70, 229); // Indigo-600 top stripe
  doc.rect(0, 0, pageWidth, 3, 'F');

  // Title in header
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('WORKPLACE FFE ASSET INVENTORY & CUSTODY SYSTEM', 14, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(199, 210, 254); // Indigo-200
  doc.text('CORPORATE PROPERTY MANAGEMENT & AUDIT LOG', 14, 21);

  // Document Badge on right
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(docType.toUpperCase(), pageWidth - 14, 14, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(203, 213, 225); // Slate-300
  doc.text(`Generated: ${getFormattedDateTime()}`, pageWidth - 14, 21, { align: 'right' });

  // Main Report Title below banner
  let currentY = 38;
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, 14, currentY);

  currentY += 6;
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(subtitle, 14, currentY);

  currentY += 5;
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);

  return currentY + 6;
}

/**
 * Adds professional footer with page numbering and sign-off placeholder
 */
function addDocumentFooter(doc: jsPDF) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Footer divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);

    // Left info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('CONFIDENTIAL - Internal Asset Management & Custody Verification Document', 14, pageHeight - 9);

    // Right Page number
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 9, { align: 'right' });
  }
}

/**
 * 1. EXPORT MASTER FFE ASSET INVENTORY REPORT (PDF)
 */
export function exportAssetsToPdf(assets: FFEAsset[], employees: Employee[], filterLabel?: string) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const title = 'Master FFE Asset Inventory Report';
  const subtitle = filterLabel
    ? `Filtered view: ${filterLabel} | Total Items: ${assets.length}`
    : `Complete workplace inventory of Furniture, Fixtures, and Technical Equipment | Total: ${assets.length} items`;

  let currentY = addDocumentHeader(doc, title, subtitle, 'Asset Inventory Report');

  // Summary Metrics Box
  const totalValue = assets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  const assignedCount = assets.filter((a) => a.status === 'Assigned').length;
  const availableCount = assets.filter((a) => a.status === 'Available').length;
  const maintenanceCount = assets.filter((a) => a.status === 'Maintenance').length;

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28) / 4;
  const boxHeight = 14;

  const metrics = [
    { label: 'Total Assets', value: `${assets.length} Items`, color: [241, 245, 249], textColor: [15, 23, 42] },
    { label: 'Assigned in Use', value: `${assignedCount} Items`, color: [238, 242, 255], textColor: [67, 56, 202] },
    { label: 'Available in Stock', value: `${availableCount} Items`, color: [236, 253, 245], textColor: [4, 120, 87] },
    { label: 'Total Valuation', value: formatPdfCurrency(totalValue), color: [254, 243, 199], textColor: [180, 83, 9] },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * boxWidth;
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.roundedRect(x, currentY, boxWidth - 3, boxHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x + 4, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
    doc.text(m.value, x + 4, currentY + 11);
  });

  currentY += boxHeight + 6;

  // Table Data
  const tableData = assets.map((asset) => {
    const assignedEmp = asset.assignedToEmployeeId
      ? employees.find((e) => e.id.toLowerCase() === asset.assignedToEmployeeId?.toLowerCase())
      : null;

    const assignedText = assignedEmp
      ? `${assignedEmp.fullName}\n(${assignedEmp.id})`
      : 'Unassigned';

    return [
      asset.tagNumber || '-',
      asset.id,
      `${asset.name}\n[${asset.category}]`,
      asset.serialNumber || '-',
      asset.status,
      assignedText,
      asset.location || '-',
      formatPdfCurrency(asset.purchaseCost || 0),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [
      ['Tag No.', 'Asset ID', 'Item Name & Category', 'Serial Number', 'Status', 'Assigned To', 'Location', 'Value'],
    ],
    body: tableData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8,
      cellPadding: 2.5,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 24, fontStyle: 'bold', textColor: [79, 70, 229] },
      2: { cellWidth: 60 },
      3: { cellWidth: 32 },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 40 },
      6: { cellWidth: 38 },
      7: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
    didDrawCell: (data) => {
      // Optional badge coloring for status column
      if (data.section === 'body' && data.column.index === 4) {
        const val = data.cell.raw as string;
        if (val === 'Assigned') {
          doc.setTextColor(67, 56, 202);
        } else if (val === 'Available') {
          doc.setTextColor(4, 120, 87);
        } else if (val === 'Maintenance') {
          doc.setTextColor(180, 83, 9);
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  addDocumentFooter(doc);

  const filename = `FFE_Master_Asset_Inventory_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 2. EXPORT STAFF & EMPLOYEE DIRECTORY REPORT (PDF)
 */
export function exportEmployeesToPdf(employees: Employee[], assets: FFEAsset[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const title = 'Staff & Employee Directory Report';
  const subtitle = `Comprehensive listing of all registered personnel, assigned FFE inventory, and active custody valuation`;

  let currentY = addDocumentHeader(doc, title, subtitle, 'Staff Directory');

  // Summary Metrics Box
  const totalEmployees = employees.length;
  const assignedAssetsCount = assets.filter((a) => a.status === 'Assigned').length;
  const totalAssignedValue = assets
    .filter((a) => a.status === 'Assigned')
    .reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

  const pageWidth = doc.internal.pageSize.getWidth();
  const boxWidth = (pageWidth - 28) / 3;
  const boxHeight = 14;

  const metrics = [
    { label: 'Total Personnel', value: `${totalEmployees} Members`, color: [241, 245, 249], textColor: [15, 23, 42] },
    { label: 'Total Assets In Custody', value: `${assignedAssetsCount} Items`, color: [238, 242, 255], textColor: [67, 56, 202] },
    { label: 'Total Custody Valuation', value: formatPdfCurrency(totalAssignedValue), color: [236, 253, 245], textColor: [4, 120, 87] },
  ];

  metrics.forEach((m, idx) => {
    const x = 14 + idx * boxWidth;
    doc.setFillColor(m.color[0], m.color[1], m.color[2]);
    doc.roundedRect(x, currentY, boxWidth - 3, boxHeight, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(m.label.toUpperCase(), x + 4, currentY + 5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(m.textColor[0], m.textColor[1], m.textColor[2]);
    doc.text(m.value, x + 4, currentY + 11);
  });

  currentY += boxHeight + 6;

  // Table Data
  const tableData = employees.map((emp) => {
    const empAssignedAssets = assets.filter(
      (a) => a.status === 'Assigned' && a.assignedToEmployeeId?.toLowerCase() === emp.id.toLowerCase()
    );
    const empValuation = empAssignedAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);

    return [
      emp.id,
      `${emp.fullName}\n${emp.email}`,
      `${emp.department}\n${emp.title}`,
      emp.joinedDate || '-',
      `${empAssignedAssets.length} items`,
      formatPdfCurrency(empValuation),
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Name & Email', 'Department & Title', 'Joined Date', 'Assigned FFE', 'Custody Value']],
    body: tableData,
    theme: 'striped',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 3,
      overflow: 'linebreak',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24, fontStyle: 'bold', textColor: [79, 70, 229] },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14, bottom: 18 },
  });

  addDocumentFooter(doc);

  const filename = `Staff_Employee_Directory_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}

/**
 * 3. EXPORT INDIVIDUAL EMPLOYEE FFE CUSTODY / ACCOUNTABILITY FORM (PDF)
 */
export function exportEmployeeCustodySlipToPdf(employee: Employee, assignedAssets: FFEAsset[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const title = 'Employee FFE Asset Custody & Accountability Slip';
  const subtitle = `Official inventory handover and equipment custody record for ${employee.fullName} (${employee.id})`;

  let currentY = addDocumentHeader(doc, title, subtitle, 'Custody & Handover Slip');

  const pageWidth = doc.internal.pageSize.getWidth();

  // Employee Profile Card Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, currentY, pageWidth - 28, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.fullName, 20, currentY + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Employee ID: ${employee.id}   |   Title: ${employee.title}`, 20, currentY + 14);
  doc.text(`Department: ${employee.department}   |   Email: ${employee.email}`, 20, currentY + 20);
  doc.text(`Joined Date: ${employee.joinedDate || 'N/A'}   |   Fixed QR Status: Verified Permanent`, 20, currentY + 26);

  // Summary on right of the box
  const totalCustodyValue = assignedAssets.reduce((sum, a) => sum + (a.purchaseCost || 0), 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL CUSTODY VALUE', pageWidth - 20, currentY + 10, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(79, 70, 229);
  doc.text(formatPdfCurrency(totalCustodyValue), pageWidth - 20, currentY + 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${assignedAssets.length} Active Items Assigned`, pageWidth - 20, currentY + 24, { align: 'right' });

  currentY += 36;

  // Section Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('ASSIGNED WORKPLACE FURNITURE, FIXTURES & EQUIPMENT (FFE)', 14, currentY);

  currentY += 3;

  // Table of Assigned Assets
  if (assignedAssets.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('No FFE assets are currently assigned to this employee.', 14, currentY + 8);
    currentY += 16;
  } else {
    const tableData = assignedAssets.map((asset, index) => [
      (index + 1).toString(),
      asset.tagNumber || '-',
      asset.id,
      `${asset.name}\n[${asset.category}]`,
      asset.serialNumber || '-',
      asset.location || '-',
      formatPdfCurrency(asset.purchaseCost || 0),
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Tag No.', 'Asset ID', 'Item Description & Category', 'Serial Number', 'Location', 'Cost (PHP)']],
      body: tableData,
      theme: 'striped',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2.8,
        overflow: 'linebreak',
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 26, fontStyle: 'bold' },
        2: { cellWidth: 24, fontStyle: 'bold', textColor: [79, 70, 229] },
        3: { cellWidth: 54 },
        4: { cellWidth: 32 },
        5: { cellWidth: 32 },
        6: { cellWidth: 24, halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14, bottom: 45 },
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Legal / Terms Acknowledgment Block
  const remainingSpace = doc.internal.pageSize.getHeight() - currentY;
  if (remainingSpace < 42) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CUSTODIAN ACKNOWLEDGMENT & TERMS OF RESPONSIBILITY', 14, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  const termsText =
    'I hereby acknowledge receipt of the Furniture, Fixtures, and Technical Equipment (FFE) listed above in good working condition. ' +
    'I agree to exercise due diligence in the care and security of these items. In the event of workplace reassignment, transfer, or resignation, ' +
    'I agree to promptly surrender all assigned property to the Workplace Facilities & Property Management Department.';
  doc.text(termsText, 14, currentY, { maxWidth: pageWidth - 28 });

  currentY += 12;

  // Signature lines
  const sigBoxWidth = (pageWidth - 36) / 2;

  // Employee Signature Box
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 12, 14 + sigBoxWidth, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(employee.fullName, 14, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Employee / Asset Custodian Signature & Date', 14, currentY + 20);

  // Property Officer Signature Box
  doc.line(14 + sigBoxWidth + 8, currentY + 12, pageWidth - 14, currentY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Workplace & Facilities Management Officer', 14 + sigBoxWidth + 8, currentY + 16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Property Custodian Signature & Date', 14 + sigBoxWidth + 8, currentY + 20);

  addDocumentFooter(doc);

  const safeEmpName = employee.fullName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `FFE_Custody_Slip_${employee.id}_${safeEmpName}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
}
