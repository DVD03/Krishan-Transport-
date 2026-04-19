import React, { useState, useEffect } from 'react';
import { vehicleAPI, clientAPI } from '../services/api';

const defaultForm = () => ({
  date:          new Date().toISOString().split('T')[0],
  client:        '',
  vehicle:       '',
  location:      '',
  startTime:     '',
  endTime:       '',
  restTime:      0,
  totalHours:    0,
  minimumHours:  0,
  hoursInBill:   0,
  commission:    0,
  dayPayment:    0,
  takenAmount:   0,
  hireAmount:    0,
  paidAmount:    0,
  balance:       0,
  status:        'Pending'
});

const PaymentForm = ({ onSubmit, onCancel, initialData }) => {
  const [vehicles, setVehicles] = useState([]);
  const [clients, setClients]   = useState([]);
  const [formData, setFormData] = useState(
    initialData
      ? { ...defaultForm(), ...initialData, date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }
      : defaultForm()
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, cliRes] = await Promise.all([vehicleAPI.get(), clientAPI.get()]);
        setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
        setClients(Array.isArray(cliRes.data)  ? cliRes.data  : []);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calc total hours from start/end/rest
      if (name === 'startTime' || name === 'endTime' || name === 'restTime') {
        const start = name === 'startTime' ? value : updated.startTime;
        const end   = name === 'endTime'   ? value : updated.endTime;
        const rest  = parseFloat(name === 'restTime' ? value : updated.restTime) || 0;
        if (start && end) {
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let totalMins = (eh * 60 + em) - (sh * 60 + sm);
          if (totalMins < 0) totalMins += 1440;
          totalMins -= rest;
          updated.totalHours = Math.max(0, +(totalMins / 60).toFixed(2));
        }
      }

      // Auto-calc hours in bill (total - minimum, minimum 0)
      if (name === 'totalHours' || name === 'minimumHours') {
        const th = parseFloat(name === 'totalHours'   ? value : updated.totalHours) || 0;
        const mh = parseFloat(name === 'minimumHours' ? value : updated.minimumHours) || 0;
        updated.hoursInBill = Math.max(0, +(th - mh).toFixed(2));
      }

      // Auto-calc balance and status
      const hire    = parseFloat(updated.hireAmount)    || 0;
      const paid    = parseFloat(updated.paidAmount)    || 0;
      const taken   = parseFloat(updated.takenAmount)   || 0;
      const comm    = parseFloat(updated.commission)    || 0;
      const dayPay  = parseFloat(updated.dayPayment)    || 0;
      const net     = hire - comm - dayPay - taken;
      updated.balance = +net.toFixed(2);
      updated.status  = updated.balance <= 0 ? 'Paid' : 'Pending';

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
            <select name="vehicle" value={formData.vehicle} onChange={handleChange}>
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

      {/* ── SECTION 2: TIME ── */}
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
            <label>Total Hours (Auto)</label>
            <input type="number" name="totalHours" value={formData.totalHours} onChange={handleChange} step="0.01" style={{ background: '#e0f2fe', fontWeight: '700' }} />
          </div>
        </div>
      </div>

      {/* ── SECTION 3: PAYMENT DETAILS ── */}
      <div style={sectionStyle}>
        <p style={sectionTitle}>💰 Payment Breakdown</p>
        <div className="form-row">
          <div className="form-group">
            <label>Minimum Hours</label>
            <input type="number" name="minimumHours" value={formData.minimumHours} onChange={handleChange} step="0.01" min="0" />
          </div>
          <div className="form-group">
            <label>Hours in Bill (Auto)</label>
            <input type="number" name="hoursInBill" value={formData.hoursInBill} onChange={handleChange} step="0.01" style={{ background: '#fef9c3' }} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Hire Amount (LKR)</label>
            <input type="number" name="hireAmount" value={formData.hireAmount} onChange={handleChange} min="0" required />
          </div>
          <div className="form-group">
            <label>Commission (LKR)</label>
            <input type="number" name="commission" value={formData.commission} onChange={handleChange} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Day Payment (LKR)</label>
            <input type="number" name="dayPayment" value={formData.dayPayment} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Taken Amount (LKR)</label>
            <input type="number" name="takenAmount" value={formData.takenAmount} onChange={handleChange} min="0" />
          </div>
          <div className="form-group">
            <label>Paid Amount (LKR)</label>
            <input type="number" name="paidAmount" value={formData.paidAmount} onChange={handleChange} min="0" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label style={{ color: formData.balance > 0 ? '#dc2626' : '#16a34a', fontWeight: '700' }}>Balance (Auto)</label>
            <input type="number" name="balance" value={formData.balance} readOnly style={{ background: formData.balance > 0 ? '#fee2e2' : '#dcfce7', fontWeight: '800', cursor: 'not-allowed' }} />
          </div>
          <div className="form-group">
            <label>Status (Auto)</label>
            <input type="text" value={formData.status} readOnly style={{ background: formData.status === 'Paid' ? '#dcfce7' : '#fef9c3', fontWeight: '700', cursor: 'not-allowed' }} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="secondary-btn" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary-btn">
          {initialData ? '✅ Update Payment' : '💾 Save Payment'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
