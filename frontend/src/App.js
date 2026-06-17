import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/common/Navbar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoadingSpinner from './components/common/LoadingSpinner';
import AdminDashboardPage from './pages/AdminDashboardPage';


const theme = createTheme({
    palette: {
        primary: {
            main: '#2D3E50',      // Biru tua elegan
            light: '#4A627A',
            dark: '#1A2A38',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#E8A87C',      // Coral hangat
            light: '#F0C4A8',
            dark: '#D4855A',
            contrastText: '#2D3E50',
        },
        error: {
            main: '#E74C3C',
            light: '#EC7063',
            dark: '#CB4335',
        },
        warning: {
            main: '#F39C12',
            light: '#F5B041',
            dark: '#D68910',
        },
        info: {
            main: '#3498DB',
            light: '#5DADE2',
            dark: '#2E86C1',
        },
        success: {
            main: '#27AE60',
            light: '#52BE80',
            dark: '#1E8449',
        },
        background: {
            default: '#F8F9FA',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#2C3E50',
            secondary: '#7F8C8D',
        },
    },
    typography: {
        fontFamily: "'Poppins', 'Inter', 'Roboto', sans-serif",
        h1: { fontWeight: 700, fontSize: '2.5rem' },
        h2: { fontWeight: 700, fontSize: '2rem' },
        h3: { fontWeight: 600, fontSize: '1.75rem' },
        h4: { fontWeight: 600, fontSize: '1.5rem' },
        h5: { fontWeight: 600, fontSize: '1.25rem' },
        h6: { fontWeight: 600, fontSize: '1rem' },
        button: { textTransform: 'none', fontWeight: 600 },
    },
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 30,
                    padding: '8px 24px',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #2D3E50 0%, #4A627A 100%)',
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #E8A87C 0%, #D4855A 100%)',
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 20,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    background: 'rgba(255, 255, 255, 0.98)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: 20,
                },
            },
        },
    },
});

const ProtectedRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

function AppRoutes() {
    const { user, loading } = useAuth();
    if (loading) return <LoadingSpinner />;

    return (
        <>
            <Routes>
                <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
                <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
                <Route path="/" element={<ProtectedRoute><Navbar /><HomePage /></ProtectedRoute>} />
                <Route path="/my-bookings" element={<ProtectedRoute><Navbar /><MyBookingsPage /></ProtectedRoute>} />
                <Route path="/admin/dashboard" element={
                    <ProtectedRoute>
                        <AdminDashboardPage />
                    </ProtectedRoute>
                } />

            </Routes>
        </>
    );
}

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <AuthProvider>
                    <AppRoutes />
                </AuthProvider>
            </Router>
        </ThemeProvider>
    );
}

export default App;