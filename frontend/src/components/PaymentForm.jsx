import React, { useState, useEffect } from 'react';
import { vehicleAPI, clientAPI, paymentAPI } from '../services/api';
import '../styles/books.css';
import '../styles/forms.css';

/* ─── Helpers ──────────────────────────────────────────────── */
const blank = () => ({
  date:         new Date().toISOString().split('T')[0],
  client:       '',
  vehicle:      '',
  location:     '',
  startTime:    '',
  endTime:      '',
  restTime:     0,
  totalHours:   0,
  minimumHours: 0,
  hoursInBill:  0,
  hireAmount:   0,
  commission:   0,
  dayPayment:   0,
  takenAmount:  0,
  paidAmount:   0,
  balance:      0,
  status:       'Pending',
});

const fromDB = (d) => ({
  ...blank(),
  ...d,
  date:       d?.date ? new Date(d.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  restTime:   d?.restTime   ?? 0,
  totalHours: d?.totalHours ?? 0,
  minimumHours: d?.minimumHours ?? 0,
  hoursInBill:  d?.hoursInBill  ?? 0,
  hireAmount:   d?.hireAmount   ?? 0,
  commission:   d?.commission   ?? 0,
  dayPayment:   d?.dayPayment   ?? 0,
  takenAmount:  d?.takenAmount  ?? 0,
  balance:      d?.balance      ?? 0,
});

/* Auto-calculate hours & balance — does NOT touch status */
const compute = (f) => {
  const next = { ...f };

  // Total hours from start/end/rest
  if (next.startTime && next.endTime) {
    const [sh, sm] = next.startTime.split(':').map(Number);
    const [eh, em] = next.endTime.split(':').map(Number);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 1440; // overnight
    mins = Math.max(0, mins - (parseFloat(next.restTime) || 0));
    next.totalHours = +(mins / 60).toFixed(2);
  }

  // Hours in bill = total - minimum
  const th = parseFloat(next.totalHours)   || 0;
  const mh = parseFloat(next.minimumHours) || 0;
  next.hoursInBill = Math.max(0, +(th - mh).toFixed(2));

  // Balance = hire - commission - dayPayment - takenAmount
  const hire   = parseFloat(next.hireAmount)  || 0;
  const comm   = parseFloat(next.commission)  || 0;
  const dayPay = parseFloat(next.dayPayment)  || 0;
  const taken  = parseFloat(next.takenAmount) || 0;
  next.balance = +(hire - comm - dayPay - taken).toFixed(2);

  // ⚠️ Status is NOT auto-set here — user controls it manually via dropdown

  return next;
};

/* Suggested status based on balance (for hint only, not forced) */
const suggestStatus = (f) => {
  const hire = parseFloat(f.hireAmount) || 0;
  return hire > 0 && (parseFloat(f.balance) || 0) <= 0 ? 'Paid' : 'Pending';
};

/* ─── Component ─────────────────────────────────────────────── */
const PaymentForm = ({ onSubmit, onCancel, initialData }) => {
  /* Reference data */
  const [vehicles,  setVehicles]  = useState([]);
  const [clients,   setClients]   = useState([]);
  const [prevJobs,  setPrevJobs]  = useState([]); // for auto-fill

  /* Form state */
  const [form, setForm] = useState(initialData ? fromDB(initialData) : blank());

  /* Re-sync when switching edit targets */
  useEffect(() => {
    setForm(initialData ? fromDB(initialData) : blank());
  }, [initialData]);

  /* Load reference data */
  useEffect(() => {
    const load = async () => {
      try {
        const [vR, cR, pR] = await Promise.all([
          vehicleAPI.get(),
          clientAPI.get(),
          paymentAPI.get(),
        ]);

        setVehicles(Array.isArray(vR.data) ? vR.data : []);
        setClients (Array.isArray(cR.data) ? cR.data : []);
        setPrevJobs(Array.isArray(pR.data) ? pR.data : []);
      } catch (err) {
        console.error('PaymentForm load error:', err);
      }
    };
    load();
  }, []);

  /* Handle any field change */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => {
      const next = { ...prev, [name]: value };

      /* Smart auto-fill on vehicle select (only in Add mode) */
      if (name === 'vehicle' && value && !initialData) {
        const last = prevJobs
          .filter(j => j.vehicle === value)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (last) {
          // no driver/helper autofill
        }
      }

      /* Smart auto-fill on client select (only in Add mode) */
      if (name === 'client' && value && !initialData) {
        const last = prevJobs
          .filter(j => j.client === value)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (last) {
          if (!prev.location)     next.location     = last.location     || '';
          if (!prev.minimumHours) next.minimumHours = last.minimumHours || 0;
        }
      }

      return compute(next);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ ...form });
  };

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="hire-form">
      <div className="hire-form-scroll">

        {/* ── Section 1: Logistics ─────────────────────── */}
        <div className="form-section">
          <p className="form-section-title">Logistics Information</p>
          <div className="form-grid">

            <div className="form-group">
              <label>Date *</label>
              <input type="date" name="date" value={form.date} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <select name="client" value={form.client} onChange={handleChange} required>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Vehicle Number</label>
              <select name="vehicle" value={form.vehicle} onChange={handleChange}>
                <option value="">— Select Vehicle —</option>
                {vehicles.map(v => <option key={v._id} value={v.number}>{v.number}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Location / Site</label>
              <input type="text" name="location" value={form.location} onChange={handleChange} placeholder="e.g. Colombo" />
            </div>

          </div>
        </div>

        {/* ── Section 2: Time Tracking ─────────────────── */}
        <div className="form-section">
          <p className="form-section-title">Time Tracking</p>
          <div className="form-grid">

            <div className="form-group">
              <label>Start Time</label>
              <input type="time" name="startTime" value={form.startTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input type="time" name="endTime" value={form.endTime} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Rest Time (min)</label>
              <input type="number" name="restTime" value={form.restTime} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Total Hours <span style={{color:'#2563EB',fontSize:'11px'}}>(auto)</span></label>
              <input type="number" value={form.totalHours} readOnly className="input-highlight-blue" />
            </div>

            <div className="form-group">
              <label>Minimum Hours</label>
              <input type="number" name="minimumHours" value={form.minimumHours} onChange={handleChange} step="0.5" min="0" />
            </div>

            <div className="form-group">
              <label>Hours in Bill <span style={{color:'#D97706',fontSize:'11px'}}>(auto)</span></label>
              <input type="number" value={form.hoursInBill} readOnly className="input-highlight-gold" />
            </div>

          </div>
        </div>

        {/* ── Section 3: Payment Breakdown ─────────────── */}
        <div className="form-section">
          <p className="form-section-title">Payment Breakdown</p>
          <div className="form-grid">

            <div className="form-group">
              <label>Hire Amount (LKR) *</label>
              <input type="number" name="hireAmount" value={form.hireAmount} onChange={handleChange} min="0" required />
            </div>

            <div className="form-group">
              <label>Commission (LKR)</label>
              <input type="number" name="commission" value={form.commission} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Day Payment (LKR)</label>
              <input type="number" name="dayPayment" value={form.dayPayment} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Taken Amount (LKR)</label>
              <input type="number" name="takenAmount" value={form.takenAmount} onChange={handleChange} min="0" />
            </div>

            <div className="form-group">
              <label>Balance (LKR) <span style={{color:'#D97706',fontSize:'11px'}}>(auto)</span></label>
              <input type="number" value={form.balance} readOnly
                className={form.balance > 0 ? 'input-highlight-gold' : 'input-highlight-green'} />
            </div>

            <div className="form-group">
              <label>
                Payment Status
                {suggestStatus(form) !== form.status && (
                  <span style={{ marginLeft: '8px', fontSize: '11px', color: '#2563EB', fontWeight: '500' }}>
                    ↑ Suggest: {suggestStatus(form)}
                  </span>
                )}
              </label>
              <select name="status" value={form.status} onChange={handleChange}
                className={form.status === 'Paid' ? 'input-highlight-green' : 'input-highlight-gold'}>
                <option value="Pending">Pending</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
              </select>
            </div>

          </div>
        </div>

      </div>

      {/* ── Sticky Footer ────────────────────────────────── */}
      <div className="hire-form-footer">
        <div className="total-display">
          <span>Hire Amount</span>
          <strong style={{ color: '#1E40AF' }}>LKR {Number(form.hireAmount || 0).toLocaleString()}</strong>
          <span style={{ margin: '0 12px', color: '#94A3B8' }}>|</span>
          <span>Balance</span>
          <strong style={{ color: form.balance > 0 ? '#DC2626' : '#059669' }}>
            LKR {Number(form.balance).toLocaleString()}
          </strong>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn">
            {initialData ? 'Update Payment' : 'Save Payment'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default PaymentForm;
