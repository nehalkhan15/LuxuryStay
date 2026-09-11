import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowLeft, Calendar, User, BedDouble, CheckCircle, FileText, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ReservationDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchBooking();
  }, [id]);

  const fetchBooking = async () => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBooking(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await fetch(`/api/bookings/${id}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      fetchBooking();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-stone-500">Loading reservation...</div>;
  if (!booking) return <div className="p-8 text-center text-xs text-stone-500">Reservation not found.</div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <button onClick={() => navigate('/reservations')} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Reservations
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Details */}
        <div className="md:col-span-2 space-y-6">
          <Card spaceY="space-y-6">
            <div className="flex justify-between items-start border-b border-stone-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-amber-800 uppercase block">Booking #{booking.bookingId}</span>
                <h1 className="text-2xl font-serif font-bold text-stone-900 mt-1">Reservation Details</h1>
              </div>
              <Badge status={booking.status} />
            </div>

            {/* Guest Info */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-stone-400 block">Guest Information</span>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1">
                <p className="font-bold text-stone-900 text-sm">{booking.guest?.name}</p>
                <p className="text-stone-500">{booking.guest?.email} • {booking.guest?.phone}</p>
              </div>
            </div>

            {/* Room Info */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-stone-400 block">Room Allocation</span>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-1">
                <p className="font-bold text-stone-900 text-sm">Room {booking.room?.roomNumber} - {booking.room?.roomType?.name}</p>
                <p className="text-stone-500">Floor {booking.room?.floor} • ${booking.room?.pricePerNight} / night</p>
              </div>
            </div>

            {/* Stay Dates */}
            <div className="space-y-2">
              <span className="text-xs uppercase font-bold text-stone-400 block">Stay Dates</span>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block font-semibold">Check-In</span>
                  <span className="font-bold text-stone-900 text-sm">{new Date(booking.checkInDate).toLocaleDateString()}</span>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                  <span className="text-stone-400 block font-semibold">Check-Out</span>
                  <span className="font-bold text-stone-900 text-sm">{new Date(booking.checkOutDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
          <Card spaceY="space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">Financial Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-500">Total Rate</span>
                <span className="font-mono font-bold text-stone-900">${booking.totalAmount}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 space-y-2">
              {booking.status === 'Confirmed' && (user?.role === 'Admin' || user?.role === 'Receptionist' || user?.role === 'Manager') && (
                <Link to={`/check-in?bookingId=${booking._id}`}>
                  <Button variant="gold" className="w-full">
                    <CheckCircle className="w-4 h-4" /> Proceed to Check-In
                  </Button>
                </Link>
              )}

              {booking.status !== 'Cancelled' && booking.status !== 'Checked-Out' && (
                <Button variant="danger" onClick={handleCancelBooking} className="w-full">
                  <XCircle className="w-4 h-4" /> Cancel Reservation
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
