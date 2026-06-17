const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const notificationRoutes = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 
app.use('/uploads', express.static('uploads')); 

app.get('/', (req, res) => {
    res.json({ name: 'Booking Ruangan API', version: '1.0.0', status: 'Running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);

// ========== ERROR HANDLER ==========
app.use((err, req, res, next) => {
    console.error('Global error:', err);
    res.status(500).json({ 
        success: false, 
        message: 'Terjadi kesalahan pada server',
        error: err.message 
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});