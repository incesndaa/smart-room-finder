import { useState, useEffect } from 'react';
import { bookingService } from '../services/bookingService';

export const useBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const response = await bookingService.getAll();
            setBookings(response.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const createBooking = async (data) => {
        try {
            const response = await bookingService.create(data);
            await fetchBookings(); // Refresh list
            return response.data;
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    return { bookings, loading, error, createBooking, fetchBookings };
};