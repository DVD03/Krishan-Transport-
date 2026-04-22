import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../logo.png';
import { amountToWords } from './numberToWords';

const COMPANY_DETAILS = {
  name: 'KRISHAN TRANSPORT',
  address: 'No. 241, Rajamaha Vihara Road, Mirihana, Kotte.',
  phone: '072 362 7888 / 070 362 7888 / 077 508 5815',
  email: 'krishantransport1@gmail.com',
  regNo: '73330'
};

const THEME = {
  primary: [37, 99, 235], // Blue
  secondary: [236, 72, 153], // Pink
  light: [248, 250, 252], // Slate
  text: [30, 41, 59] // Slate 800
};

// Helper for positioning between tables
const safeGetY = (doc, fallback = 160) => {
  if (doc.lastAutoTable && doc.lastAutoTable.finalY) return doc.lastAutoTable.finalY;
  if (doc.autoTable && doc.autoTable.previous && doc.autoTable.previous.finalY) return doc.autoTable.previous.finalY;
  return fallback;
};

const drawHeader = (doc, title) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Top Accent Bar
  doc.setFillColor(...THEME.primary);
  doc.rect(0, 0, pageWidth, 15, 'F');

  // Company Details (Right Aligned)
  doc.setFontSize(22);
  doc.setTextColor(...THEME.primary);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, pageWidth - 15, 30, { align: 'right' });

  doc.setFontSize(9);
  doc.setTextColor(...THEME.text);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, pageWidth - 15, 36, { align: 'right' });
  doc.text(`Hotline: ${COMPANY_DETAILS.phone}`, pageWidth - 15, 41, { align: 'right' });
  doc.text(`Email: ${COMPANY_DETAILS.email}`, pageWidth - 15, 46, { align: 'right' });
  doc.text(`Reg No: ${COMPANY_DETAILS.regNo}`, pageWidth - 15, 51, { align: 'right' });

  // Document Title Banner
  doc.setFillColor(...THEME.light);
  doc.rect(15, 60, pageWidth - 30, 12, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...THEME.primary);
  doc.text(title.toUpperCase(), pageWidth / 2, 68, { align: 'center' });
};

const drawFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This is a formal business document issued by Krishan Transport Management System.', pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Bottom Bar
  doc.setFillColor(...THEME.primary);
  doc.rect(0, pageHeight - 5, pageWidth, 5, 'F');
};

const addSignature = (doc, y) => {
    const pageWidth = doc.internal.pageSize.width;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    doc.line(15, y, 75, y);
    doc.text('Prepared By', 15, y + 5);

    doc.line(pageWidth - 75, y, pageWidth - 15, y);
    doc.text('Authorized & Approved', pageWidth - 75, y + 5, { align: 'left' });
};

const safeDate = (d) => {
    try {
        if (!d) return '--/--/----';
        const date = new Date(d);
        return isNaN(date.getTime()) ? '--/--/----' : date.toLocaleDateString();
    } catch { return '--/--/----'; }
};

export const generateInvoicePDF = async (invoice) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Add Logo
    try {
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve) => { 
        img.onload = resolve; 
        img.onerror = resolve; 
      });
      doc.addImage(img, 'PNG', 15, 20, 35, 35);
    } catch (e) {
      console.warn("Logo skipped");
    }

    drawHeader(doc, 'Commercial Invoice');

    // Meta Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`INVOICE NO: ${invoice.invoiceNo || 'DRAFT'}`, 15, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`BILLING DATE: ${safeDate(invoice.date).toUpperCase()}`, 15, 91);
    doc.text(`STATUS: ${(invoice.status || 'DRAFT').toUpperCase()}`, 15, 97);

    // Client Box
    doc.setFillColor(...THEME.light);
    doc.setDrawColor(200);
    doc.roundedRect(pageWidth - 100, 80, 85, 30, 3, 3, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.text('BILL TO:', pageWidth - 95, 87);
    doc.setFontSize(11);
    doc.text(invoice.clientName || 'VALUED CUSTOMER', pageWidth - 95, 94);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    if (invoice.site) doc.text(`Site: ${invoice.site}`, pageWidth - 95, 100);
    doc.text(`Vehicle: ${invoice.vehicleNo || 'N/A'}`, pageWidth - 95, 105);

    // Table
    const tableData = [
      ['Job Description', invoice.jobDescription || 'Professional Transport Services'],
      ['Unit Billing Type', invoice.unitType || 'Hours'],
      ['Total Units', `${invoice.totalUnits || 0}`],
      ['Rate Per Unit', `LKR ${(invoice.ratePerUnit || 0).toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: 120,
      head: [['SERVICE CATEGORY', 'DETAILS']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: THEME.primary, fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
    });

    let currentY = safeGetY(doc, 160);

    // Financial Summary Table
    const summaryData = [
      ['Subtotal Service', `LKR ${((invoice.totalUnits || 0) * (invoice.ratePerUnit || 0)).toLocaleString()}`],
      ['Transport Charges', `LKR ${invoice.transportCharge?.toLocaleString() || '0'}`],
      ['Other Charges', `LKR ${invoice.otherCharges?.toLocaleString() || '0'}`],
      ['GRAND TOTAL', `LKR ${invoice.totalAmount?.toLocaleString()}`]
    ];

    autoTable(doc, {
      startY: currentY + 10,
      body: summaryData,
      theme: 'plain',
      styles: { halign: 'right', fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { fontStyle: 'bold', fontSize: 12, textColor: THEME.primary } }
    });

    currentY = safeGetY(doc, currentY + 50);

    // Amount in Words
    const wordsY = currentY + 15;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('AMOUNT IN WORDS:', 15, wordsY);
    doc.setFont('helvetica', 'normal');
    doc.text(amountToWords(invoice.totalAmount || 0), 15, wordsY + 6);

    // Bank Details
    doc.setFillColor(...THEME.light);
    doc.rect(15, wordsY + 15, pageWidth - 30, 25, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT INSTRUCTIONS:', 20, wordsY + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('Account Name: Krishan Transport Service', 20, wordsY + 28);
    doc.text('Account No: 1234-5678-9012 (Bank of Ceylon - Mirihana)', 20, wordsY + 33);

    addSignature(doc, doc.internal.pageSize.height - 45);
    drawFooter(doc);
    doc.save(`Invoice_${invoice.invoiceNo || 'New'}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    alert('Oops! Document rendering failed: ' + error.message);
  }
};

export const generateQuotationPDF = async (quote) => {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    try {
      const img = new Image();
      img.src = logoUrl;
      await new Promise((resolve) => { 
        img.onload = resolve; 
        img.onerror = resolve; 
      });
      doc.addImage(img, 'PNG', 15, 20, 35, 35);
    } catch (e) {
      console.warn("Logo skipped");
    }

    drawHeader(doc, 'Service Quotation');

    // Meta & Client
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`QUOTATION NO: ${quote.quotationNo || 'NEW'}`, 15, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(`VALIDITY: ${quote.validityDays || 30} DAYS`, 15, 91);

    doc.setFillColor(...THEME.light);
    doc.roundedRect(pageWidth - 100, 80, 85, 30, 3, 3, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('FOR CLIENT:', pageWidth - 95, 87);
    doc.setFontSize(11);
    doc.text(quote.clientName || 'PROSPECTIVE CUSTOMER', pageWidth - 95, 94);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(quote.clientAddress || 'No Address Provided', pageWidth - 95, 100, { maxWidth: 75 });

    // Specs Table
    autoTable(doc, {
      startY: 115,
      head: [['VEHICLE SPECIFICATIONS', 'CAPACITY / LIMITS']],
      body: [
        ['Vehicle Type', quote.vehicleType || 'Any'],
        ['Required Vehicle No', quote.vehicleNo || 'Fleet Item'],
        ['Max Lifting Height', quote.maxHeight || 'N/A'],
        ['Max Load Weight', quote.maxWeight || 'N/A']
      ],
      theme: 'striped',
      headStyles: { fillColor: THEME.primary }
    });
    
    let currentY = safeGetY(doc, 155);

    // Rates Table
    autoTable(doc, {
      startY: currentY + 10,
      head: [['DESCRIPTION OF CHARGES', 'UNIT RATE']],
      body: [
        ['Minimum / Mandatory Charge', `LKR ${(quote.mandatoryCharge || 0).toLocaleString()}`],
        ['Transport & Mobilization', `LKR ${(quote.transportCharge || 0).toLocaleString()}`],
        ['Extra Hourly Rate (After min hours)', `LKR ${(quote.extraHourRate || 0).toLocaleString()}`],
        ['ESTIMATED TOTAL (MIN)', `LKR ${(quote.estimatedTotal || 0).toLocaleString()}`]
      ],
      theme: 'grid',
      headStyles: { fillColor: THEME.primary },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    currentY = safeGetY(doc, currentY + 50);

    // Terms
    const termsY = currentY + 15;
    doc.setFont('helvetica', 'bold');
    doc.text('TERMS & CONDITIONS:', 15, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const terms = doc.splitTextToSize(quote.termsAndConditions || 'Standard terms apply.', pageWidth - 30);
    doc.text(terms, 15, termsY + 6);

    addSignature(doc, doc.internal.pageSize.height - 45);
    drawFooter(doc);
    doc.save(`Quotation_${quote.quotationNo || 'New'}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    alert('Oops! Document rendering failed: ' + error.message);
  }
};
