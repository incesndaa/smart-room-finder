import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Button, Alert, Box, Typography, Divider, IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';

const BookingForm = ({ open, onClose, room, onSubmit }) => {
    const { user } = useAuth();
    
    // Sesuaikan pembacaan property user session dari Supabase metadata
    const [formData, setFormData] = useState({
        date: format(new Date(), 'yyyy-MM-dd'),
        startTime: '09:00',
        endTime: '10:00',
        purpose: '',
        attendeeName: user?.full_name || user?.username || '',
        attendeeEmail: user?.email || ''
    });
    
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Update form data jika user session mendadak baru termuat setelah modal terbuka
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                attendeeName: user.full_name || user.username || '',
                attendeeEmail: user.email || ''
            }));
        }
    }, [user, open]);

    const validateForm = () => {
        const newErrors = {};
        if (!formData.date) newErrors.date = 'Tanggal harus diisi';
        if (!formData.startTime) newErrors.startTime = 'Jam mulai harus diisi';
        if (!formData.endTime) newErrors.endTime = 'Jam selesai harus diisi';
        if (formData.startTime >= formData.endTime) newErrors.endTime = 'Jam selesai harus setelah jam mulai';
        if (!formData.purpose) newErrors.purpose = 'Tujuan booking harus diisi';
        if (!formData.attendeeName) newErrors.attendeeName = 'Nama pemesan harus diisi';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return;
        
        setSubmitting(true);
        try {
            const bookingData = {
                room_id: room.id,
                booking_date: formData.date,
                start_time: formData.startTime,
                end_time: formData.endTime,
                attendee_name: formData.attendeeName,
                attendee_email: formData.attendeeEmail,
                purpose: formData.purpose
            };
            
            // Eksekusi fungsi submit yang diatur di HomePage (sudah aman pakai Supabase client)
            await onSubmit(bookingData);
            
            onClose();
            
            // Reset formulir ke kondisi awal
            setFormData({
                date: format(new Date(), 'yyyy-MM-dd'),
                startTime: '09:00',
                endTime: '10:00',
                purpose: '',
                attendeeName: user?.full_name || user?.username || '',
                attendeeEmail: user?.email || ''
            });
        } catch (error) {
            console.error('Error submitting booking:', error);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight={700}>
                        Booking {room?.name}
                    </Typography>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary">
                    Kapasitas: {room?.capacity} orang
                </Typography>
            </DialogTitle>
            
            <DialogContent>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField
                        label="Tanggal Booking"
                        type="date"
                        fullWidth
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        error={!!errors.date}
                        helperText={errors.date}
                        InputLabelProps={{ shrink: true }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 2 }}>
                        <TextField
                            label="Jam Mulai"
                            type="time"
                            value={formData.startTime}
                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                            error={!!errors.startTime}
                            helperText={errors.startTime}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                        />
                        <TextField
                            label="Jam Selesai"
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            error={!!errors.endTime}
                            helperText={errors.endTime}
                            InputLabelProps={{ shrink: true }}
                            sx={{ flex: 1 }}
                        />
                    </Box>

                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Booking akan diproses oleh admin. Mohon menunggu persetujuan.
                    </Alert>

                    <TextField
                        label="Tujuan Booking"
                        multiline
                        rows={3}
                        fullWidth
                        value={formData.purpose}
                        onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                        error={!!errors.purpose}
                        helperText={errors.purpose}
                        placeholder="Contoh: Rapat dosen, Praktikum mahasiswa, Rapat organisasi, dll"
                    />

                    <Divider />

                    <Typography variant="subtitle2" fontWeight={600}>Data Pemesan</Typography>
                    
                    <TextField
                        label="Nama Lengkap"
                        fullWidth
                        value={formData.attendeeName}
                        onChange={(e) => setFormData({ ...formData, attendeeName: e.target.value })}
                        error={!!errors.attendeeName}
                        helperText={errors.attendeeName}
                        required
                    />

                    <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={formData.attendeeEmail}
                        onChange={(e) => setFormData({ ...formData, attendeeEmail: e.target.value })}
                        helperText="Email untuk konfirmasi booking"
                    />
                </Box>
            </DialogContent>
            
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button onClick={onClose} disabled={submitting}>
                    Batal
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    disabled={submitting}
                    sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 30,
                        textTransform: 'none',
                        fontWeight: 600,
                        px: 4
                    }}
                >
                    {submitting ? 'Memproses...' : 'Ajukan Booking'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default BookingForm;