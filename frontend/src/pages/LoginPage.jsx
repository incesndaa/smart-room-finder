import React, { useState } from 'react';
import { Container, Box, TextField, Button, Typography, Paper, Alert, Link, Fade, InputAdornment, IconButton } from '@mui/material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import SchoolIcon from '@mui/icons-material/School';

const LoginPage = () => {
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const result = await login(formData.username, formData.password);
        if (result.success) navigate('/');
        else setError(result.message || 'Login gagal');
        setLoading(false);
    };

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                position: 'relative',
                overflow: 'hidden',
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
            
            {/* Decorative elements */}
            <Box sx={{
                position: 'absolute',
                top: -50,
                right: -50,
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: -80,
                left: -80,
                width: 250,
                height: 250,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
            }} />

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
                                <SchoolIcon sx={{ fontSize: 48, color: '#667eea' }} />
                            </Box>
                            <Typography variant="h4" fontWeight={800} sx={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                backgroundClip: 'text',
                                WebkitBackgroundClip: 'text',
                                color: 'transparent',
                                textAlign:'center'
                            }}>
                                Booking Ruangan Kampus
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#888', mt: 1, textAlign:'center' }}>
                                Silakan login untuk melanjutkan
                            </Typography>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

                        <form onSubmit={handleSubmit}>
                            <TextField
                                fullWidth
                                label="Username atau Email"
                                margin="normal"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                required
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { borderRadius: 3 },
                                    '& .MuiOutlinedInput-root:hover': { '& > fieldset': { borderColor: '#667eea' } },
                                    '& .MuiOutlinedInput-root.Mui-focused': { '& > fieldset': { borderColor: '#667eea' } }
                                }}
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
                                sx={{ 
                                    '& .MuiOutlinedInput-root': { borderRadius: 3 },
                                    '& .MuiOutlinedInput-root:hover': { '& > fieldset': { borderColor: '#667eea' } },
                                    '& .MuiOutlinedInput-root.Mui-focused': { '& > fieldset': { borderColor: '#667eea' } }
                                }}
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
                                        boxShadow: '0 12px 25px rgba(102,126,234,0.5)',
                                    }
                                }}
                            >
                                {loading ? 'Memproses...' : 'Login'}
                            </Button>
                        </form>

                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#888' }}>
                                Belum punya akun?{' '}
                                <Link 
                                    component={RouterLink} 
                                    to="/register" 
                                    underline="hover"
                                    sx={{ color: '#667eea', fontWeight: 600 }}
                                >
                                    Daftar di sini
                                </Link>
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default LoginPage;