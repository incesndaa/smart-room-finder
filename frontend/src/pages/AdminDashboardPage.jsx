import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Container, Typography, Box, Tabs, Tab, Table, TableBody, 
    TableCell, TableContainer, TableHead, TableRow, Paper, Button, 
    TextField, Dialog, DialogActions, DialogContent, DialogTitle, 
    Snackbar, Alert, Grid, Card, CardContent, Divider, Chip, 
    IconButton, Tooltip, Select, MenuItem, InputLabel, FormControl,
    TablePagination
} from '@mui/material';
import { 
    Dashboard as DashboardIcon, 
    MeetingRoom as RoomIcon, 
    EventAvailable as BookingIcon, 
    People as PeopleIcon, 
    Delete as DeleteIcon, 
    Edit as EditIcon, 
    CheckCircle as CheckCircleIcon, 
    Cancel as CancelIcon, 
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    Notifications as NotificationIcon
} from '@mui/icons-material';

export default function AdminDashboardPage() {
    // Tab Navigation State
    const [tabValue, setTabValue] = useState(0);
    
    // Core Data States
    const [bookings, setBookings] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [users, setUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    
    // Loading & Refresh State
    const [loading, setLoading] = useState(false);
    
    // Pagination States
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);
    
    // Filter States
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // State Form Ruangan (Sesuai image_890be6.png: facilities pake s, tanpa description)
    const [openRoomDialog, setOpenRoomDialog] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [roomForm, setRoomForm] = useState({
        name: '',
        capacity: '',
        facilities: '',
        image_url: ''
    });

    // State Form User (Manajemen Akun Admin/User)
    const [openUserDialog, setOpenUserDialog] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        email: '',
        full_name: '',
        role: 'mahasiswa'
    });

    // Global Alert Feedback State
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Initial Load
    useEffect(() => {
        fetchAllDashboardData();
    }, []);

    // Fetch data setiap kali tab dipindah untuk sinkronisasi instan
    useEffect(() => {
        fetchAdminDataByTab();
    }, [tabValue, statusFilter]);

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const fetchAllDashboardData = async () => {
        setLoading(true);
        try {
            // Tarik data kamar dasar untuk mapping global
            const { data: roomsData } = await supabase.from('rooms').select('*');
            setRooms(roomsData || []);

            // Tarik data user global
            const { data: usersData } = await supabase.from('users').select('*');
            setUsers(usersData || []);

            // Tarik seluruh data booking
            const { data: bookingsData, error: bError } = await supabase.from('bookings').select('*');
            if (bError) throw bError;

            // Gabungkan nama ruangan secara manual (Mengatasi ketiadaan garis relasi langsung di ERD)
            const mappedBookings = (bookingsData || []).map(b => {
                const room = (roomsData || []).find(r => r.id === b.room_id);
                return {
                    ...b,
                    room_name: room ? room.name : `Room ID: ${b.room_id}`
                };
            });
            setBookings(mappedBookings);

            // Tarik notifikasi terbaru
            const { data: notifData } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5);
            setNotifications(notifData || []);

        } catch (err) {
            console.error(err);
            showSnackbar('Gagal melakukan sinkronisasi data awal: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminDataByTab = async () => {
        // Logika pemisahan fetch data per tab agar aplikasi hemat bandwidth dan responsif
        try {
            if (tabValue === 0 || tabValue === 1) {
                let query = supabase.from('bookings').select('*');
                if (statusFilter !== 'all') {
                    query = query.eq('status', statusFilter);
                }
                const { data: bData } = await query;
                const { data: rData } = await supabase.from('rooms').select('id, name');
                
                const mapped = (bData || []).map(b => {
                    const room = (rData || []).find(r => r.id === b.room_id);
                    return { ...b, room_name: room ? room.name : `ID: ${b.room_id}` };
                });
                setBookings(mapped);
            } else if (tabValue === 2) {
                const { data } = await supabase.from('rooms').select('*');
                setRooms(data || []);
            } else if (tabValue === 3) {
                const { data } = await supabase.from('users').select('*');
                setUsers(data || []);
            } else if (tabValue === 4) {
                const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
                setNotifications(data || []);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // --- LOGIKA AKSI VERIFIKASI BOOKING ---
    const handleApproveSekre = async (id) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    status: 'approved_sekre', 
                    approved_by_sekre: 1, // ID Admin Sekre penanggung jawab (Ubah dinamis jika ada)
                    approved_at_sekre: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            
            // Trigger auto-notifikasi ke tabel notifications sesuai skema
            await supabase.from('notifications').insert([{
                title: 'Booking Disetujui Sekre',
                message: `Pengajuan booking ID ${id} telah disetujui oleh Sekretariat.`,
                is_read: 0
            }]);

            showSnackbar('Status berhasil diperbarui: Approved Sekre!', 'success');
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal verifikasi: ' + err.message, 'error');
        }
    };

    const handleApproveBSP = async (id) => {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ 
                    status: 'approved', // Status final
                    approved_by_bsp: 2, 
                    approved_at_bsp: new Date().toISOString()
                })
                .eq('id', id);

            if (error) throw error;
            showSnackbar('Booking disetujui sepenuhnya oleh BSP!', 'success');
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal memproses persetujuan BSP: ' + err.message, 'error');
        }
    };

    const handleRejectBooking = async (id, roleType) => {
        const reason = prompt('Masukkan alasan penolakan resmi:');
        if (reason === null) return;

        try {
            const updatePayload = { status: 'rejected' };
            if (roleType === 'sekre') {
                updatePayload.rejected_by_sekre_reason = reason || 'Ditolak oleh Sekre';
            } else {
                updatePayload.rejected_by_bsp_reason = reason || 'Ditolak oleh BSP';
            }

            const { error } = await supabase.from('bookings').update(updatePayload).eq('id', id);
            if (error) throw error;

            showSnackbar('Booking berhasil ditolak.', 'warning');
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal menolak booking: ' + err.message, 'error');
        }
    };

    // --- LOGIKA CRUD KELOLA RUANGAN ---
    const handleSaveRoom = async () => {
        try {
            if (!roomForm.name || !roomForm.capacity) {
                showSnackbar('Nama dan Kapasitas Ruangan wajib diisi!', 'error');
                return;
            }

            const payload = {
                name: roomForm.name,
                capacity: parseInt(roomForm.capacity),
                facilities: roomForm.facilities || null,
                image_url: roomForm.image_url || null
            };

            if (editingRoom) {
                const { error } = await supabase.from('rooms').update(payload).eq('id', editingRoom.id);
                if (error) throw error;
                showSnackbar('Data ruangan berhasil diperbarui!', 'success');
            } else {
                const { error } = await supabase.from('rooms').insert([payload]);
                if (error) throw error;
                showSnackbar('Ruangan baru sukses ditambahkan!', 'success');
            }

            setOpenRoomDialog(false);
            setEditingRoom(null);
            setRoomForm({ name: '', capacity: '', facilities: '', image_url: '' });
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal memproses data ruangan: ' + err.message, 'error');
        }
    };

    const handleDeleteRoom = async (roomId) => {
        if (!window.confirm('Yakin ingin menghapus ruangan ini secara permanen?')) return;
        try {
            const { error } = await supabase.from('rooms').delete().eq('id', roomId);
            if (error) throw error;
            showSnackbar('Ruangan terhapus!', 'success');
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal menghapus ruangan: ' + err.message, 'error');
        }
    };

    // --- LOGIKA MANAJEMEN USER ---
    const handleSaveUser = async () => {
        try {
            if (!userForm.username || !userForm.email) return;
            
            if (editingUser) {
                const { error } = await supabase.from('users').update(userForm).eq('id', editingUser.id);
                if (error) throw error;
                showSnackbar('Data pengguna berhasil diperbarui!', 'success');
            } else {
                const { error } = await supabase.from('users').insert([userForm]);
                if (error) throw error;
                showSnackbar('User baru ditambahkan!', 'success');
            }
            setOpenUserDialog(false);
            setEditingUser(null);
            fetchAllDashboardData();
        } catch (err) {
            showSnackbar('Gagal menyimpan data pengguna: ' + err.message, 'error');
        }
    };

    // --- LOGIKA UTILITAS & PAGINATION ---
    const handleChangePage = (event, newPage) => { setPage(newPage); };
    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const exportToCSV = () => {
        // Fitur tambahan ekspor data laporan
        const headers = ['ID,Peminjam,Ruangan,Tanggal,Waktu,Status\n'];
        const rows = bookings.map(b => `${b.id},${b.attendee_name || 'User'},${b.room_name},${b.booking_date},${b.start_time}-${b.end_time},${b.status}`);
        const blob = new Blob([headers.concat(rows.join('\n'))], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `Laporan_Booking_SRF.csv`);
        a.click();
    };

    // Hitung statistik ringkas untuk visualisasi widget card dashboard
    const totalPending = bookings.filter(b => b.status?.includes('pending')).length;
    const totalApproved = bookings.filter(b => b.status === 'approved').length;
    const filteredBookings = bookings.filter(b => 
        (b.attendee_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
         b.room_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 6 }}>
            {/* TOP BAR DASHBOARD */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="800" sx={{ color: '#1a237e', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <DashboardIcon fontSize="large" /> Smart Room Finder Admin Panel
                </Typography>
                <Box>
                    <Tooltip title="Refresh Seluruh Data">
                        <IconButton onClick={fetchAllDashboardData} disabled={loading} color="primary" sx={{ mr: 1, backgroundColor: '#e8eaf6' }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                    <Button variant="contained" startIcon={<DownloadIcon />} color="secondary" onClick={exportToCSV}>
                        Ekspor CSV
                    </Button>
                </Box>
            </Box>

            {/* WIDGET CARD STATISTIK */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderLeft: '6px solid #ff9800', boxShadow: 3 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" fontWeight="bold" gutterBottom>TOTAL ANTRIAN VERIFIKASI</Typography>
                            <Typography variant="h3" fontWeight="bold" color="#ff9800">{totalPending}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderLeft: '6px solid #4caf50', boxShadow: 3 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" fontWeight="bold" gutterBottom>BOOKING DISETUJUI (FINAL)</Typography>
                            <Typography variant="h3" fontWeight="bold" color="#4caf50">{totalApproved}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderLeft: '6px solid #2196f3', boxShadow: 3 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" fontWeight="bold" gutterBottom>TOTAL RUANGAN AKTIF</Typography>
                            <Typography variant="h3" fontWeight="bold" color="#2196f3">{rooms.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderLeft: '6px solid #9c27b0', boxShadow: 3 }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="subtitle2" fontWeight="bold" gutterBottom>PENGGUNA TERDAFTAR</Typography>
                            <Typography variant="h3" fontWeight="bold" color="#9c27b0">{users.length}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* MAIN NAVIGATION TABS */}
            <Paper elevation={2} sx={{ mb: 4, backgroundColor: '#fafafa' }}>
                <Tabs value={tabValue} onChange={(e, val) => setTabValue(val)} variant="scrollable" scrollButtons="auto" indicatorColor="primary" textColor="primary">
                    <Tab icon={<DashboardIcon />} iconPosition="start" label="Ikhtisar Utama" />
                    <Tab icon={<BookingIcon />} iconPosition="start" label="Verifikasi Booking" />
                    <Tab icon={<RoomIcon />} iconPosition="start" label="Kelola Ruangan" />
                    <Tab icon={<PeopleIcon />} iconPosition="start" label="Manajemen User" />
                    <Tab icon={<NotificationIcon />} iconPosition="start" label="Log Notifikasi" />
                </Tabs>
            </Paper>

            {/* ==================== TAB 0: OVERVIEW & RINGKASAN DATA ==================== */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    <Grid item xs={12} lg={8}>
                        <Paper sx={{ p: 3, boxShadow: 2 }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Antrean Masuk Terbaru</Typography>
                            <Divider sx={{ mb: 2 }} />
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell>Peminjam</TableCell>
                                            <TableCell>Ruangan</TableCell>
                                            <TableCell>Tanggal</TableCell>
                                            <TableCell>Status</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {bookings.slice(0, 4).map(b => (
                                            <TableRow key={b.id}>
                                                <TableCell>{b.attendee_name || 'Mhs'}</TableCell>
                                                <TableCell>{b.room_name}</TableCell>
                                                <TableCell>{b.booking_date}</TableCell>
                                                <TableCell>
                                                    <Chip size="small" label={b.status} color={b.status?.includes('approved') ? 'success' : 'warning'} />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} lg={4}>
                        <Paper sx={{ p: 3, boxShadow: 2, height: '100%' }}>
                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Notifikasi Sistem Terbaru</Typography>
                            <Divider sx={{ mb: 2 }} />
                            {notifications.slice(0, 3).map(n => (
                                <Box key={n.id} sx={{ p: 1.5, mb: 1, bgcolor: '#eef2f6', borderRadius: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold">{n.title}</Typography>
                                    <Typography variant="caption" color="textSecondary">{n.message}</Typography>
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {/* ==================== TAB 1: FULL VERIFIKASI BOOKING ==================== */}
            {tabValue === 1 && (
                <Paper sx={{ p: 3, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                        <TextField size="small" label="Cari Peminjam / Ruangan..." variant="outlined" sx={{ width: 300 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <FormControl size="small" sx={{ width: 200 }}>
                            <InputLabel>Filter Status</InputLabel>
                            <Select value={statusFilter} label="Filter Status" onChange={(e) => setStatusFilter(e.target.value)}>
                                <MenuItem value="all">Semua Status</MenuItem>
                                <MenuItem value="pending">Pending Kampus</MenuItem>
                                <MenuItem value="pending_sekre">Pending Sekre</MenuItem>
                                <MenuItem value="approved_sekre">Disetujui Sekre</MenuItem>
                                <MenuItem value="approved">Approved (Final)</MenuItem>
                                <MenuItem value="rejected">Ditolak</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#e0e0e0' }}>
                                <TableRow>
                                    <TableCell><b>ID</b></TableCell>
                                    <TableCell><b>Peminjam</b></TableCell>
                                    <TableCell><b>Ruangan</b></TableCell>
                                    <TableCell><b>Tanggal & Waktu</b></TableCell>
                                    <TableCell><b>Keperluan</b></TableCell>
                                    <TableCell><b>Status</b></TableCell>
                                    <TableCell align="center"><b>Verifikasi Alur Kampus</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBookings.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((b) => (
                                    <TableRow key={b.id} hover>
                                        <TableCell>{b.id}</TableCell>
                                        <TableCell>{b.attendee_name || 'N/A'}</TableCell>
                                        <TableCell>{b.room_name}</TableCell>
                                        <TableCell>{b.booking_date}<br/><Typography variant="caption" color="textSecondary">{b.start_time} - {b.end_time}</Typography></TableCell>
                                        <TableCell>{b.purpose || '-'}</TableCell>
                                        <TableCell>
                                            <Chip label={b.status} variant="outlined" color={b.status === 'approved' ? 'success' : b.status === 'rejected' ? 'error' : 'warning'} />
                                        </TableCell>
                                        <TableCell align="center">
                                            {/* Alur Bertingkat Sesuai Kolom ERD */}
                                            {(b.status === 'pending' || b.status === 'pending_sekre') && (
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <Button size="small" variant="contained" color="success" startIcon={<CheckCircleIcon />} onClick={() => handleApproveSekre(b.id)}>Sekre</Button>
                                                    <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleRejectBooking(b.id, 'sekre')}>Tolak</Button>
                                                </Box>
                                            )}
                                            {b.status === 'approved_sekre' && (
                                                <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                    <Button size="small" variant="contained" color="secondary" startIcon={<CheckCircleIcon />} onClick={() => handleApproveBSP(b.id)}>ACC BSP</Button>
                                                    <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleRejectBooking(b.id, 'bsp')}>Tolak BSP</Button>
                                                </Box>
                                            )}
                                            {b.status === 'approved' && <Typography color="green" variant="subtitle2">Selesai Diverifikasi</Typography>}
                                            {b.status === 'rejected' && <Typography color="error" variant="caption">Ditolak: {b.rejected_by_sekre_reason || b.rejected_by_bsp_reason || '-'}</Typography>}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination rowsPerPageOptions={[5, 10, 25]} component="div" count={filteredBookings.length} rowsPerPage={rowsPerPage} page={page} onPageChange={handleChangePage} onRowsPerPageChange={handleChangeRowsPerPage} />
                </Paper>
            )}

            {/* ==================== TAB 2: MANAGEMENT KELOLA RUANGAN ==================== */}
            {tabValue === 2 && (
                <Paper sx={{ p: 3, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Button variant="contained" color="primary" startIcon={<RoomIcon />} onClick={() => { setEditingRoom(null); setRoomForm({ name: '', capacity: '', facilities: '', image_url: '' }); setOpenRoomDialog(true); }}>
                            Tambah Ruangan Baru
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#1a237e' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff' }}><b>Nama Ruangan</b></TableCell>
                                    <TableCell sx={{ color: '#fff' }}><b>Kapasitas Maksimal</b></TableCell>
                                    <TableCell sx={{ color: '#fff' }}><b>Fasilitas (Facilities)</b></TableCell>
                                    <TableCell sx={{ color: '#fff' }}><b>Gambar</b></TableCell>
                                    <TableCell align="center" sx={{ color: '#fff' }}><b>Opsi Tindakan</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rooms.map((room) => (
                                    <TableRow key={room.id} hover>
                                        <TableCell fontWeight="bold">{room.name}</TableCell>
                                        <TableCell>{room.capacity} Orang</TableCell>
                                        <TableCell>{room.facilities || '-'}</TableCell>
                                        <TableCell>
                                            {room.image_url ? <img src={room.image_url} alt="Room" style={{ width: 60, height: 40, borderRadius: 4, objectFit: 'cover' }} /> : '-'}
                                        </TableCell>
                                        <TableCell align="center">
                                            <IconButton color="primary" onClick={() => {
                                                setEditingRoom(room);
                                                setRoomForm({ name: room.name, capacity: room.capacity, facilities: room.facilities || '', image_url: room.image_url || '' });
                                                setOpenRoomDialog(true);
                                            }}><EditIcon /></IconButton>
                                            <IconButton color="error" onClick={() => handleDeleteRoom(room.id)}><DeleteIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* ==================== TAB 3: MANAJEMEN USER ACCOUNTS ==================== */}
            {tabValue === 3 && (
                <Paper sx={{ p: 3, boxShadow: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                        <Button variant="contained" color="primary" startIcon={<PeopleIcon />} onClick={() => { setEditingUser(null); setUserForm({ username: '', email: '', full_name: '', role: 'mahasiswa' }); setOpenUserDialog(true); }}>
                            Tambah User Baru
                        </Button>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><b>Username</b></TableCell>
                                    <TableCell><b>Nama Lengkap</b></TableCell>
                                    <TableCell><b>Email Kampus</b></TableCell>
                                    <TableCell><b>Hak Akses (Role)</b></TableCell>
                                    <TableCell align="center"><b>Tindakan</b></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {users.map((u) => (
                                    <TableRow key={u.id} hover>
                                        <TableCell>{u.username}</TableCell>
                                        <TableCell>{u.full_name || '-'}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell><Chip label={u.role} color={u.role === 'admin' ? 'secondary' : 'default'} size="small" /></TableCell>
                                        <TableCell align="center">
                                            <IconButton color="primary" onClick={() => {
                                                setEditingUser(u);
                                                setUserForm({ username: u.username, email: u.email, full_name: u.full_name || '', role: u.role });
                                                setOpenUserDialog(true);
                                            }}><EditIcon /></IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* ==================== TAB 4: SYSTEM NOTIFICATION LOGS ==================== */}
            {tabValue === 4 && (
                <Paper sx={{ p: 3, boxShadow: 3 }}>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Log Audit Notifikasi Masuk Tabel</Typography>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ bgcolor: '#eee' }}>
                                <TableRow>
                                    <TableCell>ID</TableCell>
                                    <TableCell>Judul</TableCell>
                                    <TableCell>Pesan Log</TableCell>
                                    <TableCell>Status Baca</TableCell>
                                    <TableCell>Waktu Dibuat</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {notifications.map(n => (
                                    <TableRow key={n.id}>
                                        <TableCell>{n.id}</TableCell>
                                        <TableCell><b>{n.title}</b></TableCell>
                                        <TableCell>{n.message}</TableCell>
                                        <TableCell>{n.is_read === 1 ? 'Sudah Dibaca' : 'Belum'}</TableCell>
                                        <TableCell>{new Date(n.created_at).toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* MODAL DIALOG ROOM FORM (FIX: SESUAI ERD IMAGE_890BE6.PNG) */}
            <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingRoom ? 'Edit Kamar/Ruangan' : 'Tambah Ruangan Kuliah/Rapat Baru'}</DialogTitle>
                <DialogContent dividers>
                    <TextField margin="dense" label="Nama Ruangan" fullWidth value={roomForm.name} onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Kapasitas Maksimal (Orang)" type="number" fullWidth value={roomForm.capacity} onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Fasilitas Ruangan (facilities)" fullWidth multiline rows={2} placeholder="Contoh: AC, Proyektor, Papan Tulis" value={roomForm.facilities} onChange={(e) => setRoomForm({ ...roomForm, facilities: e.target.value })} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Tautan URL Foto Ruangan" fullWidth value={roomForm.image_url} onChange={(e) => setRoomForm({ ...roomForm, image_url: e.target.value })} />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenRoomDialog(false)}>Batalkan</Button>
                    <Button onClick={handleSaveRoom} variant="contained" color="primary">Simpan Perubahan</Button>
                </DialogActions>
            </Dialog>

            {/* MODAL DIALOG USER FORM */}
            <Dialog open={openUserDialog} onClose={() => setOpenUserDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>{editingUser ? 'Ubah Hak Akses Pengguna' : 'Daftarkan Pengguna Internal'}</DialogTitle>
                <DialogContent dividers>
                    <TextField margin="dense" label="Username" fullWidth value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Nama Lengkap" fullWidth value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} sx={{ mb: 2 }} />
                    <TextField margin="dense" label="Alamat Email" type="email" fullWidth value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} sx={{ mb: 2 }} />
                    <FormControl fullWidth size="small">
                        <InputLabel>Role Akun</InputLabel>
                        <Select value={userForm.role} label="Role Akun" onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}>
                            <MenuItem value="mahasiswa">Mahasiswa</MenuItem>
                            <MenuItem value="sekre">Sekretaris (Sekre)</MenuItem>
                            <MenuItem value="bsp">Bagian Sarana Prasarana (BSP)</MenuItem>
                            <MenuItem value="admin">Super Admin</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUserDialog(false)}>Batal</Button>
                    <Button onClick={handleSaveUser} variant="contained" color="primary">Simpan User</Button>
                </DialogActions>
            </Dialog>

            {/* TOAST SYSTEM ACCORDING TO USER FLOW */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
            </Snackbar>
        </Container>
    );
}

export default AdminDashboardPage;