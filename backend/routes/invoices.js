const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    // Auto-generate invoice number if not provided
    if (!req.body.invoiceNo) {
      const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
      let nextNum = 1001;
      if (lastInvoice && lastInvoice.invoiceNo && lastInvoice.invoiceNo.startsWith('KT-INV-')) {
        const lastNum = parseInt(lastInvoice.invoiceNo.split('-')[2]);
        if (!isNaN(lastNum)) nextNum = lastNum + 1;
      }
      req.body.invoiceNo = `KT-INV-${nextNum}`;
    }

    const newInvoice = new Invoice(req.body);
    const saved = await newInvoice.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const updated = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
