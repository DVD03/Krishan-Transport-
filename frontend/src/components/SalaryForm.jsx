import React, { useState, useEffect } from 'react';
import { vehicleAPI, employeeAPI } from '../services/api';
import '../styles/forms.css';

const SalaryForm = ({ onSubmit, onCancel, initialData }) => {
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [formData, setFormData] = useState(initialData || {
    month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
    employee: '',
    vehicle: '',
    basic: '',
    incentive: '',
    advance: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData
      });
    } else {
      setFormData({
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        employee: '',
        vehicle: '',
        basic: '',
        incentive: '',
        advance: ''
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vRes, eRes] = await Promise.all([vehicleAPI.get(), employeeAPI.get()]);
        setVehicles(Array.isArray(vRes.data) ? vRes.data : []);
        setEmployees(Array.isArray(eRes.data) ? eRes.data : []);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const netPay = parseFloat(formData.basic || 0) + parseFloat(formData.incentive || 0) - parseFloat(formData.advance || 0);
    onSubmit({ ...formData, netPay });
  };

  const netPay_val = parseFloat(formData.basic || 0) + parseFloat(formData.incentive || 0) - parseFloat(formData.advance || 0);

  return (
    <form className="hire-form" onSubmit={handleSubmit}>
      <div className="hire-form-scroll">
        
        <div className="form-section">
          <p className="form-section-title">Record Details</p>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Payroll Month *</label>
              <input type="text" name="month" value={formData.month} onChange={handleChange} required placeholder="e.g. April 2026" />
            </div>
            <div className="form-group">
              <label>Assigned Vehicle</label>
              <select name="vehicle" value={formData.vehicle} onChange={handleChange}>
                <option value="">Select a Vehicle</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v.number}>{v.number}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Employee Name *</label>
            <select name="employee" value={formData.employee} onChange={handleChange} required>
              <option value="">Select Employee</option>
              {employees.filter(e => e.status === 'Active').map(e => (
                <option key={e._id} value={e.name}>{e.name} — {e.role}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <p className="form-section-title">Earnings & Deductions</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Basic Pay (LKR) *</label>
              <input type="number" name="basic" value={formData.basic} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label>Incentives (LKR)</label>
              <input type="number" name="incentive" value={formData.incentive} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Advance Deduction (LKR)</label>
              <input type="number" name="advance" value={formData.advance} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group" style={{ marginTop: '20px' }}>
             <label>Net Payable (LKR)</label>
             <input type="number" value={netPay_val} readOnly className="input-highlight-green" />
          </div>
        </div>

      </div>

      <div className="hire-form-footer">
        <div className="total-display">
          <span>Net Salary</span>
          <strong>LKR {netPay_val.toLocaleString()}</strong>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn">{initialData ? 'Update Payroll' : 'Save Payroll Record'}</button>
        </div>
      </div>
    </form>
  );
};

export default SalaryForm;
