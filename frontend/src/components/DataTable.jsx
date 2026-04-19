import React from 'react';
import './DataTable.css';

const DataTable = ({ columns, data, emptyMessage, loading, onRowClick }) => {
  return (
    <div className="table-container">
      <div className="custom-table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              {columns.map((col, index) => (
                <th key={index}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="loading-cell">
                  <div className="shimmer-loader"></div>
                </td>
              </tr>
            ) : (data && data.length > 0) ? (
              data.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex} 
                    onClick={() => onRowClick && onRowClick(row)}
                    className={onRowClick ? 'clickable-row' : ''}
                  >
                  {columns.map((col, colIndex) => {
                    // Field mapping logic
                    const fieldMap = {
                      'DATE': 'date',
                      'CLIENT': 'client',
                      'VEHICLE': 'vehicle',
                      'LOCATION': 'location',
                      'AMOUNT': 'amount',
                      'COMMISSION': 'commission',
                      'BILL#': 'billNumber',
                      'MONTH': 'month',
                      'EMPLOYEE': 'employee',
                      'BASIC': 'basic',
                      'INCENTIVE': 'incentive',
                      'ADVANCE': 'advance',
                      'NET PAY': 'netPay',
                      'PAID': 'paidAmount',
                      'ACTION': 'action',
                      'LITERS': 'liters',
                      'PRICE/L': 'pricePerLiter_disp',
                      'TOTAL': 'total',
                      'ODOMETER': 'odometer',
                      'NOTE': 'note',
                      'HIRE AMT': 'hireAmount',
                      'PAID AMT': 'paidAmount',
                      'BALANCE': 'balance',
                      'STATUS': 'status',
                      'CLIENT NAME': 'name',
                      'CONTACT': 'contact',
                      'TOTAL HIRES': 'totalHires',
                      'OUTSTANDING': 'outstanding',
                      'VEHICLE NUMBER': 'number',
                      'NAME': 'name',
                      'NIC': 'nic',
                      'ROLE': 'role',
                      'JOINED': 'joined',
                      // Hire Book - New Fields
                      'COMPANY': 'client',
                      'DRIVER': 'driverName',
                      'HOURS': 'workingHours',
                      'BILL AMT': 'billAmount',
                      'TOTAL': 'totalAmount_disp',
                      // Payment Book - New Fields
                      'TOTAL HOURS': 'totalHours',
                      'MIN HRS': 'minimumHours',
                      'HOURS IN BILL': 'hoursInBill',
                      'COMMISSION': 'commission',
                      'DAY PAY': 'dayPayment',
                      'TAKEN': 'takenAmount',
                      'START': 'startTime',
                      'END': 'endTime',
                      'REST': 'restTime',
                      'D COST': 'dieselCost',
                      'COMM': 'commission',
                      'REMARKS': 'details',
                      'HELPER': 'helperName',
                      'TS#': 'timeSheetNumber',
                      'UNITS': 'totalUnits',
                      'RATE': 'ratePerUnit',
                      'TRANSPORT': 'transportCharge',
                      'DESCRIPTION': 'jobDescription',
                      'SITE': 'site'
                    };
                    
                    const keyToUse = fieldMap[col] || col.toLowerCase();
                    const value = row[keyToUse];
                    
                    return (
                      <td key={colIndex}>
                        {value !== undefined && value !== null ? value : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="empty-row">
                  <div className="empty-content">
                    <div className="empty-icon">📂</div>
                    <p>{emptyMessage || 'No records found.'}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
