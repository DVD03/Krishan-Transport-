import jsPDF from 'jspdf';
import logoUrl from '../logo.png';

const COMPANY_DETAILS = {
  name: 'KRISHAN TRANSPORT',
  address: 'No. 241, Rajamaha Vihara Road, Mirihana, Kotte.',
  phone: '072 362 7888 / 070 362 7888 / 077 508 5815',
  email: 'krishantransport1@gmail.com',
  regNo: '73330'
};

const drawHeader = (doc, title) => {
  const pageWidth = doc.internal.pageSize.width;
  
  // Pinkish accent line at top
  doc.setDrawColor(220, 38, 38); 
  doc.setLineWidth(1.5);
  doc.line(0, 0, pageWidth, 0);

  // Logo Placeholder (Actual logo will be added in the async wrapper)
  // Company Name
  doc.setFontSize(24);
  doc.setTextColor(20, 50, 100);
  doc.setFont('helvetica', 'bold');
  doc.text(COMPANY_DETAILS.name, 50, 25);

  // Address & Contacts
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.setFont('helvetica', 'normal');
  doc.text(COMPANY_DETAILS.address, 50, 31);
  doc.text(`Tel: ${COMPANY_DETAILS.phone}`, 50, 36);
  doc.text(`Email: ${COMPANY_DETAILS.email}`, 50, 41);

  // Reg No
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Reg No: ${COMPANY_DETAILS.regNo}`, pageWidth - 15, 41, { align: 'right' });

  // Document Title
  doc.setFontSize(18);
  doc.setTextColor(30);
  doc.setDrawColor(200);
  doc.setLineWidth(0.5);
  doc.line(15, 48, pageWidth - 15, 48);
  doc.text(title.toUpperCase(), pageWidth / 2, 58, { align: 'center' });
  doc.line(pageWidth / 2 - 20, 60, pageWidth / 2 + 20, 60);
};

const drawFooter = (doc) => {
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Thank you for choosing Krishan Transport!', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  doc.setDrawColor(230);
  doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
  
  doc.setFontSize(8);
  doc.text('This is a computer-generated document.', 15, pageHeight - 10);
  doc.text(`${new Date().toLocaleString()}`, pageWidth - 15, pageHeight - 10, { align: 'right' });
};

export const generateInvoicePDF = async (invoice) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add Logo
  try {
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    doc.addImage(img, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    console.error("Logo load failed", e);
  }

  drawHeader(doc, 'Commercial Invoice');

  // Invoice Meta
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`Invoice No: ${invoice.invoiceNo}`, 15, 75);
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, pageWidth - 15, 75, { align: 'right' });

  // Customer Details Box
  doc.setFillColor(245, 247, 250);
  doc.rect(15, 82, pageWidth - 30, 25, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, 89);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.clientName, 20, 96);
  if (invoice.site) doc.text(`Site: ${invoice.site}`, 20, 102);

  // Job Details
  doc.setFont('helvetica', 'bold');
  doc.text('JOB DETAILS:', 15, 120);
  doc.setFont('helvetica', 'normal');
  doc.text(`Vehicle No: ${invoice.vehicleNo}`, 15, 127);
  doc.text(`Description: ${invoice.jobDescription || 'N/A'}`, 15, 134);

  // Table Header
  const tableY = 150;
  doc.setFillColor(40, 44, 52);
  doc.rect(15, tableY, pageWidth - 30, 10, 'F');
  doc.setTextColor(255);
  doc.text('DESCRIPTION', 20, tableY + 7);
  doc.text('QUANTITY', 110, tableY + 7);
  doc.text('RATE', 145, tableY + 7);
  doc.text('AMOUNT', pageWidth - 20, tableY + 7, { align: 'right' });

  // Table Row
  doc.setTextColor(30);
  let currentY = tableY + 18;
  const lineTotal = (invoice.totalUnits || 0) * (invoice.ratePerUnit || 0);
  doc.text(`Service Charges (${invoice.unitType})`, 20, currentY);
  doc.text(`${invoice.totalUnits}`, 115, currentY);
  doc.text(`Rs. ${invoice.ratePerUnit?.toLocaleString()}`, 145, currentY);
  doc.text(`Rs. ${lineTotal.toLocaleString()}`, pageWidth - 20, currentY, { align: 'right' });

  if (invoice.transportCharge > 0) {
    currentY += 10;
    doc.text('Transport Charges', 20, currentY);
    doc.text('Rs. ' + invoice.transportCharge.toLocaleString(), pageWidth - 20, currentY, { align: 'right' });
  }

  if (invoice.otherCharges > 0) {
    currentY += 10;
    doc.text(invoice.otherChargesDescription || 'Other Charges', 20, currentY);
    doc.text('Rs. ' + invoice.otherCharges.toLocaleString(), pageWidth - 20, currentY, { align: 'right' });
  }

  // Divider
  doc.setDrawColor(200);
  doc.line(15, currentY + 10, pageWidth - 15, currentY + 10);

  // Grand Total
  currentY += 25;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL AMOUNT:', pageWidth - 80, currentY);
  doc.setTextColor(220, 38, 38);
  doc.text(`Rs. ${invoice.totalAmount?.toLocaleString()}/=`, pageWidth - 20, currentY, { align: 'right' });

  // Signature Section
  const sigY = doc.internal.pageSize.height - 60;
  doc.setFontSize(10);
  doc.setTextColor(30);
  doc.setFont('helvetica', 'normal');
  doc.line(15, sigY, 70, sigY);
  doc.text('Prepared By', 15, sigY + 5);

  doc.line(pageWidth - 70, sigY, pageWidth - 15, sigY);
  doc.text('Authorized Signature', pageWidth - 70, sigY + 5);

  drawFooter(doc);
  doc.save(`Invoice_${invoice.invoiceNo}.pdf`);
};

export const generateQuotationPDF = async (quote) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add Logo
  try {
    const img = new Image();
    img.src = logoUrl;
    await new Promise((resolve) => { img.onload = resolve; });
    doc.addImage(img, 'PNG', 15, 12, 30, 30);
  } catch (e) {
    console.error("Logo load failed", e);
  }

  drawHeader(doc, 'Service Quotation');

  // Quotation Meta
  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`Quotation No: ${quote.quotationNo}`, 15, 75);
  doc.text(`Date: ${new Date(quote.date).toLocaleDateString()}`, pageWidth - 15, 75, { align: 'right' });

  // Client Details
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT:', 15, 85);
  doc.setFont('helvetica', 'normal');
  doc.text(quote.clientName, 15, 92);
  if (quote.clientAddress) doc.text(quote.clientAddress, 15, 98);

  // Specifications
  doc.setDrawColor(230);
  doc.setFillColor(250);
  doc.rect(15, 110, pageWidth - 30, 30, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE SPECIFICATIONS', pageWidth / 2, 117, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Vehicle / Type: ${quote.vehicleType || 'N/A'}`, 25, 125);
  doc.text(`Maximum Height: ${quote.maxHeight || 'N/A'}`, 25, 132);
  doc.text(`Maximum Weight: ${quote.maxWeight || 'N/A'}`, pageWidth / 2 + 10, 132);

  // Price Breakdown
  doc.setFont('helvetica', 'bold');
  doc.text('OFFERED RATES:', 15, 155);
  doc.setFont('helvetica', 'normal');
  
  let currentY = 165;
  const items = [
    { label: 'Mandatory / Minimum Charge', value: quote.mandatoryCharge },
    { label: 'Transport / Mobilization Charge', value: quote.transportCharge },
    { label: 'Extra Hourly Rate (After min hours)', value: quote.extraHourRate }
  ];

  items.forEach(item => {
    doc.text(item.label, 20, currentY);
    doc.text(`Rs. ${item.value?.toLocaleString()}`, pageWidth - 20, currentY, { align: 'right' });
    doc.setLineDash([1, 1]);
    doc.line(20, currentY + 2, pageWidth - 20, currentY + 2);
    currentY += 12;
  });

  // Estimated Total
  doc.setLineDash([]);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTIMATED TOTAL:', pageWidth - 80, currentY + 10);
  doc.setTextColor(220, 38, 38);
  doc.text(`Rs. ${quote.estimatedTotal?.toLocaleString()}/=`, pageWidth - 20, currentY + 10, { align: 'right' });

  // Terms
  doc.setTextColor(30);
  doc.setFontSize(10);
  doc.text(`* This quotation is valid for ${quote.validityDays} days from the above date.`, 15, currentY + 30);
  if (quote.termsAndConditions) {
    doc.text('Terms & Conditions:', 15, currentY + 40);
    doc.setFontSize(9);
    doc.setTextColor(100);
    const splitTerms = doc.splitTextToSize(quote.termsAndConditions, pageWidth - 30);
    doc.text(splitTerms, 15, currentY + 46);
  }

  drawFooter(doc);
  doc.save(`Quotation_${quote.quotationNo}.pdf`);
};
