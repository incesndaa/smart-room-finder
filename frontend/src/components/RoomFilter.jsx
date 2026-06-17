import React from 'react';
import { 
    Paper, Box, Typography, 
    Slider, Chip, Button 
} from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearIcon from '@mui/icons-material/Clear';

const RoomFilter = ({ onFilter, onClear, filters }) => {
    const [localFilters, setLocalFilters] = React.useState(filters || {
        minCapacity: 0,
        maxCapacity: 100,
        facilities: []
    });

    const facilityOptions = ['Proyektor', 'AC', 'WiFi', 'Whiteboard', 'Sound System', 'TV', 'Panggung', 'Green Screen'];

    const handleCapacityChange = (event, newValue) => {
        setLocalFilters({ ...localFilters, minCapacity: newValue[0], maxCapacity: newValue[1] });
    };

    const handleFacilityToggle = (facility) => {
        const current = localFilters.facilities;
        const newFacilities = current.includes(facility)
            ? current.filter(f => f !== facility)
            : [...current, facility];
        setLocalFilters({ ...localFilters, facilities: newFacilities });
    };

    const handleApplyFilter = () => onFilter(localFilters);
    const handleClearFilter = () => {
        const resetFilters = { minCapacity: 0, maxCapacity: 100, facilities: [] };
        setLocalFilters(resetFilters);
        onClear();
    };

    return (
        <Paper sx={{ 
            p: 3, 
            borderRadius: 4, 
            background: '#ffffff',
            boxShadow: '0 5px 20px rgba(0,0,0,0.05)',
            border: '1px solid #f0f0f0'
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <FilterAltIcon sx={{ color: '#667eea' }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#1a1a2e' }}>
                    Filter Ruangan
                </Typography>
                {localFilters.facilities.length > 0 && (
                    <Chip 
                        label={`${localFilters.facilities.length} filter aktif`} 
                        size="small" 
                        sx={{ bgcolor: '#667eea', color: '#fff' }}
                    />
                )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'flex-start' }}>
                {/* Filter Kapasitas */}
                <Box sx={{ minWidth: 280, flex: 1 }}>
                    <Typography variant="body2" gutterBottom sx={{ color: '#555', fontWeight: 500 }}>
                        Kapasitas Ruangan
                    </Typography>
                    <Slider
                        value={[localFilters.minCapacity, localFilters.maxCapacity]}
                        onChange={handleCapacityChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={200}
                        sx={{
                            color: '#667eea',
                            '& .MuiSlider-thumb': { backgroundColor: '#667eea' },
                        }}
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                            {localFilters.minCapacity} orang
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                            {localFilters.maxCapacity} orang
                        </Typography>
                    </Box>
                </Box>
                
                {/* Filter Fasilitas */}
                <Box sx={{ flex: 2 }}>
                    <Typography variant="body2" gutterBottom sx={{ color: '#555', fontWeight: 500 }}>
                        Fasilitas yang dibutuhkan
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {facilityOptions.map((facility) => (
                            <Chip
                                key={facility}
                                label={facility}
                                onClick={() => handleFacilityToggle(facility)}
                                sx={{
                                    cursor: 'pointer',
                                    bgcolor: localFilters.facilities.includes(facility) 
                                        ? 'linear-gradient(135deg, #667eea, #764ba2)' 
                                        : '#f5f5f5',
                                    color: localFilters.facilities.includes(facility) ? '#fff' : '#555',
                                    '&:hover': {
                                        bgcolor: localFilters.facilities.includes(facility) ? '#764ba2' : '#e0e0e0',
                                    }
                                }}
                            />
                        ))}
                    </Box>
                </Box>
            </Box>
            
            {/* Tombol Aksi */}
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                <Button 
                    variant="contained" 
                    onClick={handleApplyFilter}
                    startIcon={<FilterAltIcon />}
                    sx={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 30,
                        px: 4,
                        py: 1,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                        }
                    }}
                >
                    Terapkan Filter
                </Button>
                <Button 
                    variant="outlined" 
                    onClick={handleClearFilter} 
                    startIcon={<ClearIcon />}
                    sx={{ 
                        borderRadius: 30, 
                        px: 3,
                        borderColor: '#ddd',
                        color: '#888',
                        textTransform: 'none',
                        '&:hover': {
                            borderColor: '#667eea',
                            color: '#667eea'
                        }
                    }}
                >
                    Reset Filter
                </Button>
            </Box>
        </Paper>
    );
};

export default RoomFilter;