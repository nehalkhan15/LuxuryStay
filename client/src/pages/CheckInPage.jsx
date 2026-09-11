import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { CheckCircle, Search, UserCheck, BedDouble, ArrowRight } from 'lucide-react';

export default function CheckInPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedBookingId = searchParams.get('bookingId');

  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [step, setStep] = useState(1);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchConfirmedBookings();
  }, []);

  const fetchConfirmedBookings = async () => {
    try {
      const res = await fetch('/api/bookings?status=Confirmed', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) {
        setBookings(data);
        if (preselectedBookingId) {
          const match = data.find(b => b._id === preselectedBookingId);
          if (match) setSelectedBooking(match);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompleteCheckIn = async () => {
    if (!selectedBooking) return;
    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/check-in`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Check-in failed');
      alert(`Check-In Complete! Guest assigned to Room ${selectedBooking.room?.roomNumber}. Room status updated to Occupied.`);
      navigate(`/rooms/${selectedBooking.room?._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = bookings.filter(b => b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) || b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Front Desk Operations
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Guest Check-In Desk</h1>
        <p className="text-xs text-stone-500 mt-1">Verify guest arrival, confirm room allocation, and transition room status to Occupied.</p>
      </div>

      {/* Steps Indicator */}
      <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-stone-200 shadow-sm text-xs font-semibold">
        <div className={`flex items-center gap-2 ${step >= 1 ? 'text-amber-800 font-bold' : 'text-stone-400'}`}>
          <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs">1</span>
          <span>Find Reservation</span>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300" />
        <div className={`flex items-center gap-2 ${step >= 2 ? 'text-amber-800 font-bold' : 'text-stone-400'}`}>
          <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs">2</span>
          <span>Verify Guest & Room</span>
        </div>
        <ArrowRight className="w-4 h-4 text-stone-300" />
        <div className={`flex items-center gap-2 ${step >= 3 ? 'text-amber-800 font-bold' : 'text-stone-400'}`}>
          <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-900 font-bold text-xs">3</span>
          <span>Complete Arrival</span>
        </div>
      </div>

      {/* Step 1: Search / Select */}
      {step === 1 && (
        <Card spaceY="space-y-4">
          <h3 className="font-serif font-bold text-lg text-stone-900">Select Arrival Reservation</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search guest name or reservation ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-stone-900"
            />
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-xs text-stone-500 py-4 text-center">No confirmed reservations ready for check-in.</p>
            ) : (
              filtered.map(b => (
                <div
                  key={b._id}
                  onClick={() => { setSelectedBooking(b); setStep(2); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedBooking?._id === b._id ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div>
                    <span className="font-mono font-bold text-amber-800 text-xs">{b.bookingId}</span>
                    <p className="font-bold text-stone-900 text-sm mt-0.5">{b.guest?.name}</p>
                    <p className="text-xs text-stone-500">Room {b.room?.roomNumber} ({b.room?.roomType?.name})</p>
                  </div>
                  <Button variant="secondary" className="pointer-events-none">Select</Button>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Step 2: Verification */}
      {step === 2 && selectedBooking && (
        <Card spaceY="space-y-6">
          <h3 className="font-serif font-bold text-lg text-stone-900">Verify Guest & Room Assignment</h3>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-stone-400 font-semibold block uppercase">Guest Identity</span>
              <p className="font-bold text-stone-900 text-sm mt-1">{selectedBooking.guest?.name}</p>
              <p className="text-stone-500">{selectedBooking.guest?.email}</p>
            </div>
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <span className="text-stone-400 font-semibold block uppercase">Assigned Room</span>
              <p className="font-bold text-stone-900 text-sm mt-1">Room {selectedBooking.room?.roomNumber}</p>
              <p className="text-stone-500">{selectedBooking.room?.roomType?.name} • Floor {selectedBooking.room?.floor}</p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-stone-100">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button variant="gold" onClick={() => setStep(3)}>Proceed to Complete <ArrowRight className="w-4 h-4" /></Button>
          </div>
        </Card>
      )}

      {/* Step 3: Complete Check-In */}
      {step === 3 && selectedBooking && (
        <Card spaceY="space-y-6" className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-stone-900">Ready to Check-In Guest</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Confirming check-in will assign Room {selectedBooking.room?.roomNumber} to {selectedBooking.guest?.name} and update room status to OCCUPIED.
            </p>
          </div>

          <div className="flex justify-center gap-3 pt-4">
            <Button variant="secondary" onClick={() => setStep(2)}>Review Details</Button>
            <Button variant="gold" onClick={handleCompleteCheckIn}>
              <UserCheck className="w-4 h-4" /> Confirm & Complete Arrival
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
