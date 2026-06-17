const db = require('../config/database');
const bcrypt = require('bcryptjs');

class UserModel {
    // Register user baru
    static async register(userData) {
        const { username, email, password, full_name } = userData;
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const [result] = await db.query(
            `INSERT INTO users (username, email, password, full_name) 
             VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name]
        );
        return result.insertId;
    }

    // Login - cari user by username atau email
    static async findByUsername(username) {
        const [rows] = await db.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );
        return rows[0];
    }

    // Verifikasi password
    static async verifyPassword(plainPassword, hashedPassword) {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }

    // Get user by ID
    static async getById(id) {
        const [rows] = await db.query(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ?',
            [id]
        );
        return rows[0];
    }
}

module.exports = UserModel;