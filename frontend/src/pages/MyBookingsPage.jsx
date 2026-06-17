import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Card, CardContent, Chip, IconButton, Alert, Snackbar, Fade, Grid } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const MyBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            const response = await api.get('/bookings/my-bookings');
            if (response.data.success) setBookings(response.data.data);
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal memuat data booking', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = async (id) => {
        try {
            const response = await api.delete(`/bookings/${id}`);
            if (response.data.success) {
                setSnackbar({ open: true, message: 'Booking berhasil dibatalkan', severity: 'success' });
                loadBookings();
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Gagal membatalkan booking', severity: 'error' });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'approved':
                return { bg: '#E8F8F5', text: '#27AE60', label: 'Disetujui' };
            case 'pending':
                return { bg: '#FEF9E7', text: '#F39C12', label: 'Menunggu Persetujuan' };
            case 'rejected':
                return { bg: '#FDEDEC', text: '#E74C3C', label: 'Ditolak' };
            case 'cancelled':
                return { bg: '#F2F4F4', text: '#7F8C8D', label: 'Dibatalkan' };
            default:
                return { bg: '#F2F4F4', text: '#7F8C8D', label: status };
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <Container maxWidth="lg" sx={{ py: 5 }}>

            {bookings.length === 0 ? (
                <Box textAlign="center" py={8}>
                    <Typography variant="h6" color="text.secondary">Belum ada booking</Typography>
                    <Typography variant="body2" color="text.secondary">Silakan booking ruangan melalui halaman utama</Typography>
                </Box>
            ) : (
                <Grid container spacing={3}>
                    {bookings.map((booking, index) => {
                        const status = getStatusColor(booking.status);
                        return (
                            <Grid item xs={12} key={booking.id} sx={{ display: 'flex', width: '100%'  }}>
                                <Fade in timeout={300 + index * 100} style={{ width: '100%', display: 'flex'}}>
                                    <Card sx={{
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'all 0.3s',
                                        '&:hover': { boxShadow: 6 },
                                        width: '100%',
                                        height: '100%',
                                        minHeight: 200,
                                        display: 'flex',
                                        flexDirection: 'column'
                                    }}>
                                        <CardContent sx={{ flex: 1, p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>

                                                        <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                                                            {booking.room_name}
                                                        </Typography>

                                                    </Box>

                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <EventIcon fontSize="small" sx={{ color: '#888' }} />
                                                            <Typography variant="body2" sx={{ color: '#555' }}>
                                                                {format(new Date(booking.booking_date), 'EEEE, dd MMMM yyyy', { locale: id })}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <AccessTimeIcon fontSize="small" sx={{ color: '#888' }} />
                                                            <Typography variant="body2" sx={{ color: '#555' }}>
                                                                {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)} WIB
                                                            </Typography>
                                                        </Box>
                                                    </Box>

                                                    {booking.purpose && (
                                                        <Typography variant="body2" sx={{ color: '#666', mt: 2 }}>
                                                            {booking.purpose}
                                                        </Typography>
                                                    )}

                                                    {/* Pesan tambahan berdasarkan status */}
                                                    {booking.status === 'pending_sekre' && (
                                                        <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                                                            Booking menunggu verifikasi dari Sekretariat
                                                        </Alert>
                                                    )}
                                                    {booking.status === 'pending_bsp' && (
                                                        <Alert severity="info" sx={{ mt: 2, borderRadius: 2 }}>
                                                            Booking telah lolos verifikasi Sekretariat, menunggu approval final dari BSP
                                                        </Alert>
                                                    )}
                                                    {booking.status === 'rejected_sekre' && booking.rejected_by_sekre_reason && (
                                                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                                            <strong>Ditolak Sekretariat:</strong> {booking.rejected_by_sekre_reason}
                                                        </Alert>
                                                    )}
                                                    {booking.status === 'rejected_bsp' && booking.rejected_by_bsp_reason && (
                                                        <Alert severity="error" sx={{ mt: 2, borderRadius: 2 }}>
                                                            <strong>Ditolak BSP:</strong> {booking.rejected_by_bsp_reason}
                                                        </Alert>
                                                    )}
                                                    {booking.status === 'approved' && (
                                                        <Alert severity="success" sx={{ mt: 2, borderRadius: 2 }}>
                                                            Booking telah disetujui! 
                                                        </Alert>
                                                    )}
                                                </Box>


                                            </Box>
                                        </CardContent>
                                    </Card>
                                </Fade>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default MyBookingsPage;