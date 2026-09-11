import React, { useState, useEffect } from 'react';
import { Wrench, CheckCircle2, Clock, AlertTriangle, MessageSquare, Plus, Check } from 'lucide-react';

export default function MaintenanceDashboard({ activeTab: parentActiveTab }) {
  const [tickets, setTickets] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [repairNotes, setRepairNotes] = useState({});
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [issueText, setIssueText] = useState('');
  const [issuePriority, setIssuePriority] = useState('High');

  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchMaintenanceData();
    const refreshTimer = window.setInterval(fetchMaintenanceData, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const fetchMaintenanceData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch('/api/maintenance', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rooms')
      ]);
      const [tData, rData] = await Promise.all([tRes.json(), rRes.json()]);
      setTickets(Array.isArray(tData) ? tData : []);
      setRooms(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    const notes = repairNotes[ticketId] || '';
    try {
      const res = await fetch(`/api/maintenance/${ticketId}/update`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, repairNotes: notes })
      });
      if (!res.ok) throw new Error('Failed to update ticket');
      alert(`Work order updated to "${newStatus}"! ${newStatus === 'Completed' ? 'Room has been restored to Available status.' : ''}`);
      fetchMaintenanceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !issueText) return;

    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: selectedRoomId, problemDescription: issueText, priority: issuePriority })
      });
      if (!res.ok) throw new Error('Failed to submit maintenance report');

      setShowIssueModal(false);
      setSelectedRoomId('');
      setIssueText('');
      alert('Maintenance Ticket Created! Room set to Under Maintenance.');
      fetchMaintenanceData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'Emergency': return 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
      case 'High': return 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
      case 'Medium': return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default: return 'bg-stone-800 text-stone-400 border-stone-700';
    }
  };

  const pendingTickets = tickets.filter(t => t.status !== 'Completed');

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-amber-500 selection:text-stone-950">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-400 font-mono">
            <Wrench className="w-4 h-4" /> Facilities & Engineering Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
            Maintenance Work Orders & Repairs
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Diagnose facility issues, log resolution notes, manage repair progress, and return rooms to active service.
          </p>
        </div>

        <button
          onClick={() => setShowIssueModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 transition"
        >
          <Plus className="w-4 h-4" /> Log New Work Order
        </button>
      </div>

      {/* Ticket Work Queue */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" /> Active Maintenance Queue ({pendingTickets.length} Pending)
          </h3>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-stone-900/80 border border-stone-800 p-10 rounded-3xl text-center text-stone-500 text-xs">
            No active maintenance requests. All resort facilities and equipment are operating at peak performance!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tickets.map(ticket => (
              <div key={ticket._id} className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-xl text-stone-100 block">
                        Room #{ticket.room?.roomNumber}
                      </span>
                      <span className="text-xs text-stone-400">{ticket.room?.roomType?.name || 'Luxury Suite'}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2.5 py-1 rounded-full border ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        ticket.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        ticket.status === 'In Progress' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                        'bg-stone-800 text-stone-400 border-stone-700'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                  </div>

                  <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs space-y-1">
                    <span className="text-[10px] text-stone-500 uppercase font-bold tracking-wider block">Defect / Issue Report</span>
                    <p className="text-stone-200 leading-relaxed">{ticket.problemDescription}</p>
                    <span className="text-[10px] text-stone-500 font-mono block pt-1">
                      Reported by: {ticket.reportedBy?.name || 'Staff'} &bull; {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {ticket.repairNotes && (
                    <div className="bg-stone-950/70 p-3 rounded-2xl border border-amber-500/20 text-xs space-y-0.5">
                      <span className="text-[10px] text-amber-400 font-bold uppercase block">Resolution Log Notes</span>
                      <p className="text-stone-300 italic">{ticket.repairNotes}</p>
                    </div>
                  )}
                </div>

                {ticket.status !== 'Completed' ? (
                  <div className="space-y-2.5 pt-3 border-t border-stone-800">
                    <input
                      type="text"
                      placeholder="Add diagnostic / repair resolution notes..."
                      value={repairNotes[ticket._id] || ''}
                      onChange={e => setRepairNotes({ ...repairNotes, [ticket._id]: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-2xl text-xs text-stone-100 focus:outline-none focus:border-purple-500"
                    />

                    <div className="flex gap-2">
                      {ticket.status === 'Pending' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket._id, 'In Progress')}
                          className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-2xl text-xs shadow-md transition"
                        >
                          Start Diagnostic Work
                        </button>
                      )}
                      <button
                        onClick={() => handleUpdateStatus(ticket._id, 'Completed')}
                        className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-stone-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow-md transition"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Repair Complete & Available
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-2 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                    <Check className="w-4 h-4" /> Work Order Resolved & Room Restored
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal to log new work order */}
      {showIssueModal && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">
            <h3 className="font-serif font-bold text-lg flex items-center gap-2">
              <Wrench className="w-5 h-5 text-purple-400" /> Log Maintenance Work Order
            </h3>
            <form onSubmit={handleCreateTicket} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Select Room Unit</label>
                <select
                  value={selectedRoomId}
                  onChange={e => setSelectedRoomId(e.target.value)}
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="">Choose Room...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.roomType?.name}) - Status: {r.status}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Priority Level</label>
                <select
                  value={issuePriority}
                  onChange={e => setIssuePriority(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-purple-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Problem Description</label>
                <textarea
                  value={issueText}
                  onChange={e => setIssueText(e.target.value)}
                  rows="3"
                  placeholder="Describe technical issue, required parts, or repairs..."
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-purple-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowIssueModal(false)} className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl shadow-lg">Submit Ticket</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
