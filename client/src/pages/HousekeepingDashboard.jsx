import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, BedDouble, Clock, Wrench, Plus, Check, FileText, Layers, RefreshCw } from 'lucide-react';

export default function HousekeepingDashboard({ activeTab: parentActiveTab }) {
  const [internalTab, setInternalTab] = useState('tasks');
  const activeTab = parentActiveTab && parentActiveTab !== 'dashboard' ? parentActiveTab : internalTab;

  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [reports, setReports] = useState([]);
  
  // Housekeeping Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({
    roomId: '',
    reportType: 'Damaged',
    notes: ''
  });

  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchHousekeepingData();
    const refreshTimer = window.setInterval(fetchHousekeepingData, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const fetchHousekeepingData = async () => {
    try {
      const [tRes, rRes, repRes] = await Promise.all([
        fetch('/api/housekeeping', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rooms'),
        fetch('/api/housekeeping-reports', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [tData, rData, repData] = await Promise.all([tRes.json(), rRes.json(), repRes.json()]);
      setTasks(Array.isArray(tData) ? tData : []);
      setRooms(Array.isArray(rData) ? rData : []);
      setReports(Array.isArray(repData) ? repData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkCleaned = async (taskId) => {
    try {
      const res = await fetch(`/api/housekeeping/${taskId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update task');
      alert('Room marked as sanitized and inspected! Status updated to Available for guests.');
      fetchHousekeepingData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.roomId || !reportForm.notes) return;

    try {
      const res = await fetch('/api/housekeeping-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(reportForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit report');

      setShowReportModal(false);
      setReportForm({ roomId: '', reportType: 'Damaged', notes: '' });
      alert(`Housekeeping Report Logged! Report ID: ${data._id}`);
      fetchHousekeepingData();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-amber-500 selection:text-stone-950">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400 font-mono">
            <Sparkles className="w-4 h-4" /> Housekeeping & Sanitization Desk
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
            Room Turn-Down & Housekeeping Console
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Manage room turnover, inspection standards, linen replenishment, and file operational reports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Sub Tab Switcher */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 text-xs">
            {[
              { id: 'tasks', label: 'Cleaning Queue', icon: Sparkles },
              { id: 'rooms', label: 'Room Status Board', icon: BedDouble },
              { id: 'reports', label: 'Reports Log', icon: FileText }
            ].map(t => {
              const Icon = t.icon;
              const isSel = (parentActiveTab === 'dashboard' || !parentActiveTab) ? internalTab === t.id : activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setInternalTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    isSel ? 'bg-amber-400 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowReportModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> File Housekeeping Report
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Pending Turnover Tasks</span>
          <span className="text-3xl font-serif font-bold text-amber-400">{pendingTasks.length}</span>
          <span className="text-[11px] text-stone-400 block">Rooms needing sanitization</span>
        </div>
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Turnovers Completed</span>
          <span className="text-3xl font-serif font-bold text-emerald-400">{completedTasks.length}</span>
          <span className="text-[11px] text-stone-400 block">Inspected & ready suites</span>
        </div>
        <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
          <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Housekeeping Reports</span>
          <span className="text-3xl font-serif font-bold text-sky-400">{reports.length}</span>
          <span className="text-[11px] text-stone-400 block">Logged incidents & turnovers</span>
        </div>
      </div>

      {/* --- TAB 1: CLEANING WORK ORDERS QUEUE --- */}
      {(activeTab === 'tasks' || activeTab === 'dashboard') && (
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-400" /> Active Cleaning Work Orders
          </h3>

          {tasks.length === 0 ? (
            <div className="bg-stone-900/80 border border-stone-800 p-10 rounded-3xl text-center text-stone-500 text-xs">
              No active cleaning tasks assigned. All hotel suites have passed inspection and are spotless!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map(task => (
                <div key={task._id} className="bg-stone-900/90 border border-stone-800 rounded-3xl p-5 space-y-3 shadow-lg flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-lg text-stone-100">
                        Room #{task.room?.roomNumber}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        task.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                        'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      }`}>
                        {task.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400">{task.room?.roomType?.name || 'Suite'}</span>
                      <span className="text-[10px] bg-stone-950 px-2 py-0.5 rounded-full text-stone-400 font-mono border border-stone-800">
                        Floor {task.room?.floor || 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        task.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-stone-950 text-stone-400 border-stone-800'
                      }`}>
                        {task.priority || 'Normal'} Priority
                      </span>
                    </div>

                    <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 text-xs text-stone-300">
                      <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Turnover Instructions</span>
                      <p>{task.notes || 'Post check-out deep sanitization, fresh Egyptian linen replacement, and bathroom replenishment.'}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-800">
                    {task.status !== 'Completed' ? (
                      <button
                        onClick={() => handleMarkCleaned(task._id)}
                        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 text-stone-950 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Mark Cleaned & Ready (Available)
                      </button>
                    ) : (
                      <div className="text-center py-1 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1">
                        <Check className="w-4 h-4" /> Inspected & Available
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: ROOM STATUS BOARD --- */}
      {activeTab === 'rooms' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-amber-400" /> Physical Room Status Board
              </h3>
              <p className="text-xs text-stone-400">Live operational condition of all hotel inventory units.</p>
            </div>
            <button
              onClick={fetchHousekeepingData}
              className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {rooms.map(room => (
              <div 
                key={room._id}
                className={`p-4 rounded-2xl border text-center space-y-1.5 transition ${
                  room.status === 'Available' ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' :
                  room.status === 'Occupied' ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' :
                  room.status === 'Cleaning' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' :
                  room.status === 'Reserved' ? 'bg-blue-950/30 border-blue-500/40 text-blue-300' :
                  'bg-purple-950/30 border-purple-500/40 text-purple-300'
                }`}
              >
                <span className="font-mono font-extrabold text-base block text-stone-100">#{room.roomNumber}</span>
                <span className="text-[10px] block truncate font-medium text-stone-300">{room.roomType?.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block py-0.5 rounded-full bg-stone-950/60">
                  {room.status}
                </span>
                <span className="text-[10px] font-mono text-stone-400 block">Floor {room.floor || 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: HOUSEKEEPING REPORTS LOG --- */}
      {activeTab === 'reports' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" /> Housekeeping Reports Log ({reports.length})
              </h3>
              <p className="text-xs text-stone-400">Official log of room turn-down, damages, missing items, and maintenance issues.</p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> File New Report
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Room</th>
                  <th className="p-3.5">Incident / Report Type</th>
                  <th className="p-3.5">Observations / Notes</th>
                  <th className="p-3.5">Reported By</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Resolution</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {reports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-stone-500 italic">
                      No housekeeping reports on record.
                    </td>
                  </tr>
                ) : (
                  reports.map(r => (
                    <tr key={r._id} className="hover:bg-stone-800/30 transition">
                      <td className="p-3.5 font-mono font-bold text-stone-100">
                        Room {r.roomId?.roomNumber || '—'}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          r.reportType === 'Damaged' || r.reportType === 'Maintenance Issue' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                          r.reportType === 'Needs Cleaning' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          r.reportType === 'Cleaning Completed' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                          'bg-blue-500/15 text-blue-300 border-blue-500/30'
                        }`}>
                          {r.reportType}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-300 max-w-xs">{r.notes}</td>
                      <td className="p-3.5 text-stone-400">{r.reportedBy?.name || 'Housekeeping'}</td>
                      <td className="p-3.5 text-stone-500 font-mono">
                        {new Date(r.createdAt).toLocaleString()}
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          r.status === 'Resolved' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                          r.status === 'In Progress' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                          'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-stone-400 italic">
                        {r.resolution ? (
                          <span className="text-emerald-400 text-[11px] font-semibold">
                            {r.resolution} ({r.resolvedBy?.name || 'Admin'})
                          </span>
                        ) : (
                          <span className="text-stone-500 text-[11px]">Pending review</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL: FILE HOUSEKEEPING REPORT --- */}
      {showReportModal && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">
            <h3 className="font-serif font-bold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> File Housekeeping Report
            </h3>
            <p className="text-xs text-stone-400">
              Submit an official report regarding room hygiene, damages, missing inventory, or maintenance needs.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Select Room Unit</label>
                <select
                  value={reportForm.roomId}
                  onChange={e => setReportForm({ ...reportForm, roomId: e.target.value })}
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Choose Room...</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id}>Room #{r.roomNumber} - {r.roomType?.name} ({r.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Report Classification</label>
                <select
                  value={reportForm.reportType}
                  onChange={e => setReportForm({ ...reportForm, reportType: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="Damaged">Damaged (Broken fixture, mirror, appliance)</option>
                  <option value="Missing Item">Missing Item (Towel, hair dryer, glassware)</option>
                  <option value="Needs Cleaning">Needs Cleaning (Turnover required)</option>
                  <option value="Cleaning Completed">Cleaning Completed (Ready for inspection)</option>
                  <option value="Maintenance Issue">Maintenance Issue (AC, plumbing, electrical)</option>
                  <option value="Room Not Ready">Room Not Ready (Extended clean)</option>
                  <option value="Other">Other Observation</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Report Notes / Observations</label>
                <textarea
                  value={reportForm.notes}
                  onChange={e => setReportForm({ ...reportForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Provide precise details for the executive management team..."
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowReportModal(false)} 
                  className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold cursor-pointer hover:bg-stone-700 transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg cursor-pointer hover:brightness-110 transition"
                >
                  Submit Housekeeping Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
