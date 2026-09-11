import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LogOut, Search, FileText, CheckCircle } from 'lucide-react';

export default function CheckOutPage() {
  const navigate = useNavigate();
  const [checkedInBookings, setCheckedInBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedInvoice, setGeneratedInvoice] = useState(null);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchCheckedInBookings();
  }, []);

  const fetchCheckedInBookings = async () => {
    try {
      const res = await fetch('/api/bookings?status=Checked-In', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCheckedInBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessCheckout = async () => {
    if (!selectedBooking) return;
    try {
      // 1. Mark checked out
      const res = await fetch(`/api/bookings/${selectedBooking._id}/check-out`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Checkout failed');

      // 2. Generate invoice
      const invRes = await fetch(`/api/invoices/generate/${selectedBooking._id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const invData = await invRes.json();
      setGeneratedInvoice(invData);
      alert(`Check-Out Complete! Invoice #${invData.invoiceNumber} generated. Housekeeping task dispatched and room status updated to CLEANING.`);
      navigate(`/invoices/${invData._id}`);
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = checkedInBookings.filter(b => b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) || b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.room?.roomNumber?.includes(searchTerm));

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-stone-200 pb-6">
        <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
          Front Desk Operations
        </span>
        <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Guest Check-Out & Folio Settlement</h1>
        <p className="text-xs text-stone-500 mt-1">Review guest stay, calculate room & service charges, generate digital invoice, and dispatch housekeeping.</p>
      </div>

      <Card spaceY="space-y-6">
        <h3 className="font-serif font-bold text-lg text-stone-900">Select Checked-In Guest</h3>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by room number, guest name, or booking ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs text-stone-900"
          />
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-xs text-stone-500 py-6 text-center">No guests currently checked in match the search query.</p>
          ) : (
            filtered.map(b => (
              <div
                key={b._id}
                onClick={() => setSelectedBooking(b)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  selectedBooking?._id === b._id ? 'bg-amber-50 border-amber-300' : 'bg-stone-50 border-stone-200 hover:border-stone-300'
                }`}
              >
                <div>
                  <span className="font-mono font-bold text-amber-800 text-xs">Room {b.room?.roomNumber}</span>
                  <p className="font-bold text-stone-900 text-sm mt-0.5">{b.guest?.name}</p>
                  <p className="text-xs text-stone-500">Booking ID: {b.bookingId} • Rate: ${b.totalAmount}</p>
                </div>
                <Button variant={selectedBooking?._id === b._id ? 'gold' : 'secondary'}>
                  {selectedBooking?._id === b._id ? 'Selected' : 'Select'}
                </Button>
              </div>
            ))
          )}
        </div>

        {selectedBooking && (
          <div className="pt-6 border-t border-stone-100 flex justify-end">
            <Button variant="danger" onClick={handleProcessCheckout}>
              <LogOut className="w-4 h-4" /> Process Check-Out & Generate Invoice
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
