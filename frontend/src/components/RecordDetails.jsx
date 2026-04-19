import React from 'react';

const RecordDetails = ({ data, type }) => {
  if (!data) return null;

  const DetailSection = ({ title, fields }) => (
    <div style={{ marginBottom: '24px' }}>
      <h4 style={{ 
        fontSize: '0.75rem', 
        fontWeight: '700', 
        color: '#64748B', 
        textTransform: 'uppercase', 
        letterSpacing: '0.05em',
        marginBottom: '12px',
        paddingBottom: '6px',
        borderBottom: '1px solid #E2E8F0'
      }}>
        {title}
      </h4>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '16px' 
      }}>
        {fields.map((f, i) => (
          <div key={i}>
            <label style={{ fontSize: '0.72rem', color: '#94A3B8', display: 'block', marginBottom: '2px' }}>
              {f.label}
            </label>
            <p style={{ fontSize: '0.9rem', color: '#1E293B', fontWeight: '600', margin: 0 }}>
              {data[f.key] !== undefined && data[f.key] !== '' ? data[f.key] : '—'}
            </p>
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
      { label: 'Diesel Cost', key: 'dieselCost' },
      { label: 'Commission', key: 'commission' },
      { label: 'Total Amount', key: 'totalAmount_disp' }
    ]},
    { title: 'Additional Details', fields: [
        { label: 'Notes', key: 'details' },
        { label: 'Status', key: 'status_text' }
    ]}
  ];

  const paymentFields = [
    { title: 'Payment Information', fields: [
      { label: 'Date', key: 'date' },
      { label: 'Client', key: 'client' },
      { label: 'Vehicle', key: 'vehicle' },
      { label: 'Location', key: 'location' },
      { label: 'Driver', key: 'driverName' }
    ]},
    { title: 'Hire Reference Details', fields: [
      { label: 'Start Time', key: 'startTime' },
      { label: 'End Time', key: 'endTime' },
      { label: 'Total Hours', key: 'totalHours' },
      { label: 'Minimum Hours', key: 'minimumHours' },
      { label: 'Hours in Bill', key: 'hoursInBill' }
    ]},
    { title: 'Financial Totals', fields: [
      { label: 'Hire Amount', key: 'hireAmount' },
      { label: 'Commission', key: 'commission' },
      { label: 'Day Payment', key: 'dayPayment' },
      { label: 'Taken Amount', key: 'takenAmount' },
      { label: 'Balance', key: 'balance' },
      { label: 'Status', key: 'status_text' }
    ]}
  ];

  const sections = type === 'hire' ? hireFields : paymentFields;

  return (
    <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
      {sections.map((s, i) => <DetailSection key={i} title={s.title} fields={s.fields} />)}
    </div>
  );
};

export default RecordDetails;
