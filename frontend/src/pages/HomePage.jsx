// import React, { useState, useEffect } from 'react';
// import { Container, Grid, Typography, Box, Alert, Snackbar, Fade, Zoom, Grow } from '@mui/material';
// import RoomCard from '../components/RoomCard';
// import BookingForm from '../components/BookingForm';
// import RoomFilter from '../components/RoomFilter';
// import LoadingSpinner from '../components/LoadingSpinner';
// import api from '../services/api';
// import { useAuth } from '../context/AuthContext';
// import SearchIcon from '@mui/icons-material/Search';
// import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
// import PeopleIcon from '@mui/icons-material/People';
// import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
// import SchoolIcon from '@mui/icons-material/School';

// const HomePage = () => {
//     const { user } = useAuth();
//     const [rooms, setRooms] = useState([]);
//     const [filteredRooms, setFilteredRooms] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [selectedRoom, setSelectedRoom] = useState(null);
//     const [openForm, setOpenForm] = useState(false);
//     const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
//     const [filters, setFilters] = useState({ minCapacity: 0, maxCapacity: 100, facilities: [] });

//     useEffect(() => {
//         if (!user) return;
//         loadRooms();
//     }, [user]);

//     useEffect(() => {
//         applyFilter();
//     }, [rooms, filters]);

//     const loadRooms = async () => {
//         try {
//             const response = await api.get('/rooms');
//             if (response.data.success) setRooms(response.data.data);
//         } catch (error) {
//             setSnackbar({ open: true, message: 'Gagal memuat data ruangan', severity: 'error' });
//         } finally {
//             setLoading(false);
//         }
//     };

//     const applyFilter = () => {
//         let filtered = [...rooms];
//         filtered = filtered.filter(room =>
//             room.capacity >= filters.minCapacity && room.capacity <= filters.maxCapacity
//         );
//         if (filters.facilities.length > 0) {
//             filtered = filtered.filter(room => {
//                 let roomFacilities = [];
//                 if (typeof room.facilities === 'string') {
//                     try {
//                         roomFacilities = JSON.parse(room.facilities || '[]');
//                     } catch {
//                         roomFacilities = [];
//                     }
//                 } else if (Array.isArray(room.facilities)) {
//                     roomFacilities = room.facilities;
//                 }
//                 return filters.facilities.every(f => roomFacilities.includes(f));
//             });
//         }
//         setFilteredRooms(filtered);
//     };

//     const handleFilter = (newFilters) => setFilters(newFilters);
//     const handleClearFilter = () => setFilters({ minCapacity: 0, maxCapacity: 100, facilities: [] });
//     const handleBookRoom = (room) => {
//         setSelectedRoom(room);
//         setOpenForm(true);
//     };

//     const handleBookingSubmit = async (bookingData) => {
//         try {
//             const availability = await api.get('/bookings/check', {
//                 params: {
//                     roomId: bookingData.room_id,
//                     date: bookingData.booking_date,
//                     startTime: bookingData.start_time,
//                     endTime: bookingData.end_time
//                 }
//             });
//             if (!availability.data.available) {
//                 setSnackbar({ open: true, message: 'Waktu yang dipilih sudah dibooking!', severity: 'error' });
//                 return;
//             }
//             const response = await api.post('/bookings', bookingData);
//             if (response.data.success) {
//                 setSnackbar({ open: true, message: `Booking ${selectedRoom.name} berhasil diajukan!`, severity: 'success' });
//                 setOpenForm(false);
//             }
//         } catch (error) {
//             setSnackbar({ open: true, message: error.response?.data?.message || 'Gagal booking', severity: 'error' });
//         }
//     };

//     if (loading) return <LoadingSpinner />;
//     if (!user) {
//         return (
//             <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
//                 <Alert severity="warning" sx={{ borderRadius: 3 }}>Silakan login terlebih dahulu</Alert>
//             </Box>
//         );
//     }

//     return (
//         <Box sx={{ minHeight: '100vh', background: '#f0f2f5' }}>
//             {/* Hero Section - Fresh & Bright */}
//             <Box sx={{
//                 position: 'relative',
//                 background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
//                 color: 'white',
//                 py: 12,
//                 mb: 6,
//                 borderRadius: '0 0 50px 50px',
//                 overflow: 'hidden',
//                 textAlign: 'center',
//             }}>
//                 {/* Decorative elements */}
//                 <Box sx={{
//                     position: 'absolute',
//                     top: -50,
//                     right: -50,
//                     width: 300,
//                     height: 300,
//                     borderRadius: '50%',
//                     background: 'rgba(255,255,255,0.1)',
//                 }} />
//                 <Box sx={{
//                     position: 'absolute',
//                     bottom: -80,
//                     left: -80,
//                     width: 250,
//                     height: 250,
//                     borderRadius: '50%',
//                     background: 'rgba(255,255,255,0.08)',
//                 }} />

//                 <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
//                     <Fade in timeout={1000}>
//                         <Box textAlign="center">
//                             <Zoom in timeout={800}>
//                                 <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
//                                     <Typography
//                                         variant="overline"
//                                         sx={{
//                                             letterSpacing: 3,
//                                             background: 'rgba(255,255,255,0.2)',
//                                             backdropFilter: 'blur(10px)',
//                                             padding: '6px 20px',
//                                             borderRadius: '40px',
//                                             display: 'inline-block',
//                                             fontSize: '0.75rem',
//                                             fontWeight: 600
//                                         }}
//                                     >
//                                         SMART ROOM FINDER
//                                     </Typography>
//                                 </Box>
//                             </Zoom>

//                             <Typography
//                                 variant="h1"
//                                 fontWeight={800}
//                                 gutterBottom
//                                 sx={{
//                                     fontSize: { xs: '2.2rem', md: '3.5rem' },
//                                     letterSpacing: '-0.02em',
//                                     textShadow: '0 4px 20px rgba(0,0,0,0.15)',
//                                     textAlign: 'center'
//                                 }}
//                             >
//                                 Booking Ruangan Kampus
//                             </Typography>

//                             <Typography
//                                 variant="h6"
//                                 sx={{
//                                     opacity: 0.95,
//                                     maxWidth: 650,
//                                     mx: 'auto',
//                                     fontWeight: 400,
//                                     mb: 5
//                                 }}
//                             >
//                                 Halo, <strong>{user?.full_name || user?.username}!</strong> Yuk cari ruangan yang cocok buat kegiatanmu.
//                             </Typography>

//                             {/* Stats Cards */}
//                             <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mt: 4 }}>
//                                 <Box sx={{
//                                     textAlign: 'center',
//                                     px: 4,
//                                     py: 2,
//                                     bgcolor: 'rgba(255,255,255,0.15)',
//                                     borderRadius: 4,
//                                     backdropFilter: 'blur(10px)',
//                                     transition: 'transform 0.3s',
//                                     '&:hover': { transform: 'translateY(-5px)' }
//                                 }}>
//                                     <MeetingRoomIcon sx={{ fontSize: 32 }} />
//                                     <Typography variant="h4" fontWeight={700}>{rooms.length}</Typography>
//                                     <Typography variant="caption">Total Ruangan</Typography>
//                                 </Box>
//                                 <Box sx={{
//                                     textAlign: 'center',
//                                     px: 4,
//                                     py: 2,
//                                     bgcolor: 'rgba(255,255,255,0.15)',
//                                     borderRadius: 4,
//                                     backdropFilter: 'blur(10px)',
//                                     transition: 'transform 0.3s',
//                                     '&:hover': { transform: 'translateY(-5px)' }
//                                 }}>
//                                     <SchoolIcon sx={{ fontSize: 32 }} />
//                                     <Typography variant="h4" fontWeight={700}>100+</Typography>
//                                     <Typography variant="caption">Booking Bulanan</Typography>
//                                 </Box>
//                                 <Box sx={{
//                                     textAlign: 'center',
//                                     px: 4,
//                                     py: 2,
//                                     bgcolor: 'rgba(255,255,255,0.15)',
//                                     borderRadius: 4,
//                                     backdropFilter: 'blur(10px)',
//                                     transition: 'transform 0.3s',
//                                     '&:hover': { transform: 'translateY(-5px)' }
//                                 }}>
//                                     <CalendarTodayIcon sx={{ fontSize: 32 }} />
//                                     <Typography variant="h4" fontWeight={700}>24/7</Typography>
//                                     <Typography variant="caption">Akses Booking</Typography>
//                                 </Box>
//                             </Box>
//                         </Box>
//                     </Fade>
//                 </Container>
//             </Box>

//             {/* Filter Section */}
//             <Container maxWidth="lg" sx={{ mb: 5 }}>
//                 <Grow in timeout={600}>
//                     <Box>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
//                             <SearchIcon sx={{ color: '#667eea', fontSize: 28 }} />
//                             <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a2e' }}>
//                                 Cari Ruangan
//                             </Typography>
//                             <Box sx={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #667eea, #e0e0e0)' }} />
//                         </Box>
//                         <RoomFilter
//                             onFilter={handleFilter}
//                             onClear={handleClearFilter}
//                             filters={filters}
//                         />
//                     </Box>
//                 </Grow>
//             </Container>

//             {/* Rooms Grid */}
//             <Container maxWidth="lg" sx={{ pb: 8 }}>
//                 {filteredRooms.length === 0 ? (
//                     <Box textAlign="center" py={10}>
//                         <Typography variant="h5" sx={{ color: '#666', mb: 2 }}>Tidak ada ruangan yang sesuai</Typography>
//                         <Typography variant="body2" sx={{ color: '#999' }}>Coba ubah filter atau reset filter</Typography>
//                     </Box>
//                 ) : (
//                     <>
//                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, textAlign: 'center' }}>
//                             <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a2e', width: '100%', textAlign: 'center' }}>
//                                 Daftar Ruangan
//                                 <Box component="span" sx={{ ml: 2, color: '#667eea', fontSize: '0.9rem', fontWeight: 500 }}>
//                                     ({filteredRooms.length} ruangan)
//                                 </Box>
//                             </Typography>
//                         </Box>

//                         {/* Grid dengan flexbox yang konsisten */}
//                         <Box sx={{
//                             display: 'flex',
//                             flexWrap: 'wrap',
//                             justifyContent: 'center',  
//                             gap: 4
//                         }}>
//                             {filteredRooms.map((room, index) => (
//                                 <Box
//                                     key={room.id}
//                                     sx={{
//                                         width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 32px)' },
//                                         maxWidth: { xs: '100%', sm: '350px', md: '380px' },  
//                                         display: 'flex',
//                                     }}
//                                 >
//                                     <Grow in timeout={400 + index * 100}>
//                                         <Box sx={{ width: '100%', height: '100%' }}>
//                                             <RoomCard room={room} onBook={handleBookRoom} />
//                                         </Box>
//                                     </Grow>
//                                 </Box>
//                             ))}
//                         </Box>
//                     </>
//                 )}
//             </Container>

//             {/* Modal Booking */}
//             {selectedRoom && (
//                 <BookingForm
//                     open={openForm}
//                     onClose={() => setOpenForm(false)}
//                     room={selectedRoom}
//                     onSubmit={handleBookingSubmit}
//                 />
//             )}

//             {/* Snackbar */}
//             <Snackbar
//                 open={snackbar.open}
//                 autoHideDuration={4000}
//                 onClose={() => setSnackbar({ ...snackbar, open: false })}
//                 anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
//             >
//                 <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3 }}>
//                     {snackbar.message}
//                 </Alert>
//             </Snackbar>
//         </Box>
//     );
// };

// export default HomePage;

import React, { useState, useEffect } from 'react';
import { Container, Grid, Typography, Box, Alert, Snackbar, Fade, Zoom, Grow } from '@mui/material';
import RoomCard from '../components/RoomCard';
import BookingForm from '../components/BookingForm';
import RoomFilter from '../components/RoomFilter';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../services/supabaseClient'; // GANTI KE SUPABASE
import { useAuth } from '../context/AuthContext';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import SchoolIcon from '@mui/icons-material/School';

const HomePage = () => {
    const { user } = useAuth();
    const [rooms, setRooms] = useState([]);
    const [filteredRooms, setFilteredRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [openForm, setOpenForm] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [filters, setFilters] = useState({ minCapacity: 0, maxCapacity: 100, facilities: [] });

    useEffect(() => {
        if (!user) return;
        loadRooms();
    }, [user]);

    useEffect(() => {
        applyFilter();
    }, [rooms, filters]);

    // 1. AMBIL DATA RUANGAN DARI SUPABASE
    const loadRooms = async () => {
        try {
            const { data, error } = await supabase
                .from('rooms')
                .select('*');

            if (error) throw error;
            setRooms(data || []);
        } catch (error) {
            console.error('Gagal load rooms:', error);
            setSnackbar({ open: true, message: 'Gagal memuat data ruangan', severity: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const applyFilter = () => {
        let filtered = [...rooms];
        filtered = filtered.filter(room =>
            room.capacity >= filters.minCapacity && room.capacity <= filters.maxCapacity
        );
        if (filters.facilities.length > 0) {
            filtered = filtered.filter(room => {
                let roomFacilities = [];
                if (typeof room.facilities === 'string') {
                    try {
                        roomFacilities = JSON.parse(room.facilities || '[]');
                    } catch {
                        roomFacilities = [];
                    }
                } else if (Array.isArray(room.facilities)) {
                    roomFacilities = room.facilities;
                }
                return filters.facilities.every(f => roomFacilities.includes(f));
            });
        }
        setFilteredRooms(filtered);
    };

    const handleFilter = (newFilters) => setFilters(newFilters);
    const handleClearFilter = () => setFilters({ minCapacity: 0, maxCapacity: 100, facilities: [] });
    const handleBookRoom = (room) => {
        setSelectedRoom(room);
        setOpenForm(true);
    };

    // 2. SUBMIT BOOKING LANGSUNG KE SUPABASE
    // 2. SUBMIT BOOKING LANGSUNG KE SUPABASE
    const handleBookingSubmit = async (bookingData) => {
        try {
            // Cek tabrakan jadwal booking di Supabase
            const { data: conflictingBookings, error: checkError } = await supabase
                .from('bookings')
                .select('*')
                .eq('room_id', bookingData.room_id)
                .eq('booking_date', bookingData.booking_date)
                .lt('start_time', bookingData.end_time)
                .gt('end_time', bookingData.start_time);

            if (checkError) throw checkError;

            if (conflictingBookings && conflictingBookings.length > 0) {
                setSnackbar({ open: true, message: 'Waktu yang dipilih sudah dibooking!', severity: 'error' });
                return;
            }

            // Simpan data booking ke tabel bookings
           const { error: insertError } = await supabase
                .from('bookings')
                .insert([
                    {
                        user_id: user.id, 
                        room_id: bookingData.room_id,
                        booking_date: bookingData.booking_date,
                        start_time: bookingData.start_time,
                        end_time: bookingData.end_time,
                        purpose: bookingData.purpose || 'Kegiatan Kampus',
                        status: 'pending_sekre',
                        // Tambahkan baris di bawah ini untuk mengisi kolom attendee_name yang diminta database
                        attendee_name: user.user_metadata?.full_name || user.email 
                    }
                ]);

            if (insertError) throw insertError;

            setSnackbar({ open: true, message: `Booking ${selectedRoom.name} berhasil diajukan!`, severity: 'success' });
            setOpenForm(false);
            
        } catch (error) {
            console.error('Gagal booking:', error);
            setSnackbar({ open: true, message: error.message || 'Gagal booking', severity: 'error' });
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!user) {
        return (
            <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Alert severity="warning" sx={{ borderRadius: 3 }}>Silakan login terlebih dahulu</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Hero Section */}
            <Box sx={{
                position: 'relative',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                py: 12,
                mb: 6,
                borderRadius: '0 0 50px 50px',
                overflow: 'hidden',
                textAlign: 'center',
            }}>
                <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
                    <Fade in timeout={1000}>
                        <Box textAlign="center">
                            <Zoom in timeout={800}>
                                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                                    <Typography
                                        variant="overline"
                                        sx={{
                                            letterSpacing: 3,
                                            background: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            padding: '6px 20px',
                                            borderRadius: '40px',
                                            display: 'inline-block',
                                            fontSize: '0.75rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        SMART ROOM FINDER
                                    </Typography>
                                </Box>
                            </Zoom>

                            <Typography
                                variant="h1"
                                fontWeight={800}
                                gutterBottom
                                sx={{
                                    fontSize: { xs: '2.2rem', md: '3.5rem' },
                                    letterSpacing: '-0.02em',
                                    textShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    textAlign: 'center'
                                }}
                            >
                                Booking Ruangan Kampus
                            </Typography>

                            <Typography
                                variant="h6"
                                sx={{ opacity: 0.95, maxWidth: 650, mx: 'auto', fontWeight: 400, mb: 5 }}
                            >
                                Halo, <strong>{user?.full_name || user?.username}!</strong> Yuk cari ruangan yang cocok buat kegiatanmu.
                            </Typography>

                            {/* Stats Cards */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap', mt: 4 }}>
                                <Box sx={{ textAlign: 'center', px: 4, py: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 4, backdropFilter: 'blur(10px)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                                    <MeetingRoomIcon sx={{ fontSize: 32 }} />
                                    <Typography variant="h4" fontWeight={700}>{rooms.length}</Typography>
                                    <Typography variant="caption">Total Ruangan</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', px: 4, py: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 4, backdropFilter: 'blur(10px)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                                    <SchoolIcon sx={{ fontSize: 32 }} />
                                    <Typography variant="h4" fontWeight={700}>100+</Typography>
                                    <Typography variant="caption">Booking Bulanan</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'center', px: 4, py: 2, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 4, backdropFilter: 'blur(10px)', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-5px)' } }}>
                                    <CalendarTodayIcon sx={{ fontSize: 32 }} />
                                    <Typography variant="h4" fontWeight={700}>24/7</Typography>
                                    <Typography variant="caption">Akses Booking</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Fade>
                </Container>
            </Box>

            {/* Filter Section */}
            <Container maxWidth="lg" sx={{ mb: 5 }}>
                <Grow in timeout={600}>
                    <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                            <SearchIcon sx={{ color: '#667eea', fontSize: 28 }} />
                            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                                Cari Ruangan
                            </Typography>
                            <Box sx={{ flex: 1, height: 2, background: 'linear-gradient(90deg, #667eea, #e0e0e0)' }} />
                        </Box>
                        <RoomFilter
                            onFilter={handleFilter}
                            onClear={handleClearFilter}
                            filters={filters}
                        />
                    </Box>
                </Grow>
            </Container>

            {/* Rooms Grid */}
            <Container maxWidth="lg" sx={{ pb: 8 }}>
                {filteredRooms.length === 0 ? (
                    <Box textAlign="center" py={10}>
                        <Typography variant="h5" sx={{ color: '#666', mb: 2 }}>Tidak ada ruangan yang sesuai</Typography>
                        <Typography variant="body2" sx={{ color: '#999' }}>Coba ubah filter atau reset filter</Typography>
                    </Box>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, textAlign: 'center' }}>
                            <Typography variant="h5" fontWeight={700} sx={{ color: '#1a1a2e', width: '100%', textAlign: 'center' }}>
                                Daftar Ruangan
                                <Box component="span" sx={{ ml: 2, color: '#667eea', fontSize: '0.9rem', fontWeight: 500 }}>
                                    ({filteredRooms.length} ruangan)
                                </Box>
                            </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
                            {filteredRooms.map((room, index) => (
                                <Box
                                    key={room.id}
                                    sx={{ width: { xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 32px)' }, maxWidth: { xs: '100%', sm: '350px', md: '380px' }, display: 'flex' }}
                                >
                                    <Grow in timeout={400 + index * 100}>
                                        <Box sx={{ width: '100%', height: '100%' }}>
                                            <RoomCard room={room} onBook={handleBookRoom} />
                                        </Box>
                                    </Grow>
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </Container>

            {/* Modal Booking */}
            {selectedRoom && (
                <BookingForm
                    open={openForm}
                    onClose={() => setOpenForm(false)}
                    room={selectedRoom}
                    onSubmit={handleBookingSubmit}
                />
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default HomePage;