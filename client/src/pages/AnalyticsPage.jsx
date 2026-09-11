import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, PieChart as PieChartIcon, Calendar, BedDouble, 
  ArrowUpRight, Users, Star, Layers, Download, RefreshCw, BarChart2, Filter, Shield
} from 'lucide-react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAnalytics(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const totalRev = analytics?.revenue?.totalPaid || 0;
  const roomRev = analytics?.revenue?.roomRevenuePaid || 0;
  const serviceRev = analytics?.revenue?.serviceRevenuePaid || 0;
  const taxCol = analytics?.revenue?.taxCollected || 0;

  const roomPct = analytics?.revenue?.roomPercentage || 75;
  const servicePct = analytics?.revenue?.servicePercentage || 25;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-amber-500 selection:text-stone-950">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
            <TrendingUp className="w-4 h-4" /> Financial Intelligence & Operations
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
            Executive Revenue & Analytics Report
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Real-time financial performance, occupancy rates, room yield, and incidental revenue metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-stone-900 p-1 rounded-2xl border border-stone-800 text-xs font-semibold text-stone-400">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-xl uppercase transition ${
                  timeRange === range ? 'bg-amber-400 text-stone-950 shadow-md font-bold' : 'hover:text-stone-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Download className="w-4 h-4" /> Export PDF Folio
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Gross Settled Revenue</span>
            <div className="p-2.5 bg-emerald-500/15 rounded-2xl text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-stone-100 block">
              ${totalRev.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
              <span>Real-time database calculated</span>
            </div>
          </div>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Average Occupancy</span>
            <div className="p-2.5 bg-amber-500/15 rounded-2xl text-amber-400">
              <PieChartIcon className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-amber-400 block">
              {analytics?.occupancyRate || 0}%
            </span>
            <span className="text-xs text-stone-400 block mt-2">
              {analytics?.rooms?.occupied || 0} of {analytics?.rooms?.total || 0} Rooms Occupied
            </span>
          </div>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Total Bookings</span>
            <div className="p-2.5 bg-blue-500/15 rounded-2xl text-blue-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-blue-400 block">
              {analytics?.bookings?.total || 0}
            </span>
            <span className="text-xs text-stone-400 block mt-2">
              {analytics?.bookings?.checkedIn || 0} Currently In-House
            </span>
          </div>
        </div>

        <div className="bg-stone-900/90 border border-stone-800 p-6 rounded-3xl space-y-2 relative overflow-hidden shadow-xl">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Guest Sentiment Index</span>
            <div className="p-2.5 bg-gold-500/15 rounded-2xl text-gold-400">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-serif font-bold text-gold-400 block">
              {analytics?.guestSatisfaction || 5.0} / 5.0
            </span>
            <span className="text-xs text-stone-400 block mt-2">
              Based on verified guest folios
            </span>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown & Yield Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Stream Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-amber-400" /> Revenue Stream Composition
              </h3>
              <p className="text-xs text-stone-400">Breakdown of accommodation versus guest incidentals.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-stone-300">Room Accommodation Yield ({roomPct}%)</span>
                <span className="font-mono text-amber-400 font-bold">${roomRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all duration-500" style={{ width: `${roomPct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-stone-300">In-Room Dining, Spa & Services ({servicePct}%)</span>
                <span className="font-mono text-emerald-400 font-bold">${serviceRev.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" style={{ width: `${servicePct}%` }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-stone-300">Hospitality & Municipal Tax Collected</span>
                <span className="font-mono text-stone-400 font-bold">${taxCol.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="w-full h-3 bg-stone-950 rounded-full overflow-hidden border border-stone-800">
                <div className="h-full bg-stone-700 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Pending Settlement</span>
              <span className="font-mono font-bold text-amber-400 text-base mt-0.5 block">
                ${(analytics?.revenue?.totalPending || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase block">Total Reviews Logged</span>
              <span className="font-serif font-bold text-stone-100 text-base mt-0.5 block">
                {analytics?.totalReviews || 0} Reviews
              </span>
            </div>
          </div>
        </div>

        {/* Room Status Capacity Matrix */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" /> Operational Capacity Matrix
            </h3>
            <p className="text-xs text-stone-400 mt-0.5">Live room status proportions across the hotel property.</p>
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-xs">
            <div className="bg-stone-950 p-4 rounded-2xl border border-emerald-500/30 space-y-1">
              <span className="text-[10px] text-emerald-400 font-bold uppercase block">Available for Booking</span>
              <span className="text-2xl font-serif font-bold text-emerald-300 block">{analytics?.rooms?.available || 0} Suites</span>
              <span className="text-[10px] text-stone-500">Ready for instant check-in</span>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-rose-500/30 space-y-1">
              <span className="text-[10px] text-rose-400 font-bold uppercase block">Currently Occupied</span>
              <span className="text-2xl font-serif font-bold text-rose-300 block">{analytics?.rooms?.occupied || 0} Suites</span>
              <span className="text-[10px] text-stone-500">Guests in-house</span>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-amber-500/30 space-y-1">
              <span className="text-[10px] text-amber-400 font-bold uppercase block">Housekeeping Sanitization</span>
              <span className="text-2xl font-serif font-bold text-amber-300 block">{analytics?.rooms?.cleaning || 0} Suites</span>
              <span className="text-[10px] text-stone-500">In cleaning queue</span>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-purple-500/30 space-y-1">
              <span className="text-[10px] text-purple-400 font-bold uppercase block">Under Maintenance</span>
              <span className="text-2xl font-serif font-bold text-purple-300 block">{analytics?.rooms?.maintenance || 0} Suites</span>
              <span className="text-[10px] text-stone-500">Repairs in progress</span>
            </div>
          </div>

          <div className="pt-2 text-center text-[11px] text-stone-500 italic">
            Automated calculations synced with active MongoDB cluster records.
          </div>
        </div>
      </div>
    </div>
  );
}
