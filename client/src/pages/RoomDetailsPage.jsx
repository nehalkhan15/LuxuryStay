import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { BedDouble, ArrowLeft, CheckCircle, Wrench, Sparkles, User, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoomDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchRoom();
  }, [id]);

  const fetchRoom = async () => {
    try {
      const res = await fetch(`/api/rooms/${id}`);
      const data = await res.json();
      setRoom(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/rooms/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchRoom();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-stone-500">Loading room details...</div>;
  }

  if (!room) {
    return <div className="p-8 text-center text-xs text-stone-500">Room not found.</div>;
  }

  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <button onClick={() => navigate('/rooms')} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Rooms Directory
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Image & Specifications Card */}
        <div className="md:col-span-2 space-y-6">
          <Card padding="p-0" className="overflow-hidden">
            <div className="h-64 bg-stone-900 relative" style={{
              backgroundImage: `url('${room.roomType?.imageUrl || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              <div className="absolute top-4 right-4">
                <Badge status={room.status} />
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-serif font-bold text-stone-900">Room {room.roomNumber}</h1>
                  <p className="text-xs font-semibold text-stone-500 mt-1">{room.roomType?.name} • Floor {room.floor}</p>
                </div>
                <span className="text-2xl font-serif font-bold text-stone-900">${room.pricePerNight} <span className="text-xs font-normal text-stone-400">/ night</span></span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed border-t border-stone-100 pt-4">
                {room.roomType?.description || 'Luxurious accommodations designed with natural textures, deep soaking tub, high-speed Wi-Fi, and skyline views.'}
              </p>

              {/* Amenities List */}
              <div className="pt-2">
                <span className="text-xs uppercase font-bold text-stone-400 block mb-2">Room Amenities</span>
                <div className="flex flex-wrap gap-2">
                  {(room.roomType?.amenities || ['King Bed', 'Ocean View', 'Free Wi-Fi', 'Smart TV']).map((am, i) => (
                    <span key={i} className="px-3 py-1 bg-stone-100 rounded-xl text-xs font-medium text-stone-700">
                      {am}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Status Control & Actions Card */}
        <div className="space-y-6">
          <Card spaceY="space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-900 border-b border-stone-100 pb-3">Status Management</h3>
            
            <div className="space-y-2">
              <span className="text-xs text-stone-400 font-semibold block">Current Status</span>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 flex justify-between items-center">
                <span className="font-bold text-sm text-stone-900">{room.status}</span>
                <Badge status={room.status} />
              </div>
            </div>

            {/* Contextual Status Actions */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <span className="text-xs text-stone-400 font-semibold block mb-2">Update Room Status</span>
              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="secondary"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('Available')}
                  className="w-full justify-start text-xs"
                >
                  <CheckCircle className="w-4 h-4 text-luxury-muted-blue" /> Mark Available
                </Button>

                <Button
                  variant="secondary"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('Cleaning')}
                  className="w-full justify-start text-xs"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" /> Dispatch Cleaning
                </Button>

                <Button
                  variant="secondary"
                  disabled={updatingStatus}
                  onClick={() => handleStatusChange('Under Maintenance')}
                  className="w-full justify-start text-xs"
                >
                  <Wrench className="w-4 h-4 text-purple-600" /> Under Maintenance
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
