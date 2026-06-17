import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Sesuaikan jika path lu '../services/supabaseClient'
import { 
    Container, Typography, Box, Tabs, Tab, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Button, 
    TextField, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Alert 
} from '@mui/material';

export default function AdminDashboardPage() {
    const [tabValue, setTabValue] = useState(0);
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    
    // Simulasi Role Login: Ganti 'sekre' atau 'bsp' untuk ngetes tampilan
    // Di aplikasi aslinya, ini nanti diambil dari session metadata user yang login
    const [currentRole, setCurrentRole] = useState('sekre'); 

    // State Form Ruangan
    const [openRoomDialog, setOpenRoomDialog] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomForm, setRoomForm] = useState({
        name: '',
        capacity: '',
        facilities: '', 
        image_url: ''
    });

    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchAdminData();
    }, [tabValue]);

    const fetchAdminData = async () => {
        try {
            if (tabValue === 0) {
                // 1. Ambil data mentah dari tabel bookings
                const { data: bookingsData, error: bError } = await supabase
                    .from('bookings')
                    .select('*');
                if (bError) throw bError;

                // 2. Ambil data mentah dari tabel rooms untuk mapping manual
                const { data: roomsData, error: rError } = await supabase
                    .from('rooms')
                    .select('id, name');
                if (rError) throw rError;

                // 3. Gabungkan nama ruangan secara manual ke data booking
                const combinedData = (bookingsData || []).map(b => {
                    const room = (roomsData || []).find(r => r.id === b.room_id);
                    return {
                        ...b,
                        room_name: room ? room.name : `Room ID: ${b.room_id}`
                    };
                });

                setBookings(combinedData);
            } else {
                // Mengambil seluruh data ruangan dari tabel rooms
                const { data, error } = await supabase
                    .from('rooms')
                    .select('*');
                if (error) throw error;
                setRooms(data || []);
            }
        } catch (err) {
            console.error('Gagal mengambil data:', err);
            showSnackbar('Gagal memuat data: ' + err.message, 'error');
        }
    };

    // TAHAP 1: Sekre Approve Booking
    const handleApproveSekre = async (bookingId) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    status: 'approved_sekre', 
                    approved_by_sekre: 1, // ID dummy penanda Sekre      
                    approved_at_sekre: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (error) throw error;
            showSnackbar('Tahap 1 Berhasil: Disetujui oleh Sekre!', 'success');
            fetchAdminData();
        } catch (err) {
            showSnackbar('Gagal memproses persetujuan Sekre: ' + err.message, 'error');
        }
    };

    // TAHAP 2: BSP Approve Booking (Final)
    const handleApproveBSP = async (bookingId) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    status: 'approved', // Status Final
                    approved_by_bsp: 2, // ID dummy penanda BSP     
                    approved_at_bsp: new Date().toISOString()
                })
                .eq('id', bookingId);

            if (error) throw error;
            showSnackbar('Tahap 2 Selesai: Booking Resmi Disetujui (Final)!', 'success');
            fetchAdminData();
        } catch (err) {
            showSnackbar('Gagal memproses persetujuan BSP: ' + err.message, 'error');
        }
    };

    // AKSI REJECT / TOLAK BOOKING (Berlaku untuk Sekre maupun BSP)
    const handleRejectBooking = async (bookingId) => {
        const reason = prompt('Masukkan alasan penolakan booking:');
        if (reason === null) return; 

        try {
            // Tentukan kolom alasan mana yang diisi berdasarkan siapa yang menolak
            const updateFields = { status: 'rejected' };
            if (currentRole === 'sekre') {
                updateFields.rejected_by_sekre_reason = reason || 'Ditolak oleh Sekretaris';
            } else {
                updateFields.rejected_by_bsp_reason = reason || 'Ditolak oleh BSP';
            }

            const { error } = await supabase
                .from('bookings')
                .update(updateFields)
                .eq('id', bookingId);

            if (error) throw error;
            showSnackbar('Booking berhasil ditolak.', 'error');
            fetchAdminData();
        } catch (err) {
            showSnackbar('Gagal menolak booking: ' + err.message, 'error');
        }
    };

    // KELOLA RUANGAN: Tambah atau Update Data ke Tabel rooms (Khusus Sekre)
    const handleSaveRoom = async () => {
        try {
            if (!roomForm.name || !roomForm.capacity) {
                showSnackbar('Nama ruangan dan kapasitas wajib diisi!', 'error');
                return;
            }

            const payload = {
                name: roomForm.name,
                capacity: parseInt(roomForm.capacity),
                facilities: roomForm.facilities || null,
                image_url: roomForm.image_url || null
            };

            if (editingRoom) {
                const { error } = await supabase
                    .from('rooms')
                    .update(payload)
                    .eq('id', editingRoom.id);
                if (error) throw error;
                showSnackbar('Data ruangan berhasil diperbarui!', 'success');
            } else {
                const { error } = await supabase
                    .from('rooms')
                    .insert([payload]);
                if (error) throw error;
                showSnackbar('Ruangan baru berhasil ditambahkan!', 'success');
            }

            setOpenRoomDialog(false);
            setEditingRoom(null);
            clearRoomForm();
            fetchAdminData();
        } catch (err) {
            showSnackbar('Gagal menyimpan data ruangan: ' + err.message, 'error');
        }
    };

    // KELOLA RUANGAN: Hapus Ruangan dari Tabel rooms (Khusus Sekre)
    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus ruangan ini?')) return;
        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', roomId);
            if (error) throw error;
            showSnackbar('Ruangan berhasil dihapus!', 'success');
            fetchAdminData();
        } catch (err) {
            showSnackbar('Gagal menghapus ruangan: ' + err.message, 'error');
        }
    };

    const openEditRoom = (room) => {
        setEditingRoom(room);
        setRoomForm({
            name: room.name,
            capacity: room.capacity,
            facilities: room.facilities || '',
            image_url: room.image_url || ''
        });
        setOpenRoomDialog(true);
    };

    const clearRoomForm = () => {
        setRoomForm({ name: '', capacity: '', facilities: '', image_url: '' });
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                    Dashboard Admin SRF
                </Typography>
                {/* Switcher Role Sementara untuk Keperluan Testing di Frontend */}
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    size="small"
                    onClick={() => setCurrentRole(currentRole === 'sekre' ? 'bsp' : 'sekre')}
                >
                    Role Aktif: {currentRole.toUpperCase()} (Klik untuk Switch)
                </Button>
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
                    <Tab label="Verifikasi Booking" />
                    <Tab label="Kelola Ruangan" />
                </Tabs>
            </Box>

            {/* TAB 1: ALUR VERIFIKASI BOOKING 2 TAHAP */}
            {tabValue === 0 && (
                <TableContainer component={Paper} elevation={3}>
                    <Table>
                        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell><b>Nama Peminjam</b></TableCell>
                                <TableCell><b>Ruangan</b></TableCell>
                                <TableCell><b>Tanggal & Waktu</b></TableCell>
                                <TableCell><b>Keperluan</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                                <TableCell align="center"><b>Aksi Verifikasi</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {bookings.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">Tidak ada pengajuan booking.</TableCell>
                                </TableRow>
                            ) : (
                                bookings.map((b) => (
                                    <TableRow key={b.id}>
                                        <TableCell>{b.attendee_name || 'Tidak ada nama'}</TableCell>
                                        <TableCell>{b.room_name}</TableCell>
                                        <TableCell>{b.booking_date}<br/><Typography variant="caption" color="textSecondary">{b.start_time} - {b.end_time}</Typography></TableCell>
                                        <TableCell>{b.purpose || '-'}</TableCell>
                                        <TableCell><b>{b.status}</b></TableCell>
                                        <TableCell align="center">
                                            {/* TAHAP 1: Tombol muncul hanya jika status pending DAN login sebagai Sekre */}
                                            {(b.status === 'pending' || b.status === 'pending_sekre') && currentRole === 'sekre' && (
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button variant="contained" color="success" size="small" onClick={() => handleApproveSekre(b.id)}>Setuju (Sekre)</Button>
                                                    <Button variant="contained" color="error" size="small" onClick={() => handleRejectBooking(b.id)}>Tolak</Button>
                                                </Box>
                                            )}

                                            {/* TAHAP 2: Tombol muncul hanya jika status approved_sekre DAN login sebagai BSP */}
                                            {b.status === 'approved_sekre' && currentRole === 'bsp' && (
                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                    <Button variant="contained" color="primary" size="small" onClick={() => handleApproveBSP(b.id)}>Setuju Final (BSP)</Button>
                                                    <Button variant="contained" color="error" size="small" onClick={() => handleRejectBooking(b.id)}>Tolak</Button>
                                                </Box>
                                            )}

                                            {/* Kondisi Menunggu Antrean Pihak Lain */}
                                            {(b.status === 'pending' || b.status === 'pending_sekre') && currentRole === 'bsp' && (
                                                <Typography variant="body2" color="textSecondary">Menunggu Persetujuan Sekre</Typography>
                                            )}
                                            {b.status === 'approved_sekre' && currentRole === 'sekre' && (
                                                <Typography variant="body2" color="success.main">Sudah di-ACC Sekre, Menunggu BSP</Typography>
                                            )}
                                            {b.status === 'approved' && (
                                                <Typography variant="body2" color="green" fontWeight="bold">Selesai (Approved Final)</Typography>
                                            )}
                                            {b.status === 'rejected' && (
                                                <Typography variant="body2" color="error.main">Booking Ditolak</Typography>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* TAB 2: KELOLA RUANGAN (Hanya Sekre yang bisa modifikasi, BSP hanya bisa liat) */}
            {tabValue === 1 && (
                <Box>
                    {/* Tombol Tambah Ruangan disembunyikan total jika login sebagai BSP */}
                    {currentRole === 'sekre' && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                            <Button variant="contained" color="primary" onClick={() => { setEditingRoom(null); clearRoomForm(); setOpenRoomDialog(true); }}>
                                + Tambah Ruangan Baru
                            </Button>
                        </Box>
                    )}

                    <TableContainer component={Paper} elevation={3}>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><b>Nama Ruangan</b></TableCell>
                                    <TableCell><b>Kapasitas</b></TableCell>
                                    <TableCell><b>Fasilitas</b></TableCell>
                                    {currentRole === 'sekre' && <TableCell align="center"><b>Aksi Kelola</b></TableCell>}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rooms.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={currentRole === 'sekre' ? 4 : 3} align="center">Belum ada data ruangan.</TableCell>
                                    </TableRow>
                                ) : (
                                    rooms.map((room) => (
                                        <TableRow key={room.id}>
                                            <TableCell>{room.name}</TableCell>
                                            <TableCell>{room.capacity} Orang</TableCell>
                                            <TableCell>{room.facilities || '-'}</TableCell>
                                            {/* Kolom Aksi Edit/Delete hanya dirender jika login sebagai Sekre */}
                                            {currentRole === 'sekre' && (
                                                <TableCell align="center">
                                                    <Button variant="outlined" color="primary" size="small" sx={{ mr: 1 }} onClick={() => openEditRoom(room)}>Edit</Button>
                                                    <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteRoom(room.id)}>Hapus</Button>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* DIALOG FORM RUANGAN */}
            <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingRoom ? 'Edit Data Ruangan' : 'Tambah Ruangan Baru'}</DialogTitle>
                <DialogContent>
                    <TextField margin="dense" label="Nama Ruangan" fullWidth value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} />
                    <TextField margin="dense" label="Kapasitas (Orang)" type="number" fullWidth value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} />
                    <TextField margin="dense" label="Fasilitas (facilities)" fullWidth value={roomForm.facilities} onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })} />
                    <TextField margin="dense" label="URL Gambar Ruangan" fullWidth value={roomForm.image_url} onChange={(e) => setRoomForm({ ...roomForm, image_url: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRoomDialog(false)}>Batal</Button>
                    <Button onClick={handleSaveRoom} variant="contained" color="primary">Simpan</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}