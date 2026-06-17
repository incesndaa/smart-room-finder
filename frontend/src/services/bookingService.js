import api from './api';

export const bookingService = {
    // Ambil semua booking
    getAllBookings: async () => {
        const response = await api.get('/bookings');
        return response.data;
    },

    // Cek ketersediaan
    checkAvailability: async (roomId, date, startTime = null, endTime = null) => {
        let url = `/bookings/check?roomId=${roomId}&date=${date}`;
        if (startTime && endTime) {
            url += `&startTime=${startTime}&endTime=${endTime}`;
        }
        const response = await api.get(url);
        return response.data;
    },

    // Buat booking baru
    createBooking: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },

    // Batalkan booking
    cancelBooking: async (id) => {
        const response = await api.delete(`/bookings/${id}`);
        return response.data;
    }
};