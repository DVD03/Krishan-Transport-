import React, { useState, useEffect } from 'react';
import api from '../services/api';
import DataTable from './DataTable';
import Modal from './Modal';
import RecordDetails from './RecordDetails';
import InvoiceForm from './InvoiceForm';
import { FileText, Plus, Download, Trash2, Search, RefreshCw, FileDown } from 'lucide-react';
import { generateInvoicePDF } from '../utils/billingGenerator';
import { generatePDFReport } from '../utils/reportGenerator';
import '../styles/forms.css';
import '../styles/books.css';

const InvoiceBook = () => {
  const [invoices, setInvoices] = useState([]);
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const userRole = localStorage.getItem('kt_user_role');
  const canManage = isDev || ['Admin', 'Manager'].includes(userRole);
  
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => { 
    fetchInvoices(); 
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/invoices');
      const raw = Array.isArray(res.data) ? res.data : [];
      setInvoices(raw.map(inv => ({
        ...inv,
        rawData: inv, // Store original for Editing
        vehicleType: inv.vehicleType || '—',
        totalAmount_disp: `LKR ${(inv.totalAmount || 0).toLocaleString()}`,
        status_disp: (
          <span className={`status-badge ${inv.status === 'Paid' ? 'status-active' : inv.status === 'Cancelled' ? 'status-inactive' : inv.status === 'Sent' ? 'status-pending' : ''}`}>
            {inv.status || 'Draft'}
          </span>
        ),
        action: (
          <div className="table-actions" onClick={e => e.stopPropagation()}>
            <button className="edit-btn" style={{ background: '#ec4899', color:'white' }} onClick={() => generateInvoicePDF(inv)} title="Download PDF">
               <FileDown size={14} /> PDF
            </button>
            {canManage && <button className="edit-btn" onClick={() => handleEdit(inv)}>Edit</button>}
            {canManage && <button className="delete-btn" onClick={() => handleDelete(inv._id)}>Delete</button>}
          </div>
        )
      })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const calcTotal = (d) => 
    +((Number(d.totalUnits || 0) * Number(d.ratePerUnit || 0)) + Number(d.transportCharge || 0) + Number(d.otherCharges || 0)).toFixed(2);

  const handleEdit = (item) => {
    // Explicitly identify the item to edit
    const target = item.rawData || item;
    setEditingItem(target);
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setShowModal(true);
  };

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      if (editingItem) {
        await api.put(`/invoices/${editingItem._id}`, data);
      } else {
        await api.post('/invoices', data);
      }
      setShowModal(false);
      setEditingItem(null);
      fetchInvoices();
    } catch { alert('Error saving invoice'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      await api.delete(`/invoices/${id}`);
      fetchInvoices();
    }
  };

  const handleRowClick = (record) => {
    setSelectedRecord(record);
    setIsDetailsOpen(true);
  };

  const handleExportFullReport = () => {
    const columns = ['INV#', 'DATE', 'CLIENT', 'SITE', 'VEHICLE TYPE', 'TOTAL', 'STATUS'];
    const data = filtered.map(inv => [
      inv.invoiceNo,
      new Date(inv.date).toLocaleDateString(),
      inv.clientName,
      inv.vehicleNo || '—',
      `Rs. ${inv.totalAmount?.toLocaleString()}`,
      inv.status
    ]);
    generatePDFReport({
      title: 'Invoices Summary Report',
      columns,
      data,
      filename: `Invoices_Report_${new Date().toISOString().split('T')[0]}.pdf`
    });
  };

  const filtered = invoices.filter(inv =>
    (inv.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.invoiceNo  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.site       || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: invoices.length,
    unpaidCount: invoices.filter(i => i.status !== 'Paid').length,
    totalRevenue: invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0)
  };

  return (
    <div className="book-container">
      
      <div className="book-summary">
        <div className="summary-item">
          <label>TOTAL INVOICES</label>
          <h3>{stats.total} Records</h3>
        </div>
        <div className="summary-item">
          <label>UNPAID</label>
          <h3 style={{ color: '#EF4444' }}>{stats.unpaidCount} Pending</h3>
        </div>
        <div className="summary-item" style={{ borderRight: 'none' }}>
          <label>TOTAL REVENUE</label>
          <h3 style={{ color: '#2563EB' }}>LKR {stats.totalRevenue.toLocaleString()}</h3>
        </div>
      </div>

      <div className="book-filters">
        <div className="search-box">
          <Search className="search-icon" size={20} />
          <input 
            type="text" 
            placeholder="Search by Invoice No, Client, Site..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-actions">
          <button className="secondary-btn" onClick={fetchInvoices} title="Refresh">
            <RefreshCw size={18} className={loading ? 'spinner' : ''} />
          </button>
          <button className="secondary-btn" onClick={handleExportFullReport}>
            <Download size={18} /> <span>Export Report</span>
          </button>
          <button className="add-btn" onClick={handleAddNew}>
            <Plus size={18} /> <span>New Invoice</span>
          </button>
        </div>
      </div>

      <DataTable 
        columns={['INV#', 'DATE', 'CLIENT', 'SITE', 'VEHICLE', 'TOTAL', 'STATUS', 'ACTION']}
        data={filtered}
        loading={loading}
        onRowClick={handleRowClick}
        emptyMessage="No invoices found."
      />

      {/* New/Edit Invoice Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => { setShowModal(false); setEditingItem(null); }} 
        title={editingItem ? "Edit Invoice" : "Generate New Invoice"}
      >
        <InvoiceForm 
          onSubmit={handleSubmit} 
          onCancel={() => { setShowModal(false); setEditingItem(null); }} 
          initialData={editingItem} 
        />
      </Modal>

      {/* Details Modal */}
      <Modal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} title="Invoice Details">
        {selectedRecord && <RecordDetails data={selectedRecord} type="invoice" />}
      </Modal>

    </div>
  );
};

export default InvoiceBook;
