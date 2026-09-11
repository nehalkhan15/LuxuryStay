import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { 
  BedDouble, Calendar, Users, Sparkles, Wrench, FileText, ArrowRight, Shield, CheckCircle, Clock
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    if (user?.role === 'Admin' || user?.role === 'Manager') {
      fetch('/api/reports/analytics', { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => setStats(data))
        .catch(() => {});
    }

    fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => Array.isArray(data) && setRecentBookings(data.slice(0, 5)))
      .catch(() => {});
  }, [user]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Editorial Welcome Hero */}
      <div className="bg-white border border-stone-200/80 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2">
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            {user?.role} Portal
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Good day, {user?.name || 'Valued User'}
          </h1>
          <p className="text-xs text-stone-500 max-w-lg leading-relaxed">
            Welcome to LuxuryStay HMS. Here is your operational summary for today.
          </p>
        </div>

        <div className="flex gap-3">
          {user?.role === 'Receptionist' && (
            <Link to="/check-in">
              <Button variant="gold"><CheckCircle className="w-4 h-4" /> Guest Check-In</Button>
            </Link>
          )}
          {user?.role === 'Admin' && (
            <Link to="/users">
              <Button variant="primary"><Users className="w-4 h-4" /> Manage Staff Accounts</Button>
            </Link>
          )}
          {user?.role === 'Guest' && (
            <Link to="/rooms">
              <Button variant="gold"><BedDouble className="w-4 h-4" /> Reserve Suite</Button>
            </Link>
          )}
        </div>
      </div>

      {/* Meaningful Operational Cards */}
      {(user?.role === 'Admin' || user?.role === 'Manager') && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <Card>
            <span className="text-xs text-stone-400 font-semibold uppercase">Total Rooms</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-serif font-bold text-stone-900">{stats.rooms?.total}</span>
              <BedDouble className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-xs text-stone-500 mt-2">{stats.rooms?.occupied} Currently Occupied</p>
          </Card>

          <Card>
            <span className="text-xs text-stone-400 font-semibold uppercase">Occupancy Rate</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-serif font-bold text-stone-900">{stats.occupancyRate}%</span>
              <Calendar className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-xs text-stone-500 mt-2">High Season Yield</p>
          </Card>

          <Card>
            <span className="text-xs text-stone-400 font-semibold uppercase">Gross Revenue</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-serif font-bold text-stone-900">${stats.revenue?.totalPaid?.toLocaleString()}</span>
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <p className="text-xs text-stone-500 mt-2">+${stats.revenue?.totalPending} Billing Pending</p>
          </Card>

          <Card>
            <span className="text-xs text-stone-400 font-semibold uppercase">Guest Score</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-3xl font-serif font-bold text-stone-900">{stats.guestSatisfaction} / 5</span>
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-xs text-stone-500 mt-2">Based on verified reviews</p>
          </Card>
        </div>
      )}

      {/* Recent Activity Table */}
      <Card spaceY="space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <h3 className="font-serif font-bold text-lg text-stone-900">Recent Reservations</h3>
          <Link to="/reservations" className="text-xs font-semibold text-amber-700 hover:underline flex items-center gap-1">
            View All Reservations <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">Reservation ID</th>
                <th className="p-3">Guest Name</th>
                <th className="p-3">Assigned Room</th>
                <th className="p-3">Check-In</th>
                <th className="p-3">Check-Out</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentBookings.map(b => (
                <tr key={b._id} className="hover:bg-stone-50/60 transition">
                  <td className="p-3 font-mono font-bold text-amber-800">{b.bookingId}</td>
                  <td className="p-3 font-semibold text-stone-900">{b.guest?.name}</td>
                  <td className="p-3 text-stone-700">Room {b.room?.roomNumber}</td>
                  <td className="p-3 text-stone-500">{new Date(b.checkInDate).toLocaleDateString()}</td>
                  <td className="p-3 text-stone-500">{new Date(b.checkOutDate).toLocaleDateString()}</td>
                  <td className="p-3"><Badge status={b.status} /></td>
                  <td className="p-3 text-right">
                    <Link to={`/reservations/${b._id}`} className="text-xs font-semibold text-stone-900 hover:underline">
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
