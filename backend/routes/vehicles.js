const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const { authMiddleware, authorizeRoles } = require('../middleware/authMiddleware');

// Get all vehicles
router.get('/', authMiddleware, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ number: 1 });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add new vehicle
router.post('/', authMiddleware, async (req, res) => {
  const vehicle = new Vehicle(req.body);
  try {
    const newVehicle = await vehicle.save();
    res.status(201).json(newVehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update vehicle
router.put('/:id', authMiddleware, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedVehicle);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete vehicle
router.delete('/:id', authMiddleware, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark / unmark a monthly lease payment
router.patch('/:id/lease-payment', authMiddleware, authorizeRoles('Admin', 'Manager'), async (req, res) => {
  try {
    const year  = Number(req.body.year);
    const month = Number(req.body.month);
    const paid  = Boolean(req.body.paid);

    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Safely initialise the array if missing on older documents
    if (!Array.isArray(vehicle.leasePayments)) {
      vehicle.leasePayments = [];
    }

    // Find existing entry for this month/year (use Number coercion to be safe)
    const idx = vehicle.leasePayments.findIndex(
      lp => Number(lp.year) === year && Number(lp.month) === month
    );

    if (idx >= 0) {
      vehicle.leasePayments[idx].paid     = paid;
      vehicle.leasePayments[idx].paidDate = paid ? new Date() : null;
    } else {
      vehicle.leasePayments.push({ year, month, paid, paidDate: paid ? new Date() : null });
    }

    vehicle.markModified('leasePayments'); // ensure Mongoose detects nested array change
    await vehicle.save();
    res.json(vehicle);
  } catch (err) {
    console.error('Lease payment update error:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
