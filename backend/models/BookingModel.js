const db = require('../config/database');

class BookingModel {
    // Ambil semua booking
    static async getAll() {
        const [rows] = await db.query(`
            SELECT b.*, 
                   r.name as room_name, 
                   u.username as user_name, 
                   u.full_name as user_full_name,
                   sekre.username as sekre_name,
                   bsp.username as bsp_name
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id
            LEFT JOIN users sekre ON b.approved_by_sekre = sekre.id
            LEFT JOIN users bsp ON b.approved_by_bsp = bsp.id
            ORDER BY b.booking_date DESC, b.start_time ASC
        `);
        return rows;
    }

    // Ambil booking berdasarkan role (untuk approval)
    static async getByRole(role) {
        let statusCondition = '';
        if (role === 'sekre') {
            statusCondition = "status = 'pending_sekre'";
        } else if (role === 'bsp') {
            statusCondition = "status = 'pending_bsp'";
        }

        const [rows] = await db.query(`
            SELECT b.*, r.name as room_name, u.full_name as user_full_name, u.username
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            JOIN users u ON b.user_id = u.id
            WHERE ${statusCondition}
            ORDER BY b.created_at ASC
        `);
        return rows;
    }

    // Ambil booking milik user
    static async getByUser(userId) {
        const [rows] = await db.query(`
            SELECT b.*, r.name as room_name, r.image_url,
                   CASE 
                       WHEN b.status = 'pending_sekre' THEN 'Menunggu Verifikasi Sekretariat'
                       WHEN b.status = 'pending_bsp' THEN 'Menunggu Verifikasi BSP'
                       WHEN b.status = 'approved' THEN 'Disetujui'
                       WHEN b.status = 'rejected_sekre' THEN 'Ditolak Sekretariat'
                       WHEN b.status = 'rejected_bsp' THEN 'Ditolak BSP'
                       WHEN b.status = 'cancelled' THEN 'Dibatalkan'
                   END as status_text
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.id 
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC, b.start_time ASC
        `, [userId]);
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.query(`
        SELECT b.*, r.name as room_name, u.full_name as user_name, u.username
        FROM bookings b 
        JOIN rooms r ON b.room_id = r.id 
        JOIN users u ON b.user_id = u.id
        WHERE b.id = ?
    `, [id]);
        return rows[0];
    }


    // Cek ketersediaan (hanya cek booking yang sudah approved)
    static async checkAvailability(roomId, date, startTime, endTime) {
        const [rows] = await db.query(
            `SELECT * FROM bookings 
             WHERE room_id = ? 
             AND booking_date = ? 
             AND status = 'approved'
             AND ((start_time <= ? AND end_time > ?) 
             OR (start_time < ? AND end_time >= ?))`,
            [roomId, date, startTime, startTime, endTime, endTime]
        );
        return rows;
    }

    // Buat booking baru (status = pending_sekre)
    static async create(bookingData) {
        const {
            room_id, user_id, booking_date, start_time, end_time,
            attendee_name, attendee_email, purpose, organization
        } = bookingData;

        const [result] = await db.query(
            `INSERT INTO bookings 
             (room_id, user_id, booking_date, start_time, end_time, 
              attendee_name, attendee_email, purpose, organization, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_sekre')`,
            [room_id, user_id, booking_date, start_time, end_time,
                attendee_name, attendee_email, purpose, organization || null]
        );
        return result.insertId;
    }

    // Approve Sekretariat (Tahap 1)
    static async approveBySekre(id, adminId) {
        const [result] = await db.query(
            `UPDATE bookings 
             SET status = 'pending_bsp', 
                 approved_by_sekre = ?, 
                 approved_at_sekre = NOW() 
             WHERE id = ? AND status = 'pending_sekre'`,
            [adminId, id]
        );
        return result.affectedRows;
    }

    // Reject Sekretariat (Tahap 1)
    static async rejectBySekre(id, adminId, reason) {
        const [result] = await db.query(
            `UPDATE bookings 
             SET status = 'rejected_sekre', 
                 approved_by_sekre = ?, 
                 approved_at_sekre = NOW(),
                 rejected_by_sekre_reason = ?
             WHERE id = ? AND status = 'pending_sekre'`,
            [adminId, reason, id]
        );
        return result.affectedRows;
    }

    // Approve BSP (Tahap 2 - Final)
    static async approveByBSP(id, adminId) {
        const [result] = await db.query(
            `UPDATE bookings 
             SET status = 'approved', 
                 approved_by_bsp = ?, 
                 approved_at_bsp = NOW() 
             WHERE id = ? AND status = 'pending_bsp'`,
            [adminId, id]
        );
        return result.affectedRows;
    }

    // Reject BSP (Tahap 2)
    static async rejectByBSP(id, adminId, reason) {
        const [result] = await db.query(
            `UPDATE bookings 
             SET status = 'rejected_bsp', 
                 approved_by_bsp = ?, 
                 approved_at_bsp = NOW(),
                 rejected_by_bsp_reason = ?
             WHERE id = ? AND status = 'pending_bsp'`,
            [adminId, reason, id]
        );
        return result.affectedRows;
    }

    // Cancel booking (oleh user)
    static async cancel(id, userId) {
        const [result] = await db.query(
            `UPDATE bookings SET status = 'cancelled' 
             WHERE id = ? AND user_id = ? 
             AND status IN ('pending_sekre', 'pending_bsp')`,
            [id, userId]
        );
        return result.affectedRows;
    }
}

module.exports = BookingModel;