import React, { useState, useEffect } from 'react';
import {
    Container, Typography, Box, Card, CardContent, Chip,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Button, Dialog, DialogTitle,
    DialogContent, DialogActions, TextField, Alert, Snackbar,
    IconButton, Tooltip, Fade, Tabs, Tab, InputAdornment, Avatar
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import PeopleIcon from '@mui/icons-material/People';
import { supabase } from '../services/supabaseClient'; // GANTI KE SUPABASE CLIENT
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';

const AdminDashboardPage = () => {
    const { user } = useAuth();
    const [tabValue, setTabValue] = useState(0);

    const [pendingBookings, setPendingBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [openDetail, setOpenDetail] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [openReject, setOpenReject] = useState(false);

    const [rooms, setRooms] = useState([]);
    const [openRoomDialog, setOpenRoomDialog] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [openViewDialog, setOpenViewDialog] = useState(false);
    const [viewingRoom, setViewingRoom] = useState(null);
    const [roomFormData, setRoomFormData] = useState({
        name: '',
        capacity: '',
        facilities: '',
        image_url: ''
    });
    const [roomFormErrors, setRoomFormErrors] = useState({});

    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const isSekre = user?.role === 'sekre';
    const isBSP = user?.role === 'bsp';
    const canEditRooms = isSekre;
    const navigate = useNavigate();

    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    useEffect(() => {
        if (!isSekre && !isBSP) return;
        loadData();
    }, [user]);

    // 1. MEMUAT DATA MASTER (BOOKINGS & ROOMS) DARI SUPABASE
    const loadData = async () => {
        setLoading(true);
        try {
            // Ambil data ruangan
            const { data: roomsData, error: roomsErr } = await supabase.from('rooms').select('*');
            if (roomsErr) throw roomsErr;
            if (roomsData) setRooms(roomsData);

            // Ambil semua data booking berserta relasi join ke users dan rooms
            const { data: bookingsData, error: bookingsErr } = await supabase
                .from('bookings')
                .select(`
                    *,
                    users (username, full_name),
                    rooms (name)
                `)
                .order('booking_date', { ascending: false });

            if (bookingsErr) throw bookingsErr;

            if (bookingsData) {
                // Mapping data agar strukturnya cocok dengan tabel UI lamamu
                const formatted = bookingsData.map(b => ({
                    ...b,
                    user_full_name: b.users ? b.users.full_name : 'Pemesan Umum',
                    username: b.users ? b.users.username : 'user',
                    room_name: b.rooms ? b.rooms.name : 'Ruangan Kosong'
                }));

                setAllBookings(formatted);

                // Filter data verifikasi berdasarkan tingkatan peran (Role)
                if (isSekre) {
                    // Sekretariat memproses berkas masuk yang berstatus 'pending' atau 'pending_sekre'
                    setPendingBookings(formatted.filter(b => b.status === 'pending' || b.status === 'pending_sekre'));
                } else if (isBSP) {
                    // BSP memproses kelanjutan berkas yang lolos tahap 1 ('pending_bsp')
                    setPendingBookings(formatted.filter(b => b.status === 'pending_bsp'));
                }
            }
        } catch (error) {
            console.error('Error load data:', error);
            setSnackbar({ open: true, message: 'Gagal memuat data dari Supabase', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // 2. FUNGSI PERSETUJUAN (APPROVE) BOOKING BERTAHAP
    const handleApprove = async (id) => {
        // Tentukan kelanjutan status berdasarkan siapa yang menyetujui
        const nextStatus = isSekre ? 'pending_bsp' : 'approved';
        const successMessage = isSekre
            ? 'Booking lolos verifikasi Sekretariat! Menunggu verifikasi final BSP.'
            : 'Booking FINAL DISETUJUI! Jadwal telah dikunci.';

        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: nextStatus })
                .eq('id', id);

            if (error) throw error;

            setSnackbar({ open: true, message: successMessage, severity: 'success' });
            loadData();
            setOpenDetail(false);
        } catch (error) {
            console.error('Approve error:', error);
            setSnackbar({ open: true, message: 'Gagal memproses persetujuan booking', severity: 'error' });
        }
    };

    // 3. FUNGSI PENOLAKAN (REJECT) BOOKING BERTAHAP
    const handleReject = async () => {
        const nextStatus = isSekre ? 'rejected_sekre' : 'rejected_bsp';
        const errorMessage = isSekre ? 'Booking ditolak oleh Sekretariat' : 'Booking ditolak oleh BSP';
        
        // Atur penempatan kolom catatan alasan penolakan sesuai role admin
        const updateFields = isSekre 
            ? { status: nextStatus, rejected_by_sekre_reason: rejectReason }
            : { status: nextStatus, rejected_by_bsp_reason: rejectReason };

        try {
            const { error } = await supabase
                .from('bookings')
                .update(updateFields)
                .eq('id', selectedBooking?.id);

            if (error) throw error;

            setSnackbar({ open: true, message: errorMessage, severity: 'warning' });
            loadData();
            setOpenReject(false);
            setOpenDetail(false);
            setRejectReason('');
        } catch (error) {
            console.error('Reject error:', error);
            setSnackbar({ open: true, message: 'Gagal menolak pengajuan booking', severity: 'error' });
        }
    };

    const handleOpenAddRoom = () => {
        if (!canEditRooms) {
            setSnackbar({ open: true, message: 'Anda tidak memiliki izin untuk menambah ruangan', severity: 'error' });
            return;
        }
        setEditingRoom(null);
        setRoomFormData({ name: '', capacity: '', facilities: '', image_url: '' });
        setImageFile(null);
        setImagePreview('');
        setRoomFormErrors({});
        setOpenRoomDialog(true);
    };

    const handleOpenEditRoom = (room) => {
        if (!canEditRooms) {
            setSnackbar({ open: true, message: 'Anda tidak memiliki izin untuk mengedit ruangan', severity: 'error' });
            return;
        }
        setEditingRoom(room);
        setRoomFormData({
            name: room.name,
            capacity: room.capacity,
            facilities: Array.isArray(room.facilities)
                ? room.facilities.join(', ')
                : (typeof room.facilities === 'string' ? JSON.parse(room.facilities || '[]').join(', ') : ''),
            image_url: room.image_url || ''
        });
        setImageFile(null);
        setImagePreview('');
        setRoomFormErrors({});
        setOpenRoomDialog(true);
    };

    const handleOpenViewRoom = (room) => {
        setViewingRoom(room);
        setOpenViewDialog(true);
    };

    const validateRoomForm = () => {
        const errors = {};
        if (!roomFormData.name.trim()) errors.name = 'Nama ruangan wajib diisi';
        if (!roomFormData.capacity) errors.capacity = 'Kapasitas wajib diisi';
        if (roomFormData.capacity && roomFormData.capacity < 1) errors.capacity = 'Kapasitas minimal 1';
        setRoomFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // 4. FUNGSI SIMPAN DAN UPLOAD GAMBAR RUANGAN KE SUPABASE STORAGE
    const handleSaveRoom = async () => {
        if (!validateRoomForm()) return;
        
        setLoading(true);
        try {
            let finalImageUrl = roomFormData.image_url;

            // Jika admin memilih file gambar baru, upload ke Supabase Storage Bucket 'room-images'
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Date.now()}_room.${fileExt}`;
                const filePath = `public/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('room-images') // Pastikan nama Bucket ini sudah kamu buat di Supabase Storage dashboard
                    .upload(filePath, imageFile, { upsert: true });

                if (uploadError) throw uploadError;

                // Dapatkan URL Publik gambar yang berhasil diunggah
                const { data: publicUrlData } = supabase.storage
                    .from('room-images')
                    .getPublicUrl(filePath);

                finalImageUrl = publicUrlData.publicUrl;
            }

            const facilitiesArray = roomFormData.facilities
                .split(',')
                .map(f => f.trim())
                .filter(f => f);

            const payload = {
                name: roomFormData.name,
                capacity: parseInt(roomFormData.capacity),
                facilities: JSON.stringify(facilitiesArray),
                image_url: finalImageUrl
            };

            let saveError;
            if (editingRoom) {
                // Update Ruangan
                const { error } = await supabase
                    .from('rooms')
                    .update(payload)
                    .eq('id', editingRoom.id);
                saveError = error;
            } else {
                // Tambah Ruangan Baru
                const { error } = await supabase
                    .from('rooms')
                    .insert([payload]);
                saveError = error;
            }

            if (saveError) throw saveError;

            setSnackbar({ 
                open: true, 
                message: editingRoom ? 'Ruangan berhasil diupdate' : 'Ruangan berhasil ditambahkan', 
                severity: 'success' 
            });
            setOpenRoomDialog(false);
            setImageFile(null);
            setImagePreview('');
            loadData();

        } catch (error) {
            console.error('Save room error:', error);
            setSnackbar({ 
                open: true, 
                message: error.message || 'Gagal menyimpan data ruangan', 
                severity: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // 5. FUNGSI HAPUS RUANGAN
    const handleDeleteRoom = async () => {
        if (!canEditRooms) {
            setSnackbar({ open: true, message: 'Anda tidak memiliki izin untuk menghapus ruangan', severity: 'error' });
            return;
        }

        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', deleteConfirm.id);

            if (error) throw error;

            setSnackbar({ open: true, message: 'Ruangan berhasil dihapus', severity: 'success' });
            setDeleteConfirm(null);
            loadData();
        } catch (error) {
            console.error('Delete room error:', error);
            setSnackbar({ open: true, message: 'Gagal menghapus ruangan', severity: 'error' });
        }
    };

    const getFacilitiesList = (facilities) => {
        if (Array.isArray(facilities)) return facilities;
        if (typeof facilities === 'string') {
            try {
                return JSON.parse(facilities);
            } catch {
                return [];
            }
        }
        return [];
    };

    const getStatusChip = (status) => {
        const statusConfig = {
            pending_sekre: { bg: '#FEF9E7', color: '#F39C12', label: 'Menunggu Sekretariat' },
            pending_bsp: { bg: '#FFF3E0', color: '#ED6C02', label: 'Menunggu BSP' },
            approved: { bg: '#E8F8F5', color: '#27AE60', label: 'Disetujui Final' },
            rejected_sekre: { bg: '#FDEDEC', color: '#E74C3C', label: 'Ditolak Sekretariat' },
            rejected_bsp: { bg: '#FDEDEC', color: '#E74C3C', label: 'Ditolak BSP' },
            cancelled: { bg: '#F2F4F4', color: '#7F8C8D', label: 'Dibatalkan' }
        };
        const config = statusConfig[status] || { bg: '#FEF9E7', color: '#F39C12', label: 'Menunggu Sekretariat' };
        return <Chip label={config.label} sx={{ bgcolor: config.bg, color: config.color, fontWeight: 600 }} size="small" />;
    };

    if (!isSekre && !isBSP) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
                <Alert severity="error" sx={{ borderRadius: 3 }}>Akses ditolak. Halaman ini hanya untuk Sekretariat dan BSP.</Alert>
            </Box>
        );
    }

    const BookingTable = ({ bookings }) => (
        <TableContainer component={Paper} sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            <Table>
                <TableHead sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Pemesan</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Ruangan</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Tanggal</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Waktu</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Status</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Aksi</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {bookings.map((booking) => (
                        <TableRow key={booking.id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                            <TableCell>
                                <Box>
                                    <Typography variant="body2" fontWeight={600} sx={{ color: '#1a1a2e' }}>{booking.user_full_name}</Typography>
                                    <Typography variant="caption" sx={{ color: '#888' }}>@{booking.username}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell sx={{ color: '#555' }}>{booking.room_name}</TableCell>
                            <TableCell sx={{ color: '#555' }}>
                                {booking.booking_date ? format(new Date(booking.booking_date), 'dd MMM yyyy', { locale: id }) : '-'}
                            </TableCell>
                            <TableCell sx={{ color: '#555' }}>
                                {booking.start_time?.substring(0, 5)} - {booking.end_time?.substring(0, 5)}
                            </TableCell>
                            <TableCell>{getStatusChip(booking.status)}</TableCell>
                            <TableCell>
                                <Tooltip title="Lihat Detail">
                                    <IconButton size="small" onClick={() => { setSelectedBooking(booking); setOpenDetail(true); }} sx={{ color: '#667eea' }}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    const RoomsTable = () => (
        <TableContainer component={Paper} sx={{ borderRadius: 1, overflow: 'hidden', boxShadow: '0 5px 20px rgba(0,0,0,0.05)' }}>
            <Table>
                <TableHead sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                    <TableRow>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Nama Ruangan</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Kapasitas</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Fasilitas</TableCell>
                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Aksi</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rooms.map((room) => (
                        <TableRow key={room.id} hover sx={{ '&:hover': { bgcolor: '#f8f9fa' } }}>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography fontWeight={600} sx={{ color: '#1a1a2e' }}>{room.name}</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Chip
                                    icon={<PeopleIcon />}
                                    label={`${room.capacity} orang`}
                                    size="small"
                                    sx={{ bgcolor: '#E8F8F5', color: '#27AE60' }}
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {getFacilitiesList(room.facilities).slice(0, 3).map((fac, idx) => (
                                        <Chip key={idx} label={fac} size="small" variant="outlined" sx={{ borderColor: '#e0e0e0', color: '#555' }} />
                                    ))}
                                    {getFacilitiesList(room.facilities).length > 3 && (
                                        <Chip label={`+${getFacilitiesList(room.facilities).length - 3}`} size="small" sx={{ bgcolor: '#f0f2f5' }} />
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                <Tooltip title="Lihat Detail">
                                    <IconButton size="small" onClick={() => handleOpenViewRoom(room)} sx={{ mr: 1, color: '#667eea' }}>
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                                {canEditRooms && (
                                    <>
                                        <Tooltip title="Edit Ruangan">
                                            <IconButton size="small" onClick={() => handleOpenEditRoom(room)} sx={{ mr: 1, color: '#F39C12' }}>
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Hapus Ruangan">
                                            <IconButton size="small" onClick={() => setDeleteConfirm(room)} sx={{ color: '#E74C3C' }}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </>
                                )}
                                {!canEditRooms && (
                                    <Tooltip title="Mode Baca Saja">
                                        <IconButton size="small" disabled>
                                            <LockIcon fontSize="small" sx={{ color: '#aaa' }} />
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );

    return (
        <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f5f7fa 0%, #e9ecef 100%)', py: 4 }}>
            <Container maxWidth="xl">
                <Box>
                    <Box sx={{ mb: 4 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/')}
                            sx={{
                                color: '#667eea',
                                textTransform: 'none',
                                fontWeight: 500,
                                '&:hover': { bgcolor: '#667eea10', transform: 'translateX(-4px)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            Kembali ke Beranda
                        </Button>
                    </Box>

                    {/* Header */}
                    <Box sx={{ mb: 5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                            <Avatar sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                width: 56,
                                height: 56,
                                boxShadow: '0 8px 20px rgba(102,126,234,0.3)'
                            }}>
                                {isSekre ? <SchoolIcon sx={{ fontSize: 32 }} /> : <AdminPanelSettingsIcon sx={{ fontSize: 32 }} />}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" fontWeight={800} sx={{ color: '#1a1a2e' }}>
                                    Dashboard {isSekre ? 'Sekretariat' : 'BSP'}
                                </Typography>
                                <Typography variant="body1" sx={{ color: '#666', mt: 0.5 }}>
                                    {isSekre
                                        ? 'Verifikasi izin organisasi/kegiatan (Tahap 1) dan kelola data ruangan'
                                        : 'Approval final penguncian jadwal ruangan (Tahap 2) dan monitoring data ruangan'}
                                </Typography>
                            </Box>
                            <Chip
                                label={isSekre ? 'Tahap 1 - Verifikasi Izin' : 'Tahap 2 - Approval Final'}
                                sx={{
                                    bgcolor: isSekre ? '#FEF9E7' : '#E8F8F5',
                                    color: isSekre ? '#F39C12' : '#27AE60',
                                    fontWeight: 600,
                                    height: 32,
                                    ml: 'auto'
                                }}
                            />
                        </Box>
                    </Box>

                    {/* Cards Statistik */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr', textAlign: 'center' }, gap: 3, mb: 4 }}>
                        <Card sx={{ borderRadius: 2, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="body2" sx={{ color: '#F39C12', fontWeight: 600 }}>MENUNGGU</Typography>
                                <Typography variant="h3" fontWeight={800}>{pendingBookings.length}</Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>{isSekre ? 'Verifikasi' : 'Approval'}</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 2, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="body2" sx={{ color: '#27AE60', fontWeight: 600 }}>TOTAL BOOKING</Typography>
                                <Typography variant="h3" fontWeight={800}>{allBookings.length}</Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>Seluruh booking</Typography>
                            </CardContent>
                        </Card>
                        <Card sx={{ borderRadius: 2, background: 'white', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                            <CardContent>
                                <Typography variant="body2" sx={{ color: '#667eea', fontWeight: 600 }}>TOTAL RUANGAN</Typography>
                                <Typography variant="h3" fontWeight={800}>{rooms.length}</Typography>
                                <Typography variant="caption" sx={{ color: '#888' }}>Ruangan tersedia</Typography>
                            </CardContent>
                        </Card>
                    </Box>

                    {/* Tabs */}
                    <Paper sx={{ borderRadius: 1, overflow: 'hidden', mb: 4 }}>
                        <Tabs
                            value={tabValue}
                            onChange={(e, v) => setTabValue(v)}
                            sx={{
                                bgcolor: '#fff',
                                borderBottom: '1px solid #eee',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '1rem', py: 2 },
                                '& .Mui-selected': { color: '#667eea' },
                                '& .MuiTabs-indicator': { backgroundColor: '#667eea', height: 3 }
                            }}
                        >
                            <Tab label={`Verifikasi Booking (${pendingBookings.length})`} />
                            <Tab label={`Kelola Ruangan (${rooms.length})`} />
                        </Tabs>

                        <Box sx={{ p: 3 }}>
                            {tabValue === 0 && (
                                pendingBookings.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 8 }}>
                                        <Typography variant="h6" sx={{ color: '#888' }}>Tidak ada booking yang perlu diproses</Typography>
                                        <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>Semua booking sudah diverifikasi</Typography>
                                    </Box>
                                ) : (
                                    <BookingTable bookings={pendingBookings} />
                                )
                            )}

                            {tabValue === 1 && (
                                <Box>
                                    {canEditRooms && (
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                                            <Button
                                                variant="contained"
                                                startIcon={<AddIcon />}
                                                onClick={handleOpenAddRoom}
                                                sx={{
                                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    borderRadius: 40,
                                                    px: 4,
                                                    py: 1,
                                                    textTransform: 'none',
                                                    fontWeight: 600,
                                                    '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)' }
                                                }}
                                            >
                                                Tambah Ruangan
                                            </Button>
                                        </Box>
                                    )}
                                    {rooms.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 8 }}>
                                            <Typography variant="h6" sx={{ color: '#888' }}>Belum ada data ruangan</Typography>
                                            <Typography variant="body2" sx={{ color: '#aaa', mt: 1 }}>Silakan tambah ruangan baru</Typography>
                                        </Box>
                                    ) : (
                                        <RoomsTable />
                                    )}
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            </Container>

            {/* Dialog Detail Booking */}
            <Dialog open={openDetail} onClose={() => setOpenDetail(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', mb: 2 }}>Detail Booking</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    {selectedBooking && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <MeetingRoomIcon sx={{ color: '#667eea' }} />
                                <Typography><strong>Ruangan:</strong> {selectedBooking.room_name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PersonIcon sx={{ color: '#667eea' }} />
                                <Typography><strong>Pemesan:</strong> {selectedBooking.user_full_name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <EventIcon sx={{ color: '#667eea' }} />
                                <Typography><strong>Tanggal:</strong> {selectedBooking.booking_date ? format(new Date(selectedBooking.booking_date), 'EEEE, dd MMMM yyyy', { locale: id }) : '-'}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <AccessTimeIcon sx={{ color: '#667eea' }} />
                                <Typography><strong>Waktu:</strong> {selectedBooking.start_time?.substring(0, 5)} - {selectedBooking.end_time?.substring(0, 5)} WIB</Typography>
                            </Box>
                            <Box>
                                <Typography><strong>Tujuan:</strong></Typography>
                                <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>{selectedBooking.purpose}</Typography>
                            </Box>
                            <Box>
                                <Typography><strong>Status:</strong></Typography>
                                <Box sx={{ mt: 1 }}>{getStatusChip(selectedBooking.status)}</Box>
                            </Box>
                            {selectedBooking.rejected_by_sekre_reason && (
                                <Alert severity="error" sx={{ borderRadius: 2 }}>Alasan: {selectedBooking.rejected_by_sekre_reason}</Alert>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 0 }}>
                    <Button onClick={() => setOpenDetail(false)}>Tutup</Button>
                    {(selectedBooking?.status === 'pending' || selectedBooking?.status === 'pending_sekre' || selectedBooking?.status === 'pending_bsp') && (
                        <>
                            <Button variant="contained" color="success" onClick={() => handleApprove(selectedBooking.id)} sx={{ borderRadius: 40 }}>
                                {isSekre ? 'Setujui & Lanjutkan' : 'Setujui Final'}
                            </Button>
                            <Button variant="contained" color="error" onClick={() => setOpenReject(true)} sx={{ borderRadius: 40 }}>
                                Tolak
                            </Button>
                        </>
                    )}
                </DialogActions>
            </Dialog>

            {/* Dialog Tolak Booking */}
            <Dialog open={openReject} onClose={() => setOpenReject(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)', color: 'white' }}>Tolak Booking</DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField
                        label="Alasan Penolakan"
                        multiline rows={3} fullWidth
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Masukkan alasan penolakan..."
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenReject(false)}>Batal</Button>
                    <Button onClick={handleReject} variant="contained" color="error">Tolak Booking</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog View Room Detail */}
            <Dialog open={openViewDialog} onClose={() => setOpenViewDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', mb: 3 }}>Detail Ruangan</DialogTitle>
                <DialogContent sx={{ pt: 4, pb: 3, px: 3 }}>
                    {viewingRoom && (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {viewingRoom.image_url && (
                                <Box sx={{ mb: 2 }}>
                                    <Box
                                        component="img"
                                        src={viewingRoom.image_url}
                                        sx={{ width: '100%', borderRadius: 3, maxHeight: 200, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/500x300?text=No+Image'; }}
                                    />
                                </Box>
                            )}
                            <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a2e' }}>{viewingRoom.name}</Typography>
                            <Chip label={`Kapasitas ${viewingRoom.capacity} orang`} sx={{ bgcolor: '#E8F8F5', color: '#27AE60', width: 'fit-content', fontWeight: 600 }} />
                            <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#555', mt: 1 }}>Fasilitas:</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
                                {getFacilitiesList(viewingRoom.facilities).map((fac, idx) => (
                                    <Chip key={idx} label={fac} variant="outlined" sx={{ borderRadius: 2, '&:hover': { bgcolor: '#667eea10' } }} />
                                ))}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpenViewDialog(false)} sx={{ borderRadius: 40, px: 4, py: 1, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', fontWeight: 600, textTransform: 'none', '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)' } }}>Tutup</Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Add/Edit Room */}
            <Dialog open={openRoomDialog} onClose={() => setOpenRoomDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 1 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    {editingRoom ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3 }}>
                    <TextField fullWidth label="Nama Ruangan" margin="normal" value={roomFormData.name}
                        onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                        error={!!roomFormErrors.name} helperText={roomFormErrors.name} required />

                    <TextField fullWidth label="Kapasitas (orang)" type="number" margin="normal" value={roomFormData.capacity}
                        onChange={(e) => setRoomFormData({ ...roomFormData, capacity: e.target.value })}
                        error={!!roomFormErrors.capacity} helperText={roomFormErrors.capacity} required
                        InputProps={{ endAdornment: <InputAdornment position="end">orang</InputAdornment> }} />

                    <TextField fullWidth label="Fasilitas (pisahkan dengan koma)" margin="normal" value={roomFormData.facilities}
                        onChange={(e) => setRoomFormData({ ...roomFormData, facilities: e.target.value })}
                        helperText="Contoh: Proyektor, AC, Whiteboard, WiFi" placeholder="Proyektor, AC, Whiteboard, WiFi" />

                    <Box sx={{ mt: 2, mb: 1 }}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#555' }}>Gambar Ruangan</Typography>
                        {(imagePreview || roomFormData.image_url) && (
                            <Box sx={{ mb: 2 }}>
                                <img src={imagePreview || roomFormData.image_url} alt="Preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid #e0e0e0' }} />
                            </Box>
                        )}
                        <Button variant="outlined" component="label" startIcon={<AddIcon />} sx={{ borderRadius: 40, textTransform: 'none', borderColor: '#667eea', color: '#667eea', '&:hover': { borderColor: '#5a67d8', bgcolor: '#667eea10' } }}>
                            Pilih Gambar
                            <input type="file" hidden accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" onChange={handleImageChange} />
                        </Button>
                        <Typography variant="caption" sx={{ color: '#aaa', display: 'block', mt: 1 }}>Format: JPG, PNG, GIF, WEBP (Max 5MB)</Typography>
                        {(imagePreview || roomFormData.image_url) && (
                            <Button size="small" onClick={() => { setImageFile(null); setImagePreview(''); setRoomFormData({ ...roomFormData, image_url: '' }); }} sx={{ mt: 1, color: '#E74C3C', textTransform: 'none' }}>
                                Hapus Gambar
                            </Button>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button onClick={() => setOpenRoomDialog(false)} sx={{ borderRadius: 40, px: 3 }}>Batal</Button>
                    <Button onClick={handleSaveRoom} variant="contained" sx={{ borderRadius: 40, px: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', '&:hover': { background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)' } }}>
                        {editingRoom ? 'Update' : 'Simpan'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog Hapus Confirmation */}
            <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ background: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)', color: 'white' }}>Hapus Ruangan?</DialogTitle>
                <DialogContent sx={{ pt: 3, mt: 3 }}>
                    <Typography>Yakin ingin menghapus <strong>{deleteConfirm?.name}</strong>?</Typography>
                    <Typography variant="caption" sx={{ color: '#E74C3C', mt: 1, display: 'block' }}>⚠️ Tindakan ini tidak dapat dibatalkan.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirm(null)}>Batal</Button>
                    <Button onClick={handleDeleteRoom} variant="contained" color="error">Hapus</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminDashboardPage;