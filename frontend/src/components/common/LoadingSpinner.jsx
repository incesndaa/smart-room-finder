import React from 'react';
import { CircularProgress, Box, Typography } from '@mui/material';

const LoadingSpinner = () => {
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh' 
        }}>
            <CircularProgress size={60} sx={{ color: '#667eea' }} />
            <Typography sx={{ mt: 2, color: 'white', fontWeight: 500 }}>
                Memuat...
            </Typography>
        </Box>
    );
};

export default LoadingSpinner;