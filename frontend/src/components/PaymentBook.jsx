import React from 'react';
import DataTable from './DataTable';
import Modal from './Modal';
import PaymentForm from './PaymentForm';
import { paymentAPI, vehicleAPI } from '../services/api';
import { generatePDFReport } from '../utils/reportGenerator';
import { Download, Search, Plus, Filter, Loader2, DollarSign } from 'lucide-react';
import '../styles/forms.css';
import '../styles/books.css';
import VehicleFilter from './VehicleFilter';

const PaymentBook = () => {
  const userRole = localStorage.getItem('kt_user_role');
  const canManage = ['Admin', 'Manager'].includes(userRole);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [paymentRecords, setPaymentRecords] = React.useState([]);
  const [vehicles, setVehicles] = React.useState([]);
  const [selectedVehicle, setSelectedVehicle] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [editingItem, setEditingItem] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');

  const columns = canManage
    ? ['DATE', 'CLIENT', 'VEHICLE', 'DRIVER', 'LOCATION', 'START', 'END', 'TOTAL HOURS', 'MIN HRS', 'HOURS IN BILL', 'HIRE AMT', 'COMM', 'DAY PAY', 'TAKEN', 'BALANCE', 'STATUS', 'ACTION']
    : ['DATE', 'CLIENT', 'VEHICLE', 'DRIVER', 'LOCATION', 'START', 'END', 'TOTAL HOURS', 'MIN HRS', 'HOURS IN BILL', 'HIRE AMT', 'COMM', 'DAY PAY', 'TAKEN', 'BALANCE', 'STATUS'];
  
  React.useEffect(() => {
    fetchRecords();
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await vehicleAPI.get();
      setVehicles(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const response = await paymentAPI.get();
      const rawData = Array.isArray(response.data) ? response.data : [];
      const formatted = rawData.map(item => ({
        ...item,
        date:         new Date(item.date).toLocaleDateString(),
        client:       item.client || '—',
        vehicle:      item.vehicle || '—',
        driverName:   item.driverName || '—',
        location:     item.location || '—',
        startTime:    item.startTime || '—',
        endTime:      item.endTime || '—',
        totalHours:   item.totalHours ? `${item.totalHours}h` : '—',
        minimumHours: item.minimumHours ? `${item.minimumHours}h` : '—',
        hoursInBill:  item.hoursInBill ? `${item.hoursInBill}h` : '—',
        hireAmount:   `LKR ${(item.hireAmount || 0).toLocaleString()}`,
        commission:   `LKR ${(item.commission || 0).toLocaleString()}`,
        dayPayment:   `LKR ${(item.dayPayment || 0).toLocaleString()}`,
        takenAmount:  `LKR ${(item.takenAmount || 0).toLocaleString()}`,
        balance_val:  item.balance || 0,
        balance:      `LKR ${Number(item.balance || 0).toLocaleString()}`,
        status:       item.status || 'Pending',
        action: canManage ? (
          <div className="table-actions">
            <button className="edit-btn" onClick={() => handleEdit(item)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDelete(item._id)}>Delete</button>
          </div>
        ) : null
      }));
      setPaymentRecords(formatted);
      setError(null);
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError('Connection issue: could not load payment records.');
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = React.useMemo(() => {
    return paymentRecords.filter(r => {
      const matchVehicle = !selectedVehicle || r.vehicle === selectedVehicle;
      const matchSearch = !searchQuery || 
        r.client?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.driverName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchVehicle && matchSearch;
    });
  }, [paymentRecords, selectedVehicle, searchQuery]);

  const stats = React.useMemo(() => {
    const totalReceived   = filteredRecords.reduce((sum, r) => sum + (parseFloat(r.hireAmount?.replace('LKR ', '').replace(/,/g,'')) || 0), 0);
    const outstanding     = filteredRecords.reduce((sum, r) => sum + (r.balance_val || 0), 0);
    return { totalReceived, outstanding, count: filteredRecords.length };
  }, [filteredRecords]);

  const handleAddPayment = async (data) => {
    try {
      if (editingItem) {
        await paymentAPI.update(editingItem._id, data);
      } else {
        await paymentAPI.create(data);
      }
      fetchRecords();
      setIsModalOpen(false);
      setEditingItem(null);
    } catch (err) {
      alert('Error saving payment: ' + err.message);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this payment record?')) {
      try {
        await paymentAPI.delete(id);
        fetchRecords();
      } catch (err) { alert('Error deleting record'); }
    }
  };

  const handleExportPDF = () => {
    const exportColumns = ['DATE', 'CLIENT', 'VEHICLE', 'DRIVER', 'HIRE AMT', 'BALANCE', 'STATUS'];
    const exportData = filteredRecords.map(r => [
      r.date || '—',
      r.client || '—',
      r.vehicle || '—',
      r.driverName || '—',
      r.hireAmount || '—',
      r.balance || '—',
      r.status || '—'
    ]);
    
    generatePDFReport({
      title: 'Payment Book Report',
      columns: exportColumns,
      data: exportData,
      filename: `PaymentBook_Report_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  return (
    <div className="book-container">
      <div className="book-summary">
        <div className="summary-item">
          <label>TOTAL HIRES VALUE</label>
          <h3 style={{ color: '#2563EB' }}>LKR {stats.totalReceived.toLocaleString()}</h3>
        </div>
        <div className="summary-item">
          <label>OUTSTANDING BALANCE</label>
          <h3 style={{ color: '#DC2626' }}>LKR {stats.outstanding.toLocaleString()}</h3>
        </div>
        <div className="summary-item" style={{ borderRight: 'none' }}>
          <label>TOTAL RECORDS</label>
          <h3>{stats.count}</h3>
        </div>
      </div>

      <VehicleFilter 
        vehicles={vehicles} 
        selectedVehicle={selectedVehicle} 
        onSelect={setSelectedVehicle} 
      />

      <div className="book-filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Search client, driver, location..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="secondary-btn" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={16} /> Export PDF
          </button>
          {canManage && (
            <button className="add-btn" onClick={() => { setEditingItem(null); setIsModalOpen(true); }}>
              + Add Payment
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <Loader2 className="spinner" size={32} />
          <p>Loading payment history...</p>
        </div>
      ) : (
        <div className="table-responsive">
          <DataTable 
            columns={columns} 
            data={filteredRecords} 
            loading={loading}
            emptyMessage="No payment records found matching your selection." 
          />
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingItem(null); }} 
        title={editingItem ? 'Edit Payment Record' : 'Add Payment Record'}
        wide
      >
        <PaymentForm 
          onSubmit={handleAddPayment} 
          onCancel={() => { setIsModalOpen(false); setEditingItem(null); }} 
          initialData={editingItem}
        />
      </Modal>
    </div>
  );
};

export default PaymentBook;
