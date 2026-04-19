import React, { useState, useEffect } from 'react';
import { vehicleAPI, clientAPI, employeeAPI } from '../services/api';

const defaultForm = () => ({
  date:            new Date().toISOString().split('T')[0],
  client:          '',
  vehicle:         '',
  location:        '',
  driverName:      '',
  helperName:      '',
  startTime:       '',
  endTime:         '',
  restTime:        0,
  workingHours:    0,
  minimumHours:    0,
  oneHourFee:      0,
  extraHours:      0,
  extraHourFee:    0,
  transportFee:    0,
  dieselCost:      0,
  billAmount:      0,
  commission:      0,
  timeSheetNumber: '',
  billNumber:      '',
  totalAmount:     0,
  details:         '',
  status:          'Pending'
});

const HireForm = ({ onSubmit, onCancel, initialData }) => {
  const [vehicles, setVehicles]   = useState([]);
  const [clients, setClients]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData]   = useState(
    initialData
      ? { ...defaultForm(), ...initialData, date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }
      : defaultForm()
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, cliRes, empRes] = await Promise.all([
          vehicleAPI.get(), clientAPI.get(), employeeAPI.get()
        ]);
        setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
        setClients(Array.isArray(cliRes.data)  ? cliRes.data  : []);
        setEmployees(Array.isArray(empRes.data) ? empRes.data  : []);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      // Auto-calculate working hours from start/end + rest
      if (name === 'startTime' || name === 'endTime' || name === 'restTime') {
        const start = name === 'startTime' ? value : updated.startTime;
        const end   = name === 'endTime'   ? value : updated.endTime;
        const rest  = parseFloat(name === 'restTime' ? value : updated.restTime) || 0;
        if (start && end) {
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let totalMins = (eh * 60 + em) - (sh * 60 + sm);
          if (totalMins < 0) totalMins += 1440; // past midnight
          totalMins -= rest;
          updated.workingHours = Math.max(0, +(totalMins / 60).toFixed(2));
        }
      }
      // Auto-calculate extra hours
      if (name === 'workingHours' || name === 'minimumHours') {
        const wh = parseFloat(name === 'workingHours' ? value : updated.workingHours) || 0;
        const mh = parseFloat(name === 'minimumHours'  ? value : updated.minimumHours) || 0;
        updated.extraHours = Math.max(0, +(wh - mh).toFixed(2));
      }
      // Auto-calculate bill amount
      const mh  = parseFloat(updated.minimumHours)  || 0;
      const ohf = parseFloat(updated.oneHourFee)    || 0;
      const eh  = parseFloat(updated.extraHours)    || 0;
      const ehf = parseFloat(updated.extraHourFee)  || 0;
      const tf  = parseFloat(updated.transportFee)  || 0;
      updated.billAmount = +(mh * ohf + eh * ehf + tf).toFixed(2);
      // Total = bill + diesel - commission
      const dc  = parseFloat(updated.dieselCost)    || 0;
      const com = parseFloat(updated.commission)    || 0;
      updated.totalAmount = +(updated.billAmount + dc - com).toFixed(2);
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const sectionStyle = { 
    background: '#f8fafc', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px', 
    padding: '16px', 
    marginBottom: '16px' 
  };
  const sectionTitle = { 
    fontSize: '12px', 
    fontWeight: '700', 
    textTransform: 'uppercase', 
    color: '#64748b', 
    marginBottom: '12px', 
    letterSpacing: '0.05em' 
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit} style={{ maxHeight: '80vh', overflowY: 'auto', paddingRight: '4px' }}>

      {/* ── SECTION 1: BASIC INFO ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>📋 Basic Information</p>
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Bill Number</label>
            <input type="text" name="billNumber" value={formData.billNumber} onChange={handleChange} placeholder="e.g. BL-2607" />
          </div>
          <div className="form-group">
            <label>Time Sheet No</label>
            <input type="text" name="timeSheetNumber" value={formData.timeSheetNumber} onChange={handleChange} placeholder="e.g. TS-001" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Company Name</label>
            <select name="client" value={formData.client} onChange={handleChange} required>
              <option value="">Select a Client</option>
              {clients.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Vehicle Number</label>
            <select name="vehicle" value={formData.vehicle} onChange={handleChange} required>
              <option value="">Select Vehicle</option>
              {vehicles.map(v => <option key={v._id} value={v.number}>{v.number}</option>)}
            </select>
          </div>
        </div>
        <div className="form-group">
          <label>Location / Site</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Colombo" />
        </div>
      </div>

      {/* ── SECTION 2: PERSONNEL ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>👷 Personnel</p>
        <div className="form-row">
          <div className="form-group">
            <label>Driver Name</label>
            <input type="text" name="driverName" value={formData.driverName} onChange={handleChange} placeholder="Driver's full name" />
          </div>
          <div className="form-group">
            <label>Helper Name</label>
            <input type="text" name="helperName" value={formData.helperName} onChange={handleChange} placeholder="Helper's full name" />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: TIME ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>⏱ Time Tracking</p>
        <div className="form-row">
          <div className="form-group">
            <label>Start Time</label>
            <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>End Time</label>
            <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Rest Time (min)</label>
            <input type="number" name="restTime" value={formData.restTime} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Working Hours</label>
            <input type="number" name="workingHours" value={formData.workingHours} onChange={handleChange} step="0.01" style={{ background: '#e0f2fe', fontWeight: '700' }} />
          </div>
        </div>
      </div>

      {/* ── SECTION 4: BILLING ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>💰 Billing Breakdown (Auto-Calculated)</p>
        <div className="form-row">
          <div className="form-group">
            <label>Minimum Hours</label>
            <input type="number" name="minimumHours" value={formData.minimumHours} onChange={handleChange} step="0.01" min="0" />
          </div>
          <div className="form-group">
            <label>One Hour Fee (LKR)</label>
            <input type="number" name="oneHourFee" value={formData.oneHourFee} onChange={handleChange} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Extra Hours</label>
            <input type="number" name="extraHours" value={formData.extraHours} onChange={handleChange} step="0.01" style={{ background: '#fef9c3' }} />
          </div>
          <div className="form-group">
            <label>Extra Hour Fee (LKR)</label>
            <input type="number" name="extraHourFee" value={formData.extraHourFee} onChange={handleChange} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Transport Fee (LKR)</label>
            <input type="number" name="transportFee" value={formData.transportFee} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Diesel Cost (LKR)</label>
            <input type="number" name="dieselCost" value={formData.dieselCost} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Commission (LKR)</label>
            <input type="number" name="commission" value={formData.commission} onChange={handleChange} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Bill Amount (Auto)</label>
            <input type="number" name="billAmount" value={formData.billAmount} readOnly style={{ background: '#dcfce7', fontWeight: '700', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label style={{ color: '#2563EB', fontWeight: '700' }}>TOTAL AMOUNT (Auto)</label>
            <input type="number" name="totalAmount" value={formData.totalAmount} readOnly style={{ background: '#dbeafe', fontWeight: '800', fontSize: '1.1rem', cursor: 'not-allowed' }} />
          </div>
        </div>
      </div>

      {/* ── SECTION 5: DETAILS ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>📝 Additional Details</p>
        <div className="form-group">
          <label>Details / Remarks</label>
          <textarea name="details" value={formData.details} onChange={handleChange} rows="3" placeholder="Add any notes or details..." style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', resize: 'vertical' }} />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-btn">
          {initialData ? '✅ Update Job' : '💾 Save Job'}
        </button>
      </div>
    </form>
  );
};

export default HireForm;
