import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown, LogOut, Phone, Shield, Sparkles, BedDouble, Calendar, UserCheck } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => data && setSettings(data))
      .catch(() => {});
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getRoleDashboardPath = (role) => {
    switch (role) {
      case 'Admin': return '/admin/dashboard';
      case 'Manager': return '/manager/dashboard';
      case 'Receptionist': return '/reception/dashboard';
      case 'Housekeeping': return '/housekeeping/dashboard';
      case 'Maintenance': return '/maintenance/dashboard';
      default: return '/guest/portal';
    }
  };

  const getRoleBadgeLabel = (role) => {
    switch (role) {
      case 'Admin': return 'Admin Command';
      case 'Manager': return 'Executive Hub';
      case 'Receptionist': return 'Front Desk';
      case 'Housekeeping': return 'Housekeeping';
      case 'Maintenance': return 'Maintenance';
      default: return 'VIP Guest Folio';
    }
  };

  return (
    <header className="h-20 bg-white border-b border-[#D6E6EF] px-4 sm:px-8 md:px-12 flex items-center justify-between sticky top-0 z-50 select-none shadow-sm transition-all overflow-hidden">

      {/* LEFT: Phone / Concierge Contact Information */}
      <div className="hidden lg:flex items-center gap-3 text-left">
        <div className="w-8 h-8 rounded-full border border-[#D6E6EF] bg-[#D6E6EF] flex items-center justify-center text-[#2A3E4B]">
          <Phone className="w-3.5 h-3.5" />
        </div>

        <div>
     <a
  href={`tel:${settings?.hotelPhone || '+18005555898'}`}
  className="text-xs font-semibold text-[#2A3E4B] tracking-wider hover:text-[#7FA6B8] transition block font-mono"
>
  {settings?.hotelPhone || '+1 (800) 555-LUXURY'}
</a>

          <span className="text-[10px] text-[#7FA6B8] tracking-widest uppercase block font-serif">
            24/7 Sovereign Concierge
          </span>
        </div>
      </div>

      {/* CENTER: Elegant Crest & Aurelia Sanctuary Brand Identity */}
      <Link to="/" className="flex flex-col items-center group mx-auto lg:mx-0">
        <div className="flex items-center gap-2.5">

          <div className="w-8 h-8 rounded-full border border-[#7FA6B8] p-1 flex items-center justify-center bg-[#D6E6EF] group-hover:scale-105 transition-transform">
            <Crown className="w-4 h-4 text-[#2A3E4B]" />
          </div>

          <div className="text-center">
            <span className="font-cinzel font-bold text-base sm:text-lg tracking-[0.25em] text-[#2A3E4B] group-hover:text-[#7FA6B8]">
              AURELIA
            </span>

            <span className="text-xs sm:text-sm font-serif italic text-[#7FA6B8] ml-2 tracking-widest font-normal">
              SANCTUARY
            </span>
          </div>
        </div>

        <span className="text-[8px] uppercase tracking-[0.3em] text-[#2A3E4B]/55 font-mono -mt-0.5">
          Resort & Ocean Suites
        </span>
      </Link>

      {/* RIGHT: Navigation & Role Management Actions */}
      <div className="flex items-center gap-2 sm:gap-6 min-w-0 max-w-[48vw]">

        <nav className="hidden xl:flex items-center gap-6 text-xs uppercase tracking-widest font-serif text-[#2A3E4B]/70">

          <Link
            to="/"
            className={`hover:text-[#7FA6B8] transition ${
              location.pathname === '/'
                ? 'text-[#7FA6B8] font-semibold'
                : ''
            }`}
          >
            Sanctuary
          </Link>

          <a
            href="/#suites-section"
            className="hover:text-[#7FA6B8] transition"
          >
            Suites & Villas
          </a>

          <a
            href="/#experience-section"
            className="hover:text-[#7FA6B8] transition"
          >
            Gastronomy & Spa
          </a>
        </nav>

        {user ? (
          <div className="flex items-center gap-3">

            {/* Role Workspace Capsule */}
            <Link
              to={getRoleDashboardPath(user.role)}
              className="flex items-center gap-2.5 bg-[#2A3E4B] hover:bg-[#7FA6B8] p-1.5 pr-3 rounded-full border border-[#7FA6B8]/40 transition group shadow-sm"
              title="Open Role Workspace"
            >

              <div className="w-7 h-7 rounded-full bg-[#D6E6EF] border border-[#7FA6B8] flex items-center justify-center text-xs font-serif font-bold text-[#2A3E4B]">
                {user.name?.charAt(0) || 'U'}
              </div>

              <div className="text-left hidden sm:block min-w-0">

                <span className="text-[11px] font-bold block text-white font-serif leading-none truncate max-w-[100px]">
                  {user.name?.split(' ')[0]}
                </span>

                <span className="text-[9px] text-[#D6E6EF] font-mono uppercase tracking-wider block mt-0.5">
                  {getRoleBadgeLabel(user.role)}
                </span>

              </div>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-8 h-8 rounded-full bg-[#D6E6EF] hover:bg-[#2A3E4B] text-[#2A3E4B] hover:text-white flex items-center justify-center transition border border-[#7FA6B8]/40 hover:border-[#2A3E4B] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>

          </div>
        ) : (
          <div className="flex items-center gap-3">

            <Link
              to="/login"
              className="text-xs uppercase tracking-widest font-serif font-semibold text-[#2A3E4B]/80 hover:text-[#7FA6B8] transition px-2 py-1"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="px-4 py-2 bg-[#7FA6B8] hover:bg-[#2A3E4B] text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-md shadow-[#7FA6B8]/20 transition cursor-pointer"
            >
              Register
            </Link>

          </div>
        )}

      </div>
    </header>
  );
}
