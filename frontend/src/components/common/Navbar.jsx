import React, { useState, useEffect } from 'react';
import {
    AppBar, Toolbar, Typography, Button, Box, Avatar,
    Menu, MenuItem, IconButton, Container, Chip, Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import Badge from '@mui/material/Badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import api from '../../services/api';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [notificationAnchor, setNotificationAnchor] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleNotificationClose = () => setNotificationAnchor(null);

    // Load notifikasi
    useEffect(() => {
        if (user) {
            loadNotifications();
            // Polling setiap 30 detik
            const interval = setInterval(loadNotifications, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            if (response.data.success) {
                setNotifications(response.data.data);
                setUnreadCount(response.data.unreadCount);
            }
        } catch (error) {
            console.error('Gagal load notifikasi:', error);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            loadNotifications();
        } catch (error) {
            console.error('Gagal mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all');
            loadNotifications();
        } catch (error) {
            console.error('Gagal mark all as read:', error);
        }
    };

    const handleNotificationClick = (event) => {
        setNotificationAnchor(event.currentTarget);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleClose();
    };

    return (
        <AppBar
            position="sticky"
            elevation={0}
            sx={{
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(102, 126, 234, 0.15)',
                boxShadow: '0 2px 20px rgba(0,0,0,0.03)'
            }}
        >
            <Container maxWidth="xl">
                <Toolbar sx={{ justifyContent: 'space-between', py: 1.5 }}>
                    {/* Logo - Kiri */}
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            gap: 1,
                            '&:hover': { opacity: 0.9 }
                        }}
                        onClick={() => navigate('/')}
                    >
                        <SchoolIcon sx={{
                            fontSize: 32,
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            borderRadius: '12px',
                            padding: '4px',
                            color: 'white'
                        }} />
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 800,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                letterSpacing: '-0.5px'
                            }}
                        >
                            SRF
                        </Typography>
                    </Box>

                    {/* Menu Tengah - Desktop */}
                    {user && (
                        <Box sx={{
                            display: { xs: 'none', md: 'flex' },
                            alignItems: 'center',
                            gap: 1,
                            bgcolor: '#f8f9fa',
                            borderRadius: 50,
                            px: 1,
                            py: 0.5
                        }}>
                            <Button
                                startIcon={<HomeOutlinedIcon />}
                                onClick={() => navigate('/')}
                                sx={{
                                    color: '#555',
                                    borderRadius: 40,
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                                        color: '#667eea'
                                    }
                                }}
                            >
                                Home
                            </Button>
                            <Button
                                startIcon={<BookmarkBorderIcon />}
                                onClick={() => navigate('/my-bookings')}
                                sx={{
                                    color: '#555',
                                    borderRadius: 40,
                                    px: 3,
                                    textTransform: 'none',
                                    fontWeight: 500,
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
                                        color: '#667eea'
                                    }
                                }}
                            >
                                Booking Saya
                            </Button>
                        </Box>
                    )}

                    {/* Profile Section - Kanan */}
                    {user ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {/* Icon Notifikasi */}
                            <IconButton onClick={handleNotificationClick} sx={{ color: '#667eea' }}>
                                <Badge badgeContent={unreadCount} color="error">
                                    <NotificationsNoneIcon />
                                </Badge>
                            </IconButton>

                            {/* Menu Notifikasi */}
                            <Menu
                                anchorEl={notificationAnchor}
                                open={Boolean(notificationAnchor)}
                                onClose={handleNotificationClose}
                                PaperProps={{
                                    sx: { width: 360, maxHeight: 450, borderRadius: 3, mt: 1.5 }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="subtitle1" fontWeight={700}>Notifikasi</Typography>
                                    {unreadCount > 0 && (
                                        <Button size="small" onClick={handleMarkAllAsRead} sx={{ color: '#667eea', textTransform: 'none' }}>
                                            Baca Semua
                                        </Button>
                                    )}
                                </Box>

                                {notifications.length === 0 ? (
                                    <Box sx={{ p: 4, textAlign: 'center' }}>
                                        <Typography variant="body2" color="text.secondary">Belum ada notifikasi</Typography>
                                    </Box>
                                ) : (
                                    notifications.map((notif) => (
                                        <MenuItem
                                            key={notif.id}
                                            onClick={() => handleMarkAsRead(notif.id)}
                                            sx={{
                                                flexDirection: 'column',
                                                alignItems: 'flex-start',
                                                py: 1.5,
                                                px: 2,
                                                bgcolor: notif.is_read ? 'transparent' : '#FEF9E7',
                                                borderBottom: '1px solid #f0f0f0',
                                                '&:hover': { bgcolor: '#f5f5f5' }
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ color: '#1a1a2e', fontWeight: notif.is_read ? 500 : 700 }}>
                                                {notif.title}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#555', mt: 0.5 }}>
                                                {notif.message}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#aaa', mt: 0.5 }}>
                                                {format(new Date(notif.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                                            </Typography>
                                        </MenuItem>
                                    ))
                                )}

                               
                            </Menu>

                            {/* Avatar Profile */}
                            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                                <Avatar sx={{
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    width: 42,
                                    height: 42,
                                    fontWeight: 600,
                                    boxShadow: '0 4px 10px rgba(102,126,234,0.3)'
                                }}>
                                    {user.full_name?.charAt(0) || user.username?.charAt(0)}
                                </Avatar>
                            </IconButton>

                            {/* Menu Profile */}
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl)}
                                onClose={handleClose}
                                PaperProps={{
                                    sx: {
                                        mt: 1.5,
                                        minWidth: 220,
                                        borderRadius: 3,
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        border: '1px solid rgba(102,126,234,0.1)'
                                    }
                                }}
                                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                            >
                                <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 2, px: 3 }}>
                                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#1a1a2e' }}>
                                        {user.full_name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#888', mt: 0.5 }}>
                                        {user.email}
                                    </Typography>
                                    <Chip
                                        label={user.role === 'sekre' ? 'Sekretariat' : user.role === 'bsp' ? 'BSP' : 'Mahasiswa'}
                                        size="small"
                                        sx={{ mt: 1.5, bgcolor: user.role === 'sekre' ? '#FEF9E7' : user.role === 'bsp' ? '#E8F8F5' : '#F0F2F5', color: user.role === 'sekre' ? '#F39C12' : user.role === 'bsp' ? '#27AE60' : '#667eea' }}
                                    />
                                </MenuItem>

                                <Divider />

                                {(user?.role === 'sekre' || user?.role === 'bsp') && (
                                    <MenuItem onClick={() => { navigate('/admin/dashboard'); handleClose(); }} sx={{ py: 1.5 }}>
                                        <DashboardIcon fontSize="small" sx={{ mr: 2, color: '#667eea' }} />
                                        Dashboard Admin
                                    </MenuItem>
                                )}

                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#E74C3C' }}>
                                    <LogoutOutlinedIcon fontSize="small" sx={{ mr: 2 }} />
                                    Logout
                                </MenuItem>
                            </Menu>
                        </Box>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                borderRadius: 40,
                                px: 4,
                                py: 1,
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.9rem',
                                boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
                                }
                            }}
                        >
                            Login
                        </Button>
                    )}
                </Toolbar>
            </Container>
        </AppBar>
    );
};

export default Navbar;