import React from 'react';
import DataTable from './DataTable';
import Modal from './Modal';
import { vehicleAPI } from '../services/api';
import { generatePDFReport } from '../utils/reportGenerator';
import { Download, Search, RefreshCw, PlusCircle } from 'lucide-react';
import '../styles/forms.css';
import '../styles/books.css';

const VehicleForm = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = React.useState(initialData || { number: '', model: '', type: '', fuelType: 'Diesel', status: 'Active' });

  React.useEffect(() => {
    if (initialData) {
      setFormData({ fuelType: 'Diesel', ...initialData });
    } else {
      setFormData({ number: '', model: '', type: '', fuelType: 'Diesel', status: 'Active' });
    }
  }, [initialData]);
  
  return (
    <form className="hire-form" onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }}>
      <div className="hire-form-scroll">
        
        <div className="form-section">
          <p className="form-section-title">Vehicle Identity</p>
          <div className="form-group">
            <label>Registration Number (Required) *</label>
            <input 
              type="text" 
              placeholder="e.g. WP-1234" 
              required 
              value={formData.number} 
              onChange={e => setFormData({...formData, number: e.target.value.toUpperCase()})} 
            />
          </div>
        </div>

        <div className="form-section">
          <p className="form-section-title">Specifications</p>
          <div className="form-grid-2">
            <div className="form-group">
              <label>Model / Variant</label>
              <input 
                type="text" 
                placeholder="e.g. Isuzu Elf" 
                value={formData.model} 
                onChange={e => setFormData({...formData, model: e.target.value})} 
              />
            </div>
            <div className="form-group">
              <label>Body Type</label>
              <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                <option value="">Select Type</option>
                <option value="Truck">Truck</option>
                <option value="Mini Truck">Mini Truck</option>
                <option value="Van">Van</option>
                <option value="Mini Van">Mini Van</option>
                <option value="Prime Mover">Prime Mover</option>
                <option value="Crane">Crane</option>
                <option value="Tipper">Tipper</option>
                <option value="Flatbed">Flatbed</option>
                <option value="Pickup">Pickup</option>
                <option value="Bus">Bus</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div className="form-grid-2" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Fuel Type</label>
              <select value={formData.fuelType || 'Diesel'} onChange={e => setFormData({...formData, fuelType: e.target.value})}>
                <option value="Diesel">Diesel</option>
                <option value="Petrol">Petrol</option>
              </select>
            </div>
            <div className="form-group">
              <label>Current Status</label>
              <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="Active">Active</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

      </div>

      <div className="hire-form-footer">
        <div className="total-display">
          <span>Type · Fuel</span>
          <strong>{formData.type || 'Fleet Item'} · {formData.fuelType || 'Diesel'}</strong>
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onCancel}>Cancel</button>
          <button type="submit" className="submit-btn">{initialData ? 'Update Vehicle' : 'Register Vehicle'}</button>
        </div>
      </div>
    </form>
  );
};

const Vehicles = () => {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const userRole = localStorage.getItem('kt_user_role');
  const canManage = isDev || ['Admin', 'Manager'].includes(userRole);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [vehicleRecords, setVehicleRecords] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [editingVehicle, setEditingVehicle] = React.useState(null);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  const columns = canManage 
    ? ['VEHICLE NUMBER', 'MODEL', 'TYPE', 'FUEL TYPE', 'STATUS', 'ACTION']
    : ['VEHICLE NUMBER', 'MODEL', 'TYPE', 'FUEL TYPE', 'STATUS'];

  React.useEffect(() => { fetchVehicles(); }, []);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await vehicleAPI.get();
      const raw = Array.isArray(res.data) ? res.data : [];
      const formatted = raw.map(v => ({
        ...v,
        rawData: v, // Store original for Editing
        number: v.number || '—',
        model: v.model || '—',
        type: v.type || '—',
        fuelType_disp: (
          <span className={`status-badge ${(v.fuelType || 'Diesel') === 'Petrol' ? 'status-pending' : 'status-active'}`}
            style={(v.fuelType || 'Diesel') === 'Petrol'
              ? { background: '#EDE9FE', color: '#7C3AED', border: '1px solid #C4B5FD' }
              : { background: '#D1FAE5', color: '#065F46', border: '1px solid #6EE7B7' }}
          >
            {v.fuelType || 'Diesel'}
          </span>
        ),
        status_text: v.status || 'Active',
        status_disp: (
          <span className={`status-badge ${v.status === 'Active' ? 'status-active' : v.status === 'Maintenance' ? 'status-pending' : v.status === 'Inactive' ? 'status-inactive' : ''}`}>
            {v.status || 'Active'}
          </span>
        ),
        action: canManage ? (
          <div className="table-actions" onClick={e => e.stopPropagation()}>
            <button className="edit-btn" onClick={() => handleEdit(v)}>Edit</button>
            <button className="delete-btn" onClick={() => handleDelete(v._id)}>Delete</button>
          </div>
        ) : null
      }));
      setVehicleRecords(formatted);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const filteredRecords = React.useMemo(() => {
    return vehicleRecords.filter(r => {
      return !searchQuery || 
        (r.number || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.model  || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.type   || '').toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [vehicleRecords, searchQuery]);

  const stats = React.useMemo(() => {
    return {
      total: vehicleRecords.length,
      active: vehicleRecords.filter(v => v.status_text === 'Active').length
    };
  }, [vehicleRecords]);

  const handleAdd = async (data) => {
    try {
      setErrorMsg('');
      const payload = { ...data, number: (data.number || '').trim() };
      
      if (editingVehicle) {
        await vehicleAPI.update(editingVehicle._id, payload);
        setSuccessMsg('Vehicle updated successfully!');
      } else {
        await vehicleAPI.create(payload);
        setSuccessMsg('Vehicle registered successfully!');
      }
      fetchVehicles();
      setIsModalOpen(false);
      setEditingVehicle(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { 
      console.error(err);
      const msg = err.response?.data?.message || err.message || 'Error saving vehicle';
      setErrorMsg(msg);
    }
  };

  const handleEdit = (vehicle) => {
    const target = vehicle.rawData || vehicle;
    setEditingVehicle(target);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this vehicle from fleet?')) {
      try {
        await vehicleAPI.delete(id);
        setSuccessMsg('Vehicle deleted successfully');
        fetchVehicles();
        setTimeout(() => setSuccessMsg(''), 3000);
      } catch (err) { alert('Error deleting vehicle'); }
    }
  };

  const handleExportPDF = () => {
    const exportColumns = ['VEHICLE NUMBER', 'MODEL', 'TYPE', 'FUEL TYPE', 'STATUS'];
    const exportData = filteredRecords.map(v => [
      v.number || '—',
      v.model || '—',
      v.type || '—',
      v.fuelType || 'Diesel',
      v.status_text || '—'
    ]);
    
    generatePDFReport({
      title: 'Fleet Inventory Report',
      columns: exportColumns,
      data: exportData,
      filename: `Fleet_Report_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  return (
    <div className="book-container">
      <div className="book-summary">
        <div className="summary-item">
          <label>TOTAL FLEET</label>
          <h3>{stats.total} Units</h3>
        </div>
        <div className="summary-item" style={{ borderRight: 'none' }}>
          <label>ACTIVE STAFF</label>
          <h3 style={{ color: '#10B981' }}>{stats.active} Operating</h3>
        </div>
      </div>

      <div className="book-filters">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search number, model, type..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="secondary-btn" onClick={fetchVehicles} title="Refresh">
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
          </button>
          <button className="secondary-btn" onClick={handleExportPDF}>
            <Download size={18} /> <span>PDF Report</span>
          </button>
          {canManage && (
            <button className="add-btn" onClick={() => { setEditingVehicle(null); setIsModalOpen(true); }}>
              <PlusCircle size={18} /> <span>Add Vehicle</span>
            </button>
          )}
        </div>
      </div>
      
      {successMsg && <div className="success-banner" style={{ margin: '0 20px 20px' }}>{successMsg}</div>}
      {errorMsg && <div className="error-banner" style={{ margin: '0 20px 20px' }}>{errorMsg}</div>}
      
      <DataTable 
        columns={columns} 
        data={filteredRecords} 
        loading={loading} 
        emptyMessage={loading ? "Loading fleet data..." : "No vehicles registered."} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingVehicle(null); }} 
        title={editingVehicle ? 'Edit Vehicle Profile' : 'Register New Vehicle'}
      >
        <VehicleForm 
          onSubmit={handleAdd} 
          onCancel={() => { setIsModalOpen(false); setEditingVehicle(null); }} 
          initialData={editingVehicle}
        />
      </Modal>
    </div>
  );
};

export default Vehicles;
