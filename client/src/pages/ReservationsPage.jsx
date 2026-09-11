import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { CalendarCheck, Search, Filter, Eye } from 'lucide-react';

export default function ReservationsPage() {
  const [bookings, setBookings] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = bookings.filter(b => {
    const matchesStatus = filterStatus === 'All' || b.status === filterStatus;
    const matchesSearch = b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) || b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Booking Engine
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Reservations Directory</h1>
          <p className="text-xs text-stone-500 mt-1">Manage guest stays, stay dates, room allocations, and check-in states.</p>
        </div>
      </div>

      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['All', 'Confirmed', 'Checked-In', 'Checked-Out', 'Cancelled'].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === st ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search booking ID or guest..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2 pl-10 pr-4 text-xs text-stone-900 focus:outline-none"
            />
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title="No reservations found" description="There are no bookings matching the current filter." />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-4">Reservation ID</th>
                  <th className="p-4">Guest</th>
                  <th className="p-4">Assigned Room</th>
                  <th className="p-4">Check-In</th>
                  <th className="p-4">Check-Out</th>
                  <th className="p-4">Total Rate</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(b => (
                  <tr key={b._id} className="hover:bg-stone-50/60 transition">
                    <td className="p-4 font-mono font-bold text-amber-800">{b.bookingId}</td>
                    <td className="p-4 font-semibold text-stone-900">{b.guest?.name}</td>
                    <td className="p-4 text-stone-700">Room {b.room?.roomNumber} ({b.room?.roomType?.name})</td>
                    <td className="p-4 text-stone-500">{new Date(b.checkInDate).toLocaleDateString()}</td>
                    <td className="p-4 text-stone-500">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                    <td className="p-4 font-mono font-bold text-stone-900">${b.totalAmount}</td>
                    <td className="p-4"><Badge status={b.status} /></td>
                    <td className="p-4 text-right">
                      <Link to={`/reservations/${b._id}`}>
                        <Button variant="secondary" className="inline-flex">
                          <Eye className="w-3.5 h-3.5" /> Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
