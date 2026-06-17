import React from 'react';
import { Card, CardContent, CardMedia, Typography, Button, Chip, Box } from '@mui/material';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import MeetingRoomOutlinedIcon from '@mui/icons-material/MeetingRoomOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

const RoomCard = ({ room, onBook }) => {
    const facilities = typeof room.facilities === 'string' 
        ? JSON.parse(room.facilities || '[]')
        : room.facilities || [];

    return (
        <Card sx={{ 
            borderRadius: 4,
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            background: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: '0 20px 40px rgba(102,126,234,0.15)',
            }
        }}>
            <Box sx={{ position: 'relative', overflow: 'hidden' }}>
                <CardMedia
                    component="img"
                    height="220"
                    image={room.image_url || 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=500&h=350&fit=crop'}
                    alt={room.name}
                    sx={{ 
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                            transform: 'scale(1.05)',
                        }
                    }}
                />
                <Box sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    borderRadius: 20,
                    px: 1.5,
                    py: 0.5,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                }}>
                    <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                        Kapasitas {room.capacity}
                    </Typography>
                </Box>
            </Box>
            
            <CardContent sx={{ p: 3, flexGrow: 1 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: '#1a1a2e', mb: 1 }}>
                    {room.name}
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 0.3, mb: 2 }}>
                    {[1,2,3,4,5].map((star) => (
                        <StarIcon key={star} sx={{ fontSize: 16, color: '#FFB800' }} />
                    ))}
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8, mb: 2 }}>
                    {facilities.slice(0, 4).map((facility, index) => (
                        <Chip
                            key={index}
                            label={facility}
                            size="small"
                            icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />}
                            sx={{ 
                                fontSize: '0.7rem',
                                bgcolor: '#f0f2f5',
                                color: '#555',
                                '& .MuiChip-icon': { color: '#4caf50' }
                            }}
                        />
                    ))}
                    {facilities.length > 4 && (
                        <Chip 
                            label={`+${facilities.length - 4}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ borderColor: '#ddd', color: '#888' }}
                        />
                    )}
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={() => onBook(room)}
                    startIcon={<MeetingRoomOutlinedIcon />}
                    sx={{
                        mt: 2,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 30,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 15px rgba(102,126,234,0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            transform: 'scale(1.02)',
                            boxShadow: '0 6px 20px rgba(102,126,234,0.5)',
                        }
                    }}
                >
                    Booking Sekarang
                </Button>
            </CardContent>
        </Card>
    );
};

export default RoomCard;