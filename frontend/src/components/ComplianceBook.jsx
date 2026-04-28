import React, { useState, useEffect } from 'react';
import { vehicleAPI, markLeasePayment } from '../services/api';
import DataTable from './DataTable';
import { ShieldCheck, FileText, CreditCard, Calendar, Search, RefreshCw, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import '../styles/books.css';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ComplianceBook = () => {
  const now = new Date();
  const userRole = localStorage.getItem('kt_user_role');
  const canManage = ['Admin', 'Manager'].includes(userRole);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [leasingYear, setLeasingYear] = useState(now.getFullYear());
  const [togglingId, setTogglingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await vehicleAPI.get();
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch compliance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaseToggle = async (vehicleId, year, month, newPaid) => {
    const key = `${vehicleId}-${year}-${month}`;
    setTogglingId(key);
    setErrorMsg('');

    // --- Optimistic update: change local state immediately ---
    setVehicles(prev => prev.map(v => {
      if (v._id !== vehicleId) return v;
      const existing = (v.leasePayments || []);
      const idx = existing.findIndex(lp => Number(lp.year) === year && Number(lp.month) === month);
      let updated;
      if (idx >= 0) {
        updated = existing.map((lp, i) => i === idx ? { ...lp, paid: newPaid, paidDate: newPaid ? new Date().toISOString() : null } : lp);
      } else {
        updated = [...existing, { year, month, paid: newPaid, paidDate: newPaid ? new Date().toISOString() : null }];
      }
      return { ...v, leasePayments: updated };
    }));

    try {
      await markLeasePayment(vehicleId, year, month, newPaid);
      // Re-fetch to sync with server truth
      await fetchData();
    } catch (err) {
      // Revert optimistic update on failure
      await fetchData();
      const msg = err?.response?.data?.message || err?.message || 'Failed to update lease payment';
      setErrorMsg(`Error: ${msg}`);
      console.error('Lease toggle failed:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-CA').replace(/-/g, '.');
  };

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const expDate = new Date(date);
    const today = new Date();
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const filteredVehicles = vehicles.filter(v => 
    v.number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 1. Insurance Renewal Schedule
  const insuranceData = [...filteredVehicles]
    .filter(v => v.insuranceExpirationDate)
    .sort((a, b) => new Date(a.insuranceExpirationDate) - new Date(b.insuranceExpirationDate))
    .map(v => ({
      renewalDate: (
        <span style={{ fontWeight: 'bold', color: isExpiringSoon(v.insuranceExpirationDate) ? '#EF4444' : 'inherit' }}>
          {formatDate(v.insuranceExpirationDate)}
          {isExpiringSoon(v.insuranceExpirationDate) && <AlertCircle size={14} style={{ marginLeft: '5px', verticalAlign: 'middle' }} />}
        </span>
      ),
      vehicleNumber: v.number,
      number: v.number
    }));

  // 2. License Renewal Schedule
  const licenseData = [...filteredVehicles]
    .filter(v => v.licenseExpirationDate)
    .sort((a, b) => new Date(a.licenseExpirationDate) - new Date(b.licenseExpirationDate))
    .map(v => ({
      renewalDate: formatDate(v.licenseExpirationDate),
      number: v.number
    }));

  // 3. Safety Certificate Schedule
  const safetyData = [...filteredVehicles]
    .filter(v => v.safetyExpirationDate)
    .sort((a, b) => new Date(a.safetyExpirationDate) - new Date(b.safetyExpirationDate))
    .map(v => ({
      renewalDate: formatDate(v.safetyExpirationDate),
      number: v.number
    }));

  // 4. Monthly Leasing Plan
  const leasingPlan = [...filteredVehicles]
    .filter(v => v.hasLeasing && v.leaseDueDate)
    .sort((a, b) => a.leaseDueDate - b.leaseDueDate)
    .map(v => ({
      date: v.leaseDueDate,
      number: v.number,
      amount: `LKR ${(v.monthlyPremium || 0).toLocaleString()}`,
      finalDate: formatDate(v.leaseFinalDate)
    }));

  const [activeTab, setActiveTab] = useState('insurance');

  const tabs = [
    { id: 'insurance', label: 'Insurance', icon: ShieldCheck, color: '#3B82F6' },
    { id: 'licenses', label: 'Licenses', icon: FileText, color: '#10B981' },
    { id: 'safety', label: 'Safety Certs', icon: Calendar, color: '#F59E0B' },
    { id: 'leasing', label: 'Leasing Plan', icon: CreditCard, color: '#8B5CF6' },
  ];

  return (
    <div className="book-container">
      
      {/* Search and Global Actions */}
      <div className="book-filters" style={{ marginBottom: '20px' }}>
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search by vehicle number..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="secondary-btn" onClick={fetchData} title="Refresh Data">
          <RefreshCw size={18} className={loading ? 'spinner' : ''} />
        </button>
      </div>

      {errorMsg && (
        <div style={{
          margin: '0 0 16px', padding: '12px 16px', borderRadius: '10px',
          background: '#FEE2E2', color: '#DC2626', fontWeight: 600, fontSize: '0.85rem',
          border: '1px solid #FCA5A5', display: 'flex', alignItems: 'center', gap: '8px'
        }}>
          <AlertCircle size={16} /> {errorMsg}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="compliance-tabs" style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        padding: '0 5px',
        overflowX: 'auto',
        paddingBottom: '5px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              border: '1px solid',
              borderColor: activeTab === tab.id ? tab.color : '#E2E8F0',
              background: activeTab === tab.id ? `${tab.color}10` : 'white',
              color: activeTab === tab.id ? tab.color : '#64748B',
              fontWeight: activeTab === tab.id ? 'bold' : 'normal',
              cursor: 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap'
            }}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Conditional Content Rendering */}
      <div className="compliance-content" style={{ padding: '0 5px' }}>
        
        {activeTab === 'insurance' && (
          <div className="compliance-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={20} color="#3B82F6" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Insurance Renewal Schedule</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{insuranceData.length} Records</span>
            </div>
            <DataTable 
              columns={['RENEWAL DATE', 'VEHICLE NUMBER']}
              data={insuranceData}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'licenses' && (
          <div className="compliance-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileText size={20} color="#10B981" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Licenses Renewal Schedule</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{licenseData.length} Records</span>
            </div>
            <DataTable 
              columns={['RENEWAL DATE', 'VEHICLE NUMBER']}
              data={licenseData}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'safety' && (
          <div className="compliance-card" style={{ background: 'white', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Calendar size={20} color="#F59E0B" />
                <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Safety Certificate Renewal</h3>
              </div>
              <span style={{ fontSize: '0.85rem', color: '#64748B' }}>{safetyData.length} Records</span>
            </div>
            <DataTable 
              columns={['RENEWAL DATE', 'VEHICLE NUMBER']}
              data={safetyData}
              loading={loading}
            />
          </div>
        )}

        {activeTab === 'leasing' && (() => {
          const leasingVehicles = filteredVehicles.filter(v => v.hasLeasing);
          const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
          const currentMonth = now.getMonth() + 1;

          // Summary: how many paid this month
          const thisMonthPaid = leasingVehicles.filter(v => {
            const entry = (v.leasePayments || []).find(lp => lp.year === leasingYear && lp.month === currentMonth);
            return entry?.paid;
          }).length;
          const thisMonthTotal = leasingVehicles.length;
          const thisMonthAmount = leasingVehicles.reduce((s, v) => {
            const entry = (v.leasePayments || []).find(lp => lp.year === leasingYear && lp.month === currentMonth && lp.paid);
            return s + (entry ? parseFloat(v.monthlyPremium || 0) : 0);
          }, 0);
          const pendingAmount = leasingVehicles.reduce((s, v) => {
            const entry = (v.leasePayments || []).find(lp => lp.year === leasingYear && lp.month === currentMonth && lp.paid);
            return s + (!entry ? parseFloat(v.monthlyPremium || 0) : 0);
          }, 0);

          return (
            <div>
              {/* Header with year selector */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CreditCard size={20} color="#8B5CF6" />
                  <h3 style={{ margin: 0, fontSize: '1rem', color: '#1E293B' }}>Monthly Leasing Payments</h3>
                </div>
                <select value={leasingYear} onChange={e => setLeasingYear(Number(e.target.value))}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>

              {/* Current Month Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
                <div style={{ background: '#EFF6FF', borderRadius: '12px', padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#1D4ED8', textTransform: 'uppercase', marginBottom: '4px' }}>This Month</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>{MONTH_NAMES[currentMonth - 1]} {leasingYear}</div>
                </div>
                <div style={{ background: '#D1FAE5', borderRadius: '12px', padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', marginBottom: '4px' }}>Paid ({thisMonthPaid}/{thisMonthTotal})</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>LKR {thisMonthAmount.toLocaleString()}</div>
                </div>
                <div style={{ background: '#FEE2E2', borderRadius: '12px', padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', marginBottom: '4px' }}>Pending</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#DC2626' }}>LKR {pendingAmount.toLocaleString()}</div>
                </div>
              </div>

              {/* Per-vehicle monthly grid */}
              {leasingVehicles.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  <CreditCard size={36} style={{ opacity: 0.3, marginBottom: '12px' }} />
                  <p style={{ fontWeight: 600 }}>No vehicles with active leasing.</p>
                </div>
              ) : (
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {leasingVehicles.map(v => {
                    const payments = v.leasePayments || [];
                    const paidThisYear = payments.filter(lp => lp.year === leasingYear && lp.paid).length;
                    return (
                      <div key={v._id} style={{ background: 'white', border: '1px solid #E2E8F0', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                        <div style={{ padding: '12px 16px', background: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 800, color: '#1E293B' }}>{v.number}</div>
                            <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 600 }}>{v.leasingCompany || '—'} · LKR {parseFloat(v.monthlyPremium || 0).toLocaleString()}/mo</div>
                          </div>
                          <div style={{ fontSize: '0.72rem', background: '#8B5CF620', color: '#6D28D9', fontWeight: 700, padding: '4px 10px', borderRadius: '20px' }}>
                            {paidThisYear}/12 paid {leasingYear}
                          </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '6px', padding: '12px' }}>
                          {MONTH_NAMES.map((mName, mIdx) => {
                            const month = mIdx + 1;
                            const isFuture = leasingYear === now.getFullYear() && month > currentMonth;
                            const entry = payments.find(lp => lp.year === leasingYear && lp.month === month);
                            const isPaid = entry?.paid || false;
                            const isCurrentMonth = leasingYear === now.getFullYear() && month === currentMonth;
                            const toggling = togglingId === `${v._id}-${leasingYear}-${month}`;
                            return (
                              <button key={month}
                                disabled={isFuture || !canManage || toggling}
                                onClick={() => handleLeaseToggle(v._id, leasingYear, month, !isPaid)}
                                title={isPaid && entry?.paidDate ? `Paid on ${new Date(entry.paidDate).toLocaleDateString()}` : isFuture ? 'Future month' : 'Click to mark paid'}
                                style={{
                                  padding: '8px 4px', borderRadius: '8px', border: isCurrentMonth ? '2px solid #8B5CF6' : 'none',
                                  cursor: (isFuture || !canManage) ? 'default' : 'pointer',
                                  background: isFuture ? '#F8FAFC' : isPaid ? '#D1FAE5' : '#FEF2F2',
                                  color: isFuture ? '#CBD5E1' : isPaid ? '#059669' : '#DC2626',
                                  fontWeight: 700, fontSize: '0.68rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                                  opacity: isFuture ? 0.4 : 1, transition: 'all 0.18s ease',
                                  boxShadow: isCurrentMonth ? '0 0 0 2px #8B5CF640' : 'none'
                                }}>
                                <span>{mName}</span>
                                {toggling ? <span style={{ fontSize: '0.55rem' }}>…</span>
                                  : isFuture ? <span style={{ fontSize: '0.55rem' }}>—</span>
                                  : isPaid ? <CheckCircle size={13} /> : <XCircle size={13} />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })()}

      </div>
    </div>
  );
};

export default ComplianceBook;
