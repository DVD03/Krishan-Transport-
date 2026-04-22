import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Wallet, Fuel, ArrowDown,
  BarChart, RefreshCw, CheckCircle, Clock, Users,
} from 'lucide-react';
import { hireAPI, dieselAPI, salaryAPI, paymentAPI, invoiceAPI } from '../services/api';
import './Dashboard.css';

/* ── Helpers ────────────────────────────────────────────── */
const fmt = (n) => `LKR ${Number(n || 0).toLocaleString()}`;

/* ── Stat Card ──────────────────────────────────────────── */
const StatCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="stat-card" style={{ '--accent': color }}>
    <div className="stat-icon"><Icon size={24} /></div>
    <div className="stat-info">
      <p className="stat-title">{title}</p>
      <h3 className="stat-value">{value}</h3>
      <p className="stat-subtext">{subtext}</p>
    </div>
  </div>
);

/* ── Salary Row ─────────────────────────────────────────── */
const SalaryRow = ({ s, isEven }) => (
  <div className="salary-row" style={{ background: isEven ? '#F8FAFF' : '#FFFFFF' }}>
    <span className="salary-cell salary-month">{s.month}</span>
    <span className="salary-cell">{s.employee}</span>
    <span className="salary-cell salary-num">{fmt(s.basic)}</span>
    <span className="salary-cell salary-num" style={{ color: '#10B981' }}>
      +{fmt(s.incentive || 0)}
    </span>
    <span className="salary-cell salary-num" style={{ color: '#DC2626' }}>
      -{fmt(s.advance || 0)}
    </span>
    <span className="salary-cell salary-net">{fmt(s.netPay)}</span>
  </div>
);

/* ── Main Dashboard ─────────────────────────────────────── */
const Dashboard = ({ role, name }) => {
  const isAdmin = role === 'Admin' || role === 'Manager';

  const [data, setData]       = useState({ hires: [], diesel: [], salaries: [], payments: [], invoices: [] });
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [h, d, s, p, inv] = await Promise.all([
        hireAPI.get(), dieselAPI.get(), salaryAPI.get(),
        paymentAPI.get(), invoiceAPI.get(),
      ]);
      setData({
        hires:    Array.isArray(h.data)   ? h.data   : [],
        diesel:   Array.isArray(d.data)   ? d.data   : [],
        salaries: Array.isArray(s.data)   ? s.data   : [],
        payments: Array.isArray(p.data)   ? p.data   : [],
        invoices: Array.isArray(inv.data) ? inv.data : [],
      });
      setLastFetch(new Date());
    } catch (err) {
      console.error('Dashboard fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const onV = () => { if (document.visibilityState === 'visible') fetchAll(); };
    const onF = () => fetchAll();
    document.addEventListener('visibilitychange', onV);
    window.addEventListener('focus', onF);
    return () => { document.removeEventListener('visibilitychange', onV); window.removeEventListener('focus', onF); };
  }, []);

  /* ── Salary data filtered for Employee ── */
  const mySalaries = useMemo(() =>
    data.salaries
      .filter(s => !name || s.employee?.toLowerCase().includes(name.toLowerCase()))
      .sort((a, b) => b.month?.localeCompare(a.month || '') || 0),
  [data.salaries, name]);

  const myTotalEarned = useMemo(() =>
    mySalaries.reduce((sum, s) => sum + (parseFloat(s.netPay) || 0), 0),
  [mySalaries]);

  /* ── Salary data for Manager ── */
  const allSalaries = useMemo(() =>
    [...data.salaries].sort((a, b) => b.month?.localeCompare(a.month || '') || 0),
  [data.salaries]);

  /* ── Unique employees with totals (Manager view) ── */
  const employeeSummary = useMemo(() => {
    const map = {};
    data.salaries.forEach(s => {
      const key = s.employee || 'Unknown';
      if (!map[key]) map[key] = { name: key, count: 0, total: 0 };
      map[key].count++;
      map[key].total += parseFloat(s.netPay) || 0;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [data.salaries]);

  /* ── Stats ── */
  const stats = useMemo(() => {
    const totalHireRevenue = data.payments.reduce((s, r) => s + (parseFloat(r.hireAmount)  || 0), 0);
    const totalCollected   = data.payments.reduce((s, r) => s + (parseFloat(r.takenAmount) || 0), 0);
    const totalBalance     = data.payments.reduce((s, r) => s + (parseFloat(r.balance)     || 0), 0);
    const paidCount        = data.payments.filter(r => r.status === 'Paid').length;
    const pendingCount     = data.payments.filter(r => r.status !== 'Paid').length;
    const totalDiesel      = data.diesel.reduce((s, r)   => s + (parseFloat(r.total)  || parseFloat(r.amount) || 0), 0);
    const totalSalary      = data.salaries.reduce((s, r) => s + (parseFloat(r.netPay) || 0), 0);
    const netProfit        = totalHireRevenue - totalSalary - totalDiesel;

    if (!isAdmin) {
      /* Employee: 4 cards → 2×2 grid */
      return [
        { id: 1, title: 'My Jobs',      value: `${data.hires.length}`,         subtext: 'Total assigned',             icon: TrendingUp,  color: '#2563EB' },
        { id: 2, title: 'My Earnings',  value: fmt(myTotalEarned),             subtext: `${mySalaries.length} salary records`, icon: Wallet, color: '#10B981' },
        { id: 3, title: 'Completed',    value: `${data.hires.filter(h => h.status === 'Completed' || h.status === 'Paid').length}`, subtext: 'Completed jobs', icon: CheckCircle, color: '#059669' },
        { id: 4, title: 'Fuel Logs',    value: `${data.diesel.length}`,        subtext: 'Entries logged',             icon: Fuel,        color: '#F59E0B' },
      ];
    }

    /* Admin/Manager: 6 cards → 3×2 grid */
    return [
      { id: 1, title: 'Hire Revenue',        value: fmt(totalHireRevenue), subtext: `${data.payments.length} payment records`,         icon: TrendingUp, color: '#2563EB' },
      { id: 2, title: 'Collected',           value: fmt(totalCollected),   subtext: `${paidCount} paid · ${pendingCount} outstanding`, icon: ArrowDown,  color: '#10B981' },
      { id: 3, title: 'Outstanding Balance', value: fmt(totalBalance),     subtext: 'Receivable from clients',                        icon: Clock,      color: totalBalance > 0 ? '#DC2626' : '#10B981' },
      { id: 4, title: 'Fuel Cost',           value: fmt(totalDiesel),      subtext: `${data.diesel.length} fuel entries`,             icon: Fuel,       color: '#F59E0B' },
      { id: 5, title: 'Total Salaries',      value: fmt(totalSalary),      subtext: `${data.salaries.length} salary records`,        icon: Users,      color: '#8B5CF6' },
      { id: 6, title: 'Net Profit (Est.)',   value: fmt(netProfit),        subtext: 'Revenue − Salaries − Diesel',                   icon: BarChart,   color: netProfit >= 0 ? '#10B981' : '#DC2626' },
    ];
  }, [data, isAdmin, myTotalEarned, mySalaries.length]);

  const recentPayments = useMemo(() =>
    [...data.payments].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
  [data.payments]);

  const recentHires = useMemo(() =>
    [...data.hires].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5),
  [data.hires]);

  return (
    <div className="dashboard-container">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1>
            {!isAdmin ? `Hello, ${name}` : 'Business Overview'}
            {' · '}
            {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
          </h1>
          {lastFetch && (
            <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', fontWeight: 500 }}>
              Last updated: {lastFetch.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            border: '1px solid #BFDBFE', borderRadius: '10px', padding: '8px 16px',
            color: '#2563EB', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
            boxShadow: '0 1px 4px rgba(37,99,235,0.12)', transition: 'all 0.2s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.2)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 4px rgba(37,99,235,0.12)'}
        >
          <RefreshCw size={14} className={loading ? 'spinner' : ''} />
          {loading ? 'Updating…' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat Cards — dynamic grid class ── */}
      <div className={isAdmin ? 'stats-grid' : 'stats-grid stats-grid--2col'}>
        {stats.map(stat => <StatCard key={stat.id} {...stat} />)}
      </div>

      {/* ══════════════════════════════════════════════
          EMPLOYEE VIEW — My Salary History
          ══════════════════════════════════════════════ */}
      {!isAdmin && (
        <div className="recent-activity">
          <div className="section-header">
            <h3>My Salary History</h3>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
              Total Earned: <strong style={{ color: '#10B981' }}>{fmt(myTotalEarned)}</strong>
            </span>
          </div>

          {loading ? (
            <div className="loading-state">Loading salary records…</div>
          ) : mySalaries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" />
              <p>No salary records found for your account.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              {/* Table header */}
              <div className="salary-header">
                <span className="salary-cell salary-month">Month</span>
                <span className="salary-cell">Employee</span>
                <span className="salary-cell salary-num">Basic</span>
                <span className="salary-cell salary-num">Incentive</span>
                <span className="salary-cell salary-num">Advance</span>
                <span className="salary-cell salary-net">Net Pay</span>
              </div>
              <div className="salary-body">
                {mySalaries.map((s, i) => (
                  <SalaryRow key={s._id || i} s={s} isEven={i % 2 === 0} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MANAGER VIEW — Employee Salary Summary
          ══════════════════════════════════════════════ */}
      {isAdmin && (
        <>
          {/* Summary per employee */}
          <div className="recent-activity">
            <div className="section-header">
              <h3>Employee Salary Summary</h3>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                {employeeSummary.length} employees
              </span>
            </div>
            {loading ? (
              <div className="loading-state">Loading…</div>
            ) : employeeSummary.length === 0 ? (
              <div className="empty-state"><div className="empty-icon" /><p>No salary data yet.</p></div>
            ) : (
              <div className="recent-list">
                {employeeSummary.map((e, i) => (
                  <div key={i} className="activity-item">
                    <div className="emp-avatar">
                      {(e.name[0] || '?').toUpperCase()}
                    </div>
                    <div className="activity-details">
                      <p><strong>{e.name}</strong></p>
                      <span>{e.count} salary record{e.count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="activity-value">
                      <div style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '0.9rem' }}>
                        {fmt(e.total)}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#8B5CF6', fontWeight: 600, textAlign: 'right' }}>
                        Total net pay
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Full salary records */}
          <div className="recent-activity">
            <div className="section-header">
              <h3>All Salary Records</h3>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                {allSalaries.length} records
              </span>
            </div>
            {loading ? (
              <div className="loading-state">Loading…</div>
            ) : allSalaries.length === 0 ? (
              <div className="empty-state"><div className="empty-icon" /><p>No salary records yet.</p></div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <div className="salary-header">
                  <span className="salary-cell salary-month">Month</span>
                  <span className="salary-cell">Employee</span>
                  <span className="salary-cell salary-num">Basic</span>
                  <span className="salary-cell salary-num">Incentive</span>
                  <span className="salary-cell salary-num">Advance</span>
                  <span className="salary-cell salary-net">Net Pay</span>
                </div>
                <div className="salary-body">
                  {allSalaries.map((s, i) => (
                    <SalaryRow key={s._id || i} s={s} isEven={i % 2 === 0} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Payments activity */}
          <div className="recent-activity">
            <div className="section-header">
              <h3>Recent Payments</h3>
              <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Last 5 records</span>
            </div>
            <div className="activity-card">
              {loading ? (
                <div className="loading-state">Loading data…</div>
              ) : recentPayments.length > 0 ? (
                <div className="recent-list">
                  {recentPayments.map((p, i) => (
                    <div key={i} className="activity-item">
                      <div className={`activity-indicator ${p.status === 'Paid' ? 'green' : 'blue'}`} />
                      <div className="activity-details">
                        <p><strong>{p.client}</strong>{p.vehicle ? ` · ${p.vehicle}` : ''}{p.location ? ` — ${p.location}` : ''}</p>
                        <span>{new Date(p.date).toLocaleDateString()}</span>
                      </div>
                      <div className="activity-value">
                        <div style={{ fontWeight: 700, color: '#1E3A5F', fontSize: '0.85rem' }}>
                          LKR {Number(p.hireAmount || 0).toLocaleString()}
                        </div>
                        <div style={{
                          fontSize: '0.68rem', fontWeight: 700, textAlign: 'right', marginTop: '2px',
                          color: p.status === 'Paid' ? '#059669' : p.status === 'Partial' ? '#D97706' : '#DC2626',
                        }}>
                          {p.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentHires.length > 0 ? (
                <div className="recent-list">
                  {recentHires.map((h, i) => (
                    <div key={i} className="activity-item">
                      <div className="activity-indicator blue" />
                      <div className="activity-details">
                        <p><strong>{h.client}</strong> · {h.vehicle}</p>
                        <span>{new Date(h.date).toLocaleDateString()}</span>
                      </div>
                      <div className="activity-value">
                        LKR {Number(h.billAmount || h.totalAmount || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state"><div className="empty-icon" /><p>No activity yet.</p></div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Employee recent assignments */}
      {!isAdmin && (
        <div className="recent-activity">
          <div className="section-header">
            <h3>My Recent Assignments</h3>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>Last 5 records</span>
          </div>
          <div className="activity-card">
            {loading ? (
              <div className="loading-state">Loading…</div>
            ) : recentHires.length > 0 ? (
              <div className="recent-list">
                {recentHires.map((h, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-indicator blue" />
                    <div className="activity-details">
                      <p><strong>{h.client}</strong> · {h.vehicle}</p>
                      <span>{new Date(h.date).toLocaleDateString()}</span>
                    </div>
                    <div className="activity-value">
                      <span style={{ fontWeight: 700, color: '#334155' }}>
                        {h.status || 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state"><div className="empty-icon" /><p>No assignments yet.</p></div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
