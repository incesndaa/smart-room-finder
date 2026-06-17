const UserModel = require('../models/UserModel');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
    try {
        const { username, email, password, full_name } = req.body;
        
        const existingUser = await UserModel.findByUsername(username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Username atau email sudah terdaftar'
            });
        }
        
        await UserModel.register({ username, email, password, full_name });
        
        res.status(201).json({
            success: true,
            message: 'Registrasi berhasil! Silakan login.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal registrasi',
            error: error.message
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await UserModel.findByUsername(username);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        const isValid = await UserModel.verifyPassword(password, user.password);
        if (!isValid) {
            return res.status(401).json({
                success: false,
                message: 'Username atau password salah'
            });
        }
        
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Gagal login',
            error: error.message
        });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await UserModel.getById(req.user.id);
        res.json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Gagal mengambil profil' });
    }
};

module.exports = { register, login, getProfile };