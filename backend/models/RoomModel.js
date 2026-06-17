const db = require('../config/database');

class RoomModel {
    // Ambil semua ruangan
    static async getAll() {
        const [rows] = await db.query('SELECT * FROM rooms ORDER BY id');
        return rows;
    }

    // Ambil satu ruangan by ID
    static async getById(id) {
        const [rows] = await db.query('SELECT * FROM rooms WHERE id = ?', [id]);
        return rows[0];
    }

    // Tambah ruangan baru
    static async create(roomData) {
        const { name, capacity, facilities, image_url } = roomData;
        const [result] = await db.query(
            'INSERT INTO rooms (name, capacity, facilities, image_url) VALUES (?, ?, ?, ?)',
            [name, capacity, facilities || '[]', image_url || null]
        );
        return result.insertId;
    }

    // Update ruangan
    static async update(id, roomData) {
        const { name, capacity, facilities, image_url } = roomData;
        const [result] = await db.query(
            'UPDATE rooms SET name = ?, capacity = ?, facilities = ?, image_url = ? WHERE id = ?',
            [name, capacity, facilities || '[]', image_url || null, id]
        );
        return result.affectedRows;
    }

    // Hapus ruangan
    static async delete(id) {
        const [result] = await db.query('DELETE FROM rooms WHERE id = ?', [id]);
        return result.affectedRows;
    }
}

module.exports = RoomModel;