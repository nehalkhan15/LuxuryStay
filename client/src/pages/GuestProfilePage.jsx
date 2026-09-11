import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { ArrowLeft, User, Mail, Phone, CalendarCheck, FileText } from 'lucide-react';

export default function GuestProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchGuestData();
  }, [id]);

  const fetchGuestData = async () => {
    try {
      const [uRes, bRes] = await Promise.all([
        fetch(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`/api/bookings?guestId=${id}`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [uData, bData] = await Promise.all([uRes.json(), bRes.json()]);
      setGuest(uData);
      setBookings(Array.isArray(bData) ? bData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-stone-500">Loading guest profile...</div>;
  if (!guest) return <div className="p-8 text-center text-xs text-stone-500">Guest not found.</div>;

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div>
        <button onClick={() => navigate('/guests')} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Guest Directory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <Card spaceY="space-y-4">
          <div className="text-center py-4 space-y-2 border-b border-stone-100 pb-6">
            <div className="w-16 h-16 rounded-full bg-stone-900 text-amber-400 font-serif font-bold text-2xl flex items-center justify-center mx-auto shadow-md">
              {guest.name?.charAt(0)}
            </div>
            <h2 className="font-serif font-bold text-xl text-stone-900">{guest.name}</h2>
            <Badge status="Confirmed" label={guest.role} />
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-stone-600">
              <Mail className="w-4 h-4 text-stone-400" />
              <span>{guest.email}</span>
            </div>
            <div className="flex items-center gap-2 text-stone-600">
              <Phone className="w-4 h-4 text-stone-400" />
              <span>{guest.phone || 'No phone recorded'}</span>
            </div>
          </div>
        </Card>

        {/* Booking History */}
        <div className="md:col-span-2 space-y-6">
          <Card spaceY="space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">Guest Stay History</h3>

            {bookings.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">No stay history recorded for this guest.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div key={b._id} className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-amber-800">Booking #{b.bookingId}</span>
                      <p className="font-bold text-stone-900 text-sm mt-0.5">Room {b.room?.roomNumber} ({b.room?.roomType?.name})</p>
                      <p className="text-stone-500">{new Date(b.checkInDate).toLocaleDateString()} ➔ {new Date(b.checkOutDate).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right space-y-1">
                      <span className="font-mono font-bold text-stone-900 text-sm block">${b.totalAmount}</span>
                      <Badge status={b.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
