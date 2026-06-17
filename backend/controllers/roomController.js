const RoomModel = require('../models/RoomModel');
const fs = require('fs');
const path = require('path');

const getAllRooms = async (req, res) => {
    try {
        const rooms = await RoomModel.getAll();
        res.json({ success: true, data: rooms });
    } catch (error) {
        console.error('Get all rooms error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data ruangan' });
    }
};

const getRoomById = async (req, res) => {
    try {
        const room = await RoomModel.getById(req.params.id);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan' });
        }
        res.json({ success: true, data: room });
    } catch (error) {
        console.error('Get room by id error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil detail ruangan' });
    }
};

const createRoom = async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'sekre') {
            return res.status(403).json({ success: false, message: 'Hanya Sekretariat yang bisa menambah ruangan' });
        }
        
        // AMANKAN DISINI: Cek apakah req.body ada nilainya
        if (!req.body) {
            return res.status(400).json({ 
                success: false, 
                message: 'Gagal membaca data. Pastikan format pengiriman data (Content-Type) benar.' 
            });
        }
        
        const { name, capacity, facilities } = req.body;
        let image_url = null;
        
        if (req.file) {
            image_url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
        }
        
        if (!name || !capacity) {
            return res.status(400).json({ success: false, message: 'Nama dan kapasitas ruangan wajib diisi' });
        }
        
        const roomId = await RoomModel.create({ name, capacity, facilities, image_url });
        res.status(201).json({ success: true, data: { id: roomId }, message: 'Ruangan berhasil ditambahkan' });
    } catch (error) {
        console.error('Create room error:', error);
        res.status(500).json({ success: false, message: 'Gagal menambah ruangan' });
    }
};

const updateRoom = async (req, res) => {
    try {
        console.log('=== UPDATE ROOM ===');
        console.log('User:', req.user);
        console.log('Room ID:', req.params.id);
        console.log('Body:', req.body);
        console.log('File:', req.file);
        
        if (!req.user || req.user.role !== 'sekre') {
            return res.status(403).json({ 
                success: false, 
                message: 'Hanya Sekretariat yang bisa mengupdate ruangan' 
            });
        }
        
        // Cek apakah ada data di body
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Data tidak ditemukan' 
            });
        }
        
        // Ambil data dari body (bisa dari FormData atau JSON)
        const { name, capacity, facilities } = req.body;
        
        if (!name || !capacity) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nama dan kapasitas ruangan wajib diisi' 
            });
        }
        
        // Cek apakah room ada
        const existingRoom = await RoomModel.getById(req.params.id);
        if (!existingRoom) {
            return res.status(404).json({ 
                success: false, 
                message: 'Ruangan tidak ditemukan' 
            });
        }
        
        // Proses gambar
        let finalImageUrl = existingRoom.image_url;
        if (req.file) {
            // Hapus gambar lama
            if (existingRoom.image_url) {
                const oldImagePath = path.join(__dirname, '../', existingRoom.image_url.replace('http://localhost:5000/', ''));
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }
            finalImageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        }
        
        const affected = await RoomModel.update(req.params.id, { 
            name, 
            capacity: parseInt(capacity), 
            facilities, 
            image_url: finalImageUrl 
        });
        
        res.json({ 
            success: true, 
            message: 'Ruangan berhasil diupdate' 
        });
    } catch (error) {
        console.error('Update room error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Gagal mengupdate ruangan',
            error: error.message 
        });
    }
};
const deleteRoom = async (req, res) => {
    try {
        if (req.user.role !== 'sekre') {
            return res.status(403).json({ success: false, message: 'Hanya Sekretariat yang bisa menghapus ruangan' });
        }
        
        // Hapus gambar jika ada
        const existingRoom = await RoomModel.getById(req.params.id);
        if (existingRoom && existingRoom.image_url) {
            const imagePath = path.join(__dirname, '../', existingRoom.image_url.replace(`${req.protocol}://${req.get('host')}/`, ''));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        
        const affected = await RoomModel.delete(req.params.id);
        
        if (affected === 0) {
            return res.status(404).json({ success: false, message: 'Ruangan tidak ditemukan' });
        }
        
        res.json({ success: true, message: 'Ruangan berhasil dihapus' });
    } catch (error) {
        console.error('Delete room error:', error);
        res.status(500).json({ success: false, message: 'Gagal menghapus ruangan' });
    }
};

module.exports = { getAllRooms, getRoomById, createRoom, updateRoom, deleteRoom };