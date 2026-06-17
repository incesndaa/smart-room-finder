const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { verifyToken } = require('../middleware/auth');

// Public
router.get('/check', bookingController.checkAvailability);

// Protected (harus login)
router.get('/', verifyToken, bookingController.getAllBookings);
router.get('/by-role', verifyToken, bookingController.getBookingsByRole);
router.get('/my-bookings', verifyToken, bookingController.getMyBookings);
router.post('/', verifyToken, bookingController.createBooking);
router.delete('/:id', verifyToken, bookingController.cancelBooking);

// Sekretariat routes (Tahap 1)
router.put('/:id/approve-sekre', verifyToken, bookingController.approveBySekre);
router.put('/:id/reject-sekre', verifyToken, bookingController.rejectBySekre);

// BSP routes (Tahap 2 - Final)
router.put('/:id/approve-bsp', verifyToken, bookingController.approveByBSP);
router.put('/:id/reject-bsp', verifyToken, bookingController.rejectByBSP);

module.exports = router;