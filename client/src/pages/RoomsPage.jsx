import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { BedDouble, Search, Plus, Eye, Filter } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const res = await fetch('/api/rooms');
      const data = await res.json();
      setRooms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(r => {
    const matchesStatus = filterStatus === 'All' || r.status === filterStatus;
    const matchesSearch = r.roomNumber.includes(searchTerm) || r.roomType?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Hotel Directory
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2 tracking-tight">Rooms & Suites Directory</h1>
          <p className="text-xs text-stone-500 mt-1">Live room status, pricing, floor assignment, and occupancy management.</p>
        </div>

        {user?.role === 'Admin' && (
          <Link to="/room-types">
            <Button variant="primary"><Plus className="w-4 h-4" /> Manage Room Types</Button>
          </Link>
        )}
      </div>

      {/* Filter Toolbar */}
      <Card padding="p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
            {['All', 'Available', 'Reserved', 'Occupied', 'Cleaning', 'Under Maintenance'].map(st => (
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
              placeholder="Search room number or type..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2 pl-10 pr-4 text-xs text-stone-900 focus:outline-none focus:border-stone-400"
            />
          </div>
        </div>
      </Card>

      {/* Room Listing Cards */}
      {filteredRooms.length === 0 ? (
        <EmptyState icon={BedDouble} title="No rooms match the filter" description="Try selecting a different room status filter or clearing your search term." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredRooms.map(room => (
            <Card key={room._id} hover padding="p-5" className="flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="font-serif font-bold text-xl text-stone-900">Room {room.roomNumber}</span>
                  <Badge status={room.status} />
                </div>
                <p className="text-xs font-semibold text-stone-600">{room.roomType?.name}</p>
                <p className="text-xs text-stone-400">Floor {room.floor} • Capacity {room.roomType?.capacity || 2} Guests</p>
                <p className="text-base font-serif font-bold text-stone-900 pt-1">${room.pricePerNight} <span className="text-xs font-normal text-stone-500">/ night</span></p>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end">
                <Link to={`/rooms/${room._id}`}>
                  <Button variant="secondary" className="w-full">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
