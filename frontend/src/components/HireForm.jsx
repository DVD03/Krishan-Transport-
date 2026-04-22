import React, { useState, useEffect } from 'react';
import { vehicleAPI, clientAPI, employeeAPI, hireAPI } from '../services/api';
import '../styles/books.css';
import '../styles/forms.css';

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
  const [previousJobs, setPreviousJobs] = useState([]);
  const [formData, setFormData]   = useState(
    initialData
      ? { ...defaultForm(), ...initialData, date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0] }
      : defaultForm()
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultForm(),
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setFormData(defaultForm());
    }
  }, [initialData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vehRes, cliRes, empRes, hireRes] = await Promise.all([
          vehicleAPI.get(), clientAPI.get(), employeeAPI.get(), hireAPI.get()
        ]);
        setVehicles(Array.isArray(vehRes.data) ? vehRes.data : []);
        setClients(Array.isArray(cliRes.data)  ? cliRes.data  : []);
        setEmployees(Array.isArray(empRes.data) ? empRes.data  : []);
        setPreviousJobs(Array.isArray(hireRes.data) ? hireRes.data : []);
      } catch (err) { console.error(err); }
    };
    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      if (['startTime', 'endTime', 'restTime'].includes(name)) {
        const start = name === 'startTime' ? value : updated.startTime;
        const end   = name === 'endTime'   ? value : updated.endTime;
        const rest  = parseFloat(name === 'restTime' ? value : updated.restTime) || 0;
        if (start && end) {
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          let totalMins = (eh * 60 + em) - (sh * 60 + sm);
          if (totalMins < 0) totalMins += 1440; 
          totalMins -= rest;
          updated.workingHours = Math.max(0, +(totalMins / 60).toFixed(2));
        }
      }

      if (['workingHours', 'minimumHours'].includes(name)) {
        const wh = parseFloat(name === 'workingHours' ? value : updated.workingHours) || 0;
        const mh = parseFloat(name === 'minimumHours'  ? value : updated.minimumHours) || 0;
        updated.extraHours = Math.max(0, +(wh - mh).toFixed(2));
      }

      const mh  = parseFloat(updated.minimumHours)  || 0;
      const ohf = parseFloat(updated.oneHourFee)    || 0;
      const eh  = parseFloat(updated.extraHours)    || 0;
      const ehf = parseFloat(updated.extraHourFee)  || 0;
      const tf  = parseFloat(updated.transportFee)  || 0;
      updated.billAmount = +(mh * ohf + eh * ehf + tf).toFixed(2);

      const dc  = parseFloat(updated.dieselCost)  || 0;
      const com = parseFloat(updated.commission)  || 0;
      updated.totalAmount = +(updated.billAmount + dc - com).toFixed(2);

      if (name === 'vehicle' && value && !initialData) {
        const lastJob = previousJobs
          .filter(j => j.vehicle === value)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (lastJob) {
          updated.driverName = lastJob.driverName || '';
        }
      }

      if (name === 'client' && value && !initialData) {
        const lastJob = previousJobs
          .filter(j => j.client === value)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (lastJob) {
          updated.location = lastJob.location || '';
          updated.minimumHours = lastJob.minimumHours || 0;
          updated.oneHourFee = lastJob.oneHourFee || 0;
          updated.extraHourFee = lastJob.extraHourFee || 0;
        }
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const driversList = employees.filter(emp => emp.role === 'Driver' && emp.status === 'Active');
  const helpersList = employees.filter(emp => emp.role === 'Helper' && emp.status === 'Active');

  return (
    <form onSubmit={handleSubmit} className="hire-form">
      <div className="hire-form-scroll">
        
        {/* Basic Information */}
        <div className="form-section">
          <p className="form-section-title">Basic Information</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Date *</label>
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
          <div className="form-grid" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Company Name *</label>
              <select name="client" value={formData.client} onChange={handleChange} required>
                <option value="">Select Client</option>
                {clients.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Vehicle Number *</label>
              <select name="vehicle" value={formData.vehicle} onChange={handleChange} required>
                <option value="">Select Vehicle</option>
                {vehicles.map(v => <option key={v._id} value={v.number}>{v.number}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Location / Site</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Colombo" />
            </div>
          </div>
        </div>

        {/* Personnel */}
        <div className="form-section">
          <p className="form-section-title">Personnel</p>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Driver Name</label>
              <select name="driverName" value={formData.driverName} onChange={handleChange}>
                <option value="">Select Driver</option>
                {driversList.map(emp => <option key={emp._id} value={emp.name}>{emp.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Helper Name</label>
              <select name="helperName" value={formData.helperName} onChange={handleChange}>
                <option value="">Select Helper</option>
                {helpersList.map(emp => <option key={emp._id} value={emp.name}>{emp.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Time Tracking */}
        <div className="form-section">
          <p className="form-section-title">Time Tracking</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Start Time</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Rest (min)</label>
              <input type="number" name="restTime" value={formData.restTime} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Work Hours (Auto)</label>
              <input type="number" name="workingHours" value={formData.workingHours} readOnly className="input-highlight-blue" />
            </div>
          </div>
        </div>

        {/* Billing */}
        <div className="form-section">
          <p className="form-section-title">Financials (Calculated)</p>
          <div className="form-grid">
            <div className="form-group">
              <label>Min Hours</label>
              <input type="number" name="minimumHours" value={formData.minimumHours} onChange={handleChange} step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label>Rate / Hour (LKR)</label>
              <input type="number" name="oneHourFee" value={formData.oneHourFee} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Extra Hours (Auto)</label>
              <input type="number" name="extraHours" value={formData.extraHours} readOnly className="input-highlight-gold" />
            </div>
            <div className="form-group">
              <label>Extra Rate (LKR)</label>
              <input type="number" name="extraHourFee" value={formData.extraHourFee} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="form-grid" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Fuel Cost (LKR)</label>
              <input type="number" name="dieselCost" value={formData.dieselCost} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Transport Fee (LKR)</label>
              <input type="number" name="transportFee" value={formData.transportFee} onChange={handleChange} min="0" />
            </div>
            <div className="form-group">
              <label>Commission (LKR)</label>
              <input type="number" name="commission" value={formData.commission} onChange={handleChange} min="0" />
            </div>
          </div>
        </div>

        {/* Notes & Status */}
        <div className="form-section">
          <p className="form-section-title">Additional Details</p>
          <div className="form-group">
            <label>Details / Remarks</label>
            <textarea name="details" value={formData.details} onChange={handleChange} rows="3" placeholder="Add any notes..." />
          </div>
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label>Status</label>
            <select name="status" value={formData.status} onChange={handleChange}>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Paid">Paid</option>
            </select>
          </div>
        </div>

      </div>

      {/* Sticky Footer */}
      <div className="hire-form-footer">
        <div className="total-display">
          <span>Final Total Amount</span>
          <strong>LKR {Number(formData.totalAmount).toLocaleString()}</strong>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn">{initialData ? 'Update Job' : 'Save Hire Job'}</button>
        </div>
      </div>
    </form>
  );
};

export default HireForm;
