import api from './api';

export const roomService = {
    // Ambil semua ruangan
    getAllRooms: async () => {
        const response = await api.get('/rooms');
        return response.data;
    },

    // Ambil detail ruangan
    getRoomById: async (id) => {
        const response = await api.get(`/rooms/${id}`);
        return response.data;
    },

    // Tambah ruangan (admin)
    createRoom: async (roomData) => {
        const response = await api.post('/rooms', roomData);
        return response.data;
    },

    // Update ruangan (admin)
    updateRoom: async (id, roomData) => {
        const response = await api.put(`/rooms/${id}`, roomData);
        return response.data;
    },

    // Hapus ruangan (admin)
    deleteRoom: async (id) => {
        const response = await api.delete(`/rooms/${id}`);
        return response.data;
    }
};