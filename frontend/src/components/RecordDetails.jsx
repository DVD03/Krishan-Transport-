import React from 'react';
import { Download } from 'lucide-react';
import { generateInvoicePDF, generateQuotationPDF } from '../utils/billingGenerator';
import './RecordDetails.css';

const RecordDetails = ({ data, type }) => {
  if (!data) return null;

  const formatDate = (val) => {
    if (!val) return '—';
    if (val instanceof Date) return val.toLocaleDateString();
    if (typeof val === 'string') {
      if (val.match(/^\d{4}-\d{2}-\d{2}/)) {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        }
      }
    }
    return val;
  };

  const DetailSection = ({ title, fields }) => (
    <div className="detail-section">
      <h4 className="detail-section-title">
        {title}
      </h4>
      <div className="detail-grid">
        {fields.map((f, i) => (
          <div key={i} className="detail-field">
            <label>{f.label}</label>
            <p>{data[f.key] !== undefined && data[f.key] !== '' ? formatDate(data[f.key]) : '—'}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const hireFields = [
    { title: 'Basic Information', fields: [
      { label: 'Date', key: 'date' },
      { label: 'Bill Number', key: 'billNumber' },
      { label: 'Time Sheet No', key: 'timeSheetNumber' },
      { label: 'Company Name', key: 'client' },
      { label: 'Vehicle Number', key: 'vehicle' },
      { label: 'Location / Site', key: 'location' }
    ]},
    { title: 'Personnel', fields: [
      { label: 'Driver Name', key: 'driverName' },
      { label: 'Helper Name', key: 'helperName' }
    ]},
    { title: 'Time Tracking', fields: [
      { label: 'Start Time', key: 'startTime' },
      { label: 'End Time', key: 'endTime' },
      { label: 'Rest (min)', key: 'restTime' },
      { label: 'Working Hours', key: 'workingHours' }
    ]},
    { title: 'Financial Breakdown', fields: [
      { label: 'Min Hours', key: 'minimumHours' },
      { label: 'One Hour Fee', key: 'oneHourFee' },
      { label: 'Extra Hours', key: 'extraHours' },
      { label: 'Extra Hour Fee', key: 'extraHourFee' },
      { label: 'Transport Fee', key: 'transportFee' },
      { label: 'Fuel Cost', key: 'dieselCost' },
      { label: 'Commission', key: 'commission' },
      { label: 'Total Amount', key: 'totalAmount_disp' }
    ]},
    { title: 'Additional Details', fields: [
        { label: 'Notes', key: 'details' },
        { label: 'Status', key: 'status_text' }
    ]}
  ];

  const paymentFields = [
    { title: 'Job Information', fields: [
      { label: 'Date',          key: 'date' },
      { label: 'Company',       key: 'client' },
      { label: 'Vehicle No',    key: 'vehicle' },
      { label: 'Location',      key: 'location' },
    ]},
    { title: 'Time Tracking', fields: [
      { label: 'Start Time',       key: 'startTime' },
      { label: 'End Time',         key: 'endTime' },
      { label: 'Rest Time (min)',   key: 'restTime' },
      { label: 'Total Hours',      key: 'totalHours' },
      { label: 'Minimum Hours',    key: 'minimumHours' },
      { label: 'Hours in Bill',    key: 'hoursInBill' },
    ]},
    { title: 'Financial Breakdown', fields: [
      { label: 'Hire Amount',    key: 'hireAmount' },
      { label: 'Commission',     key: 'commission' },
      { label: 'Day Payment',    key: 'dayPayment' },
      { label: 'Taken Amount',   key: 'takenAmount' },
      { label: 'Balance',        key: 'balance' },
      { label: 'Status',         key: 'status_text' },
    ]},
  ];

  const invoiceFields = [
    { title: 'Billing Details', fields: [
      { label: 'Invoice Number', key: 'invoiceNo' },
      { label: 'Date', key: 'date' },
      { label: 'Client', key: 'clientName' },
      { label: 'Site', key: 'site' },
      { label: 'Vehicle', key: 'vehicleNo' }
    ]},
    { title: 'Job Description', fields: [
      { label: 'Description', key: 'jobDescription' }
    ]},
    { title: 'Pricing Breakdown', fields: [
      { label: 'Units', key: 'totalUnits' },
      { label: 'Unit Type', key: 'unitType' },
      { label: 'Rate / Unit', key: 'ratePerUnit' },
      { label: 'Transport', key: 'transportCharge' },
      { label: 'Other Charges', key: 'otherCharges' },
      { label: 'Other Desc', key: 'otherChargesDescription' },
      { label: 'Grand Total', key: 'totalAmount' },
      { label: 'Status', key: 'status' }
    ]}
  ];

  const quotationFields = [
    { title: 'Quotation Basics', fields: [
      { label: 'Quote Number', key: 'quotationNo' },
      { label: 'Date', key: 'date' },
      { label: 'Client Name', key: 'clientName' },
      { label: 'Validity', key: 'validityDays' }
    ]},
    { title: 'Vehicle Specifications', fields: [
      { label: 'Vehicle Type', key: 'vehicleType' },
      { label: 'Vehicle No', key: 'vehicleNo' },
      { label: 'Max Height', key: 'maxHeight' },
      { label: 'Max Weight', key: 'maxWeight' }
    ]},
    { title: 'Pricing Offer', fields: [
      { label: 'Min Charge', key: 'mandatoryCharge' },
      { label: 'Transport', key: 'transportCharge' },
      { label: 'Extra Hr Rate', key: 'extraHourRate' },
      { label: 'Estimated Total', key: 'estimatedTotal' },
      { label: 'Status', key: 'status' }
    ]},
    { title: 'Terms & Conditions', fields: [
      { label: 'Terms', key: 'termsAndConditions' }
    ]}
  ];

  const dieselFields = [
    { title: 'Fueling Details', fields: [
      { label: 'Date', key: 'date' },
      { label: 'Vehicle', key: 'vehicle' },
      { label: 'Driver / Staff', key: 'employee' }
    ]},
    { title: 'Consumption', fields: [
      { label: 'Liters', key: 'liters' },
      { label: 'Price / L', key: 'pricePerLiter' },
      { label: 'Total Cost', key: 'total' },
      { label: 'Odometer', key: 'odometer' }
    ]},
    { title: 'Management', fields: [
      { label: 'Notes', key: 'note' },
      { label: 'Status', key: 'status' }
    ]}
  ];
  
  const salaryFields = [
    { title: 'Employee Information', fields: [
      { label: 'Pay Month', key: 'month' },
      { label: 'Employee Name', key: 'employee' },
      { label: 'Primary Vehicle', key: 'vehicle' }
    ]},
    { title: 'Financial Breakdown', fields: [
      { label: 'Basic Salary', key: 'basic' },
      { label: 'Incentives / Bonuses', key: 'incentive' },
      { label: 'Advance Deductions', key: 'advance' },
      { label: 'Net Payable Amount', key: 'netPay' }
    ]}
  ];

  const sectionsMap = {
    'hire': hireFields,
    'payment': paymentFields,
    'diesel': dieselFields,
    'invoice': invoiceFields,
    'quotation': quotationFields,
    'salary': salaryFields
  };

  const sections = sectionsMap[type] || [];

  return (
    <div className="details-overlay">
      {(type === 'invoice' || type === 'quotation') && (
        <div className="detail-actions-header">
          <button 
            className="download-pdf-btn" 
            onClick={() => type === 'invoice' ? generateInvoicePDF(data) : generateQuotationPDF(data)}
          >
            <Download size={18} /> <span>Download Professional PDF</span>
          </button>
        </div>
      )}
      {sections.map((s, i) => <DetailSection key={i} title={s.title} fields={s.fields} />)}
    </div>
  );
};

export default RecordDetails;
