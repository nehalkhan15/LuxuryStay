import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Wrench, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function MaintenancePage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [repairNotes, setRepairNotes] = useState({});
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTicket = async (ticketId, newStatus) => {
    const notes = repairNotes[ticketId] || '';
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, repairNotes: notes })
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      fetchTickets();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Facility Operations
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Maintenance & Repairs Hub</h1>
          <p className="text-xs text-stone-500 mt-1">Track reported facility issues, prioritize repairs, log resolution notes, and restore rooms.</p>
        </div>
      </div>

      {tickets.length === 0 ? (
        <EmptyState icon={Wrench} title="No active maintenance tickets" description="All hotel equipment and rooms are operating at peak performance." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map(ticket => (
            <Card key={ticket._id} padding="p-6" className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-serif font-bold text-xl text-stone-900">Room {ticket.room?.roomNumber}</span>
                  <p className="text-xs font-semibold text-stone-500 mt-0.5">{ticket.priority} Priority</p>
                </div>
                <Badge status={ticket.status === 'Completed' ? 'Confirmed' : 'Reserved'} label={ticket.status} />
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-800">
                <span className="font-bold block text-stone-400 uppercase text-[10px]">Reported Issue</span>
                <p className="mt-1">{ticket.problemDescription}</p>
              </div>

              {ticket.repairNotes && (
                <div className="p-3 bg-stone-100/70 rounded-2xl border border-stone-200 text-xs text-stone-700">
                  <span className="font-bold text-amber-800 text-[10px] uppercase block">Repair Log</span>
                  <p className="mt-0.5 italic">{ticket.repairNotes}</p>
                </div>
              )}

              {ticket.status !== 'Completed' && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    placeholder="Add repair resolution notes..."
                    value={repairNotes[ticket._id] || ''}
                    onChange={e => setRepairNotes({ ...repairNotes, [ticket._id]: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-xs text-stone-900"
                  />
                  <div className="flex gap-3">
                    {ticket.status === 'Pending' && (
                      <Button variant="secondary" onClick={() => handleUpdateTicket(ticket._id, 'In Progress')} className="flex-1">
                        Start Work
                      </Button>
                    )}
                    <Button variant="gold" onClick={() => handleUpdateTicket(ticket._id, 'Completed')} className="flex-1">
                      <CheckCircle className="w-4 h-4" /> Repair Complete & Available
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
