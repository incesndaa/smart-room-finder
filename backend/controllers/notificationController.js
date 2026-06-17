const NotificationModel = require('../models/NotificationModel');

const getNotifications = async (req, res) => {
    try {
        const notifications = await NotificationModel.getByUser(req.user.id);
        const unreadCount = await NotificationModel.getUnreadCount(req.user.id);
        res.json({ success: true, data: notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil notifikasi' });
    }
};

const markAsRead = async (req, res) => {
    try {
        await NotificationModel.markAsRead(req.params.id, req.user.id);
        res.json({ success: true, message: 'Notifikasi ditandai dibaca' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal update notifikasi' });
    }
};

const markAllAsRead = async (req, res) => {
    try {
        await NotificationModel.markAllAsRead(req.user.id);
        res.json({ success: true, message: 'Semua notifikasi ditandai dibaca' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal update notifikasi' });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };