const BookingModel = require('../models/BookingModel');
const RoomModel = require('../models/RoomModel');  // ← TAMBAHKAN INI
const NotificationModel = require('../models/NotificationModel');  // ← TAMBAHKAN INI
const db = require('../config/database');  // ← TAMBAHKAN INI


const getAllBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.getAll();
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data booking' });
    }
};

const getBookingsByRole = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'sekre' && role !== 'bsp') {
            return res.status(403).json({ success: false, message: 'Akses ditolak' });
        }
        const bookings = await BookingModel.getByRole(role);
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil data booking' });
    }
};

const getMyBookings = async (req, res) => {
    try {
        const bookings = await BookingModel.getByUser(req.user.id);
        res.json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil booking anda' });
    }
};

const checkAvailability = async (req, res) => {
    try {
        const { roomId, date, startTime, endTime } = req.query;
        const conflicts = await BookingModel.checkAvailability(roomId, date, startTime, endTime);
        res.json({ available: conflicts.length === 0, conflicts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal cek ketersediaan' });
    }
};

const createBooking = async (req, res) => {
    try {
        const { room_id, booking_date, start_time, end_time } = req.body;

        // Cek ketersediaan dengan booking yang sudah approved
        const conflicts = await BookingModel.checkAvailability(room_id, booking_date, start_time, end_time);
        if (conflicts.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Waktu yang dipilih sudah dibooking! Silakan pilih waktu lain.'
            });
        }

        // Ambil nama ruangan
        const room = await RoomModel.getById(room_id);
        const room_name = room ? room.name : 'Ruangan';

        const bookingData = { ...req.body, user_id: req.user.id };
        const bookingId = await BookingModel.create(bookingData);

        // ========== KIRIM NOTIFIKASI ==========
        // Notifikasi ke user yang booking
        await NotificationModel.create({
            user_id: req.user.id,
            title: 'Booking Diajukan',
            message: `Booking ${room_name} telah diajukan. Menunggu persetujuan.`,
            type: 'booking',
            related_id: bookingId
        });

        // Notifikasi ke admin (Sekretariat)
        const [admins] = await db.query('SELECT id FROM users WHERE role = "sekre"');
        for (const admin of admins) {
            await NotificationModel.create({
                user_id: admin.id,
                title: 'Booking Baru',
                message: `${req.user.username} mengajukan booking ruangan ${room_name} pada ${booking_date}`,
                type: 'booking',
                related_id: bookingId
            });
        }
        // ======================================

        const [bspAdmins] = await db.query('SELECT id FROM users WHERE role = "bsp"');
        for (const bsp of bspAdmins) {
            await NotificationModel.create({
                user_id: bsp.id,
                title: 'Booking Baru Menunggu Approval',
                message: `${req.user.username} mengajukan booking ruangan ${room_name} pada ${booking_date}. Menunggu verifikasi Sekretariat terlebih dahulu.`,
                type: 'booking',
                related_id: bookingId
            });
        }

        res.status(201).json({
            success: true,
            data: { id: bookingId },
            message: 'Booking berhasil diajukan! Menunggu verifikasi Sekretariat.'
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({ success: false, message: 'Gagal membuat booking' });
    }
};

// Sekretariat Approve
const approveBySekre = async (req, res) => {
    try {
        console.log('=== APPROVE BY SEKRE ===');
        console.log('Booking ID:', req.params.id);
        console.log('User:', req.user);

        if (req.user.role !== 'sekre') {
            return res.status(403).json({ success: false, message: 'Hanya Sekretariat yang bisa melakukan verifikasi tahap 1' });
        }

        const affected = await BookingModel.approveBySekre(req.params.id, req.user.id);
        console.log('Affected rows:', affected);


        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan atau sudah diproses' });
        }

        const [bookingRows] = await db.query(`
            SELECT b.*, r.name as room_name, u.full_name as user_name 
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id
            WHERE b.id = ?
        `, [req.params.id]);
        const booking = bookingRows[0];
        
        await NotificationModel.create({
            user_id: booking.user_id,
            title: 'Booking Lolos Verifikasi',
            message: `Booking ${booking.room_name} telah lolos verifikasi Sekretariat. Menunggu approval BSP.`,
            type: 'approval',
            related_id: req.params.id
        });

        const [bspAdmins] = await db.query('SELECT id FROM users WHERE role = "bsp"');
        for (const bsp of bspAdmins) {
            await NotificationModel.create({
                user_id: bsp.id,
                title: 'Booking Menunggu Approval Final',
                message: `Booking ${booking.room_name} oleh ${booking.user_name} telah lolos verifikasi Sekretariat. Menunggu approval final dari BSP.`,
                type: 'approval',
                related_id: req.params.id
            });
        }

        res.json({ success: true, message: 'Booking lolos verifikasi Sekretariat! Menunggu verifikasi BSP.' });
    } catch (error) {
        console.error('Approve by sekre error:', error);
        res.status(500).json({ success: false, message: 'Gagal verifikasi booking', error: error.message });
    }
};

// BSP Approve (Final)
const approveByBSP = async (req, res) => {
    try {
        if (req.user.role !== 'bsp') {
            return res.status(403).json({ success: false, message: 'Hanya BSP yang bisa melakukan approval final' });
        }

        const affected = await BookingModel.approveByBSP(req.params.id, req.user.id);

        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan atau sudah diproses' });
        }

        // ========== AMBIL DATA BOOKING UNTUK NOTIFIKASI ==========
        const booking = await BookingModel.getById(req.params.id);

        // ========== KIRIM NOTIFIKASI KE USER ==========
        await NotificationModel.create({
            user_id: booking.user_id,
            title: 'Booking Disetujui',
            message: `Booking ruangan ${booking.room_name} telah Disetujui! Ruangan sudah terkunci untuk Anda.`,
            type: 'approval',
            related_id: req.params.id
        });
        // =======================================================

        res.json({ success: true, message: 'Booking Final Disetujui! Jadwal telah dikunci.' });
    } catch (error) {
        console.error('Approve by BSP error:', error);
        res.status(500).json({ success: false, message: 'Gagal approve booking' });
    }
};

const rejectBySekre = async (req, res) => {
    try {
        console.log('=== REJECT BY SEKRE ===');
        console.log('Booking ID:', req.params.id);
        console.log('Reason:', req.body.reason);

        if (req.user.role !== 'sekre') {
            return res.status(403).json({ success: false, message: 'Hanya Sekretariat yang bisa melakukan verifikasi tahap 1' });
        }

        const { reason } = req.body;
        const affected = await BookingModel.rejectBySekre(req.params.id, req.user.id, reason || 'Tidak ada alasan');

        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
        }

        await NotificationModel.create({
            user_id: booking.user_id,
            title: 'Booking Ditolak',
            message: `Booking ruangan ${booking.room_name} ditolak oleh Sekretariat. Alasan: ${reason}`,
            type: 'rejection',
            related_id: req.params.id
        });

        const [bspAdmins] = await db.query('SELECT id FROM users WHERE role = "bsp"');
        for (const bsp of bspAdmins) {
            await NotificationModel.create({
                user_id: bsp.id,
                title: 'Booking Ditolak Sekretariat',
                message: `Booking ruangan ${booking.room_name} oleh ${booking.user_name} ditolak oleh Sekretariat. Alasan: ${reason}`,
                type: 'rejection',
                related_id: req.params.id
            });
        }

        res.json({ success: true, message: 'Booking ditolak oleh Sekretariat' });
    } catch (error) {
        console.error('Reject by sekre error:', error);
        res.status(500).json({ success: false, message: 'Gagal menolak booking', error: error.message });
    }
};

const rejectByBSP = async (req, res) => {
    try {
        if (req.user.role !== 'bsp') {
            return res.status(403).json({ success: false, message: 'Hanya BSP yang bisa melakukan approval final' });
        }

        const { reason } = req.body;
        const affected = await BookingModel.rejectByBSP(req.params.id, req.user.id, reason || 'Tidak ada alasan');

        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan' });
        }

        // ========== AMBIL DATA BOOKING UNTUK NOTIFIKASI ==========
        const booking = await BookingModel.getById(req.params.id);

        // ========== KIRIM NOTIFIKASI KE USER ==========
        await NotificationModel.create({
            user_id: booking.user_id,
            title: 'Booking Ditolak',
            message: `Booking ruangan ${booking.room_name} ditolak oleh BSP. Alasan: ${reason || 'Tidak ada alasan'}`,
            type: 'rejection',
            related_id: req.params.id
        });
        // =======================================================

        res.json({ success: true, message: 'Booking ditolak oleh BSP' });
    } catch (error) {
        console.error('Reject by BSP error:', error);
        res.status(500).json({ success: false, message: 'Gagal menolak booking' });
    }
};

const cancelBooking = async (req, res) => {
    try {
        const affected = await BookingModel.cancel(req.params.id, req.user.id);

        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Booking tidak ditemukan atau sudah diproses' });
        }

        res.json({ success: true, message: 'Booking berhasil dibatalkan' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal membatalkan booking' });
    }
};

module.exports = {
    getAllBookings,
    getBookingsByRole,
    getMyBookings,
    checkAvailability,
    createBooking,
    approveBySekre,
    rejectBySekre,
    approveByBSP,
    rejectByBSP,
    cancelBooking
};