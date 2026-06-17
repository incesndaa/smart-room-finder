import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Paper, Alert, Link, Fade, InputAdornment, IconButton } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; 
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        username: '', email: '', password: '', confirmPassword: '', full_name: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            setError('Password tidak cocok');
            return;
        }
        if (formData.password.length < 6) {
            setError('Password minimal 6 karakter');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');

try {
            // 1. DAFTARKAN KE SUPABASE AUTH (Sistem Keamanan)
            const { data: authData, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.full_name,
                        username: formData.username,
                    }
                }
            });

            if (signUpError) throw signUpError;

            // 2. MASUKKAN DATA KE TABEL USERS (Tanpa memasukkan kolom id manual)
            if (authData?.user) {
                const { error: insertError } = await supabase
                    .from('users')
                    .insert([
                        {
                            // Kita hapus baris "id: authData.user.id" dari sini!
                            username: formData.username,
                            email: formData.email,
                            password: formData.password, // Teks biasa untuk testing login
                            full_name: formData.full_name,
                            role: 'user' 
                        }
                    ]);

                if (insertError) throw insertError;
            }

            setSuccess('Registrasi berhasil! Data sudah masuk ke database. Menuju halaman login...');
            setTimeout(() => navigate('/login'), 2000);

        } catch (err) {
            console.error('Error saat registrasi:', err);
            setError(err.message || 'Registrasi gagal, silakan coba lagi');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
                py: 4,
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)',
                }
            }}>
            
            <Box sx={{ position: 'absolute', top: -50, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <Box sx={{ position: 'absolute', bottom: -80, left: -80, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />

            <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 2 }}>
                <Fade in timeout={800}>
                    <Paper elevation={0} sx={{ 
                        p: 4, 
                        borderRadius: 5, 
                        backdropFilter: 'blur(10px)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 25px 50px rgba(0,0,0,0.2)'
                    }}>
                        <Box textAlign="center" mb={3}>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                                <PersonAddIcon sx={{ fontSize: 48, color: '#667eea' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={800} sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent'
                            }}>
                                Daftar Akun
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888', mt: 1 }}>
                                Untuk Dosen, Mahasiswa, dan Tenaga Kependidikan
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Nama Lengkap"
                                margin="normal"
                                value={formData.full_name}
                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <TextField
                                fullWidth
                                label="Username"
                                margin="normal"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                margin="normal"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                margin="normal"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                                {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <TextField
                                fullWidth
                                label="Konfirmasi Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                margin="normal"
                                value={formData.confirmPassword}
                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                                {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <Button
                                type="submit"
                                fullWidth
                                variant="contained"
                                size="large"
                                disabled={loading}
                                sx={{
                                    mt: 3,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    borderRadius: 40,
                                    py: 1.5,
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    textTransform: 'none',
                                    boxShadow: '0 8px 20px rgba(102,126,234,0.4)',
                                    '&:hover': {
                                        background: 'linear-gradient(135deg, #5a67d8 0%, #6b46a0 100%)',
                                        transform: 'translateY(-2px)',
                                    }
                                }}
                            >
                                {loading ? 'Memproses...' : 'Daftar'}
                            </Button>
                        </form>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#888' }}>
                                Sudah punya akun?{' '}
                                <Link component={RouterLink} to="/login" underline="hover" sx={{ color: '#667eea', fontWeight: 600 }}>
                                    Login di sini
                                </Link>
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default RegisterPage;