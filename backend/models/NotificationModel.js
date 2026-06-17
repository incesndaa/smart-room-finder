const db = require('../config/database');

class NotificationModel {
    // Buat notifikasi baru
    static async create(notificationData) {
        const { user_id, title, message, type, related_id } = notificationData;
        const [result] = await db.query(
            `INSERT INTO notifications (user_id, title, message, type, related_id) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, title, message, type, related_id || null]
        );
        return result.insertId;
    }

    // Ambil notifikasi user
    static async getByUser(userId) {
        const [rows] = await db.query(
            `SELECT * FROM notifications 
             WHERE user_id = ? 
             ORDER BY created_at DESC 
             LIMIT 50`,
            [userId]
        );
        return rows;
    }

    // Ambil jumlah notifikasi belum dibaca
    static async getUnreadCount(userId) {
        const [rows] = await db.query(
            `SELECT COUNT(*) as count FROM notifications 
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );
        return rows[0].count;
    }

    // Tandai sebagai dibaca
    static async markAsRead(id, userId) {
        const [result] = await db.query(
            `UPDATE notifications SET is_read = TRUE 
             WHERE id = ? AND user_id = ?`,
            [id, userId]
        );
        return result.affectedRows;
    }

    // Tandai semua sebagai dibaca
    static async markAllAsRead(userId) {
        const [result] = await db.query(
            `UPDATE notifications SET is_read = TRUE 
             WHERE user_id = ? AND is_read = FALSE`,
            [userId]
        );
        return result.affectedRows;
    }
}

module.exports = NotificationModel;