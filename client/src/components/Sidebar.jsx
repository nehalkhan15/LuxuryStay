import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Users, BedDouble, CalendarCheck, FileText, 
  Sparkles, Wrench, Star, Settings, ChevronRight, TrendingUp, 
  ConciergeBell, Megaphone, Compass, Layers, ShieldCheck, CreditCard
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user } = useAuth();
  const role = user?.role || 'Guest';

  const getMenuItems = () => {
    switch (role) {
      case 'Admin':
        return [
          { id: 'dashboard', label: 'Admin Command', icon: LayoutDashboard },
          { id: 'users', label: 'Staff Management', icon: Users },
          { id: 'rooms', label: 'Room Directory', icon: BedDouble },
          { id: 'services', label: 'Services Catalog', icon: ConciergeBell },
          { id: 'promotions', label: 'Promotions & Events', icon: Megaphone },
          { id: 'amenities', label: 'Resort Amenities', icon: Compass },
          { id: 'analytics', label: 'Revenue Analytics', icon: TrendingUp },
          { id: 'settings', label: 'Hotel Policies & Tax', icon: Settings }
        ];

      case 'Manager':
        return [
          { id: 'dashboard', label: 'Executive Hub', icon: LayoutDashboard },
          { id: 'analytics', label: 'Revenue & Occupancy', icon: TrendingUp },
          { id: 'reservations', label: 'Live Bookings', icon: CalendarCheck },
          { id: 'rooms', label: 'Room Matrix', icon: BedDouble },
          { id: 'housekeeping', label: 'Housekeeping Desk', icon: Sparkles },
          { id: 'maintenance', label: 'Maintenance Hub', icon: Wrench },
          { id: 'feedback', label: 'Guest Reviews & Ratings', icon: Star }
        ];

      case 'Receptionist':
        return [
          { id: 'dashboard', label: 'Front Desk Console', icon: LayoutDashboard },
          { id: 'checkin', label: 'Check-In / Out Terminal', icon: CalendarCheck },
          { id: 'reservations', label: 'Create & Manage Bookings', icon: CalendarCheck },
          { id: 'grid', label: 'Live Room Matrix', icon: BedDouble },
          { id: 'billing', label: 'Folio & Invoicing Desk', icon: CreditCard },
          { id: 'services', label: 'Guest Service Orders', icon: ConciergeBell },
          { id: 'guests', label: 'Guest Directory & VIPs', icon: Users }
        ];

      case 'Housekeeping':
        return [
          { id: 'dashboard', label: 'Cleaning Work Queue', icon: Sparkles },
          { id: 'rooms', label: 'Room Status Board', icon: BedDouble },
          { id: 'reports', label: 'Housekeeping Reports', icon: FileText }
        ];

      case 'Maintenance':
        return [
          { id: 'dashboard', label: 'Repair Work Orders', icon: Wrench },
          { id: 'report_maintenance', label: 'Log New Issue', icon: Wrench }
        ];

      case 'Guest':
      default:
        return [
          { id: 'dashboard', label: 'Guest Resort Portal', icon: LayoutDashboard },
          { id: 'search', label: 'Book a Luxury Suite', icon: BedDouble },
          { id: 'my_bookings', label: 'My Reservations', icon: CalendarCheck },
          { id: 'order_services', label: 'In-Room Services Menu', icon: ConciergeBell },
          { id: 'amenities', label: 'Resort Amenities Guide', icon: Compass },
          { id: 'promotions', label: 'Events & Experiences', icon: Megaphone },
          { id: 'my_invoices', label: 'Digital Folio & Invoices', icon: FileText },
          { id: 'feedback', label: 'Ratings & Reviews', icon: Star }
        ];
    }
  };

  const menuItems = getMenuItems();

  return (
    <aside className="w-64 bg-stone-950/95 border-r border-stone-800/80 text-stone-200 flex flex-col h-[calc(100vh-5rem)] sticky top-20 select-none shrink-0 shadow-2xl backdrop-blur-md">
      {/* Workspace Role Header */}
      <div className="p-5 border-b border-stone-800/80">
        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400/80 block font-mono">WORKSPACE</span>
        <h3 className="font-serif font-bold text-base text-stone-100 mt-1 flex items-center gap-2">
          {role} Workspace
        </h3>
      </div>

      {/* Navigation List */}
      <nav className="p-3 space-y-1.5 flex-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/5 text-amber-300 border border-amber-500/30 font-bold shadow-sm'
                  : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-xl transition ${isActive ? 'bg-amber-400 text-stone-950 shadow-sm' : 'bg-stone-900 text-stone-400 group-hover:text-amber-400'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
            </button>
          );
        })}
      </nav>

      {/* Footer Branding */}
      <div className="p-4 border-t border-stone-800/80 bg-stone-950/60 text-[11px] text-stone-400">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-cinzel font-bold text-stone-200 text-xs">LUXURYSTAY</p>
            <p className="text-[10px] text-amber-400/80 font-mono">Version 2.0 • Ultra-HMS</p>
          </div>
          <ShieldCheck className="w-5 h-5 text-amber-400/60" />
        </div>
      </div>
    </aside>
  );
}
