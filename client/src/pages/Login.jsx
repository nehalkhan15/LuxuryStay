import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser?.role === 'Admin') {
        navigate('/admin/dashboard');
      } else if (loggedUser?.role === 'Manager') {
        navigate('/manager/dashboard');
      } else if (loggedUser?.role === 'Receptionist') {
        navigate('/reception/dashboard');
      } else if (loggedUser?.role === 'Housekeeping') {
        navigate('/housekeeping/dashboard');
      } else {
        navigate('/guest/portal');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col justify-center items-center p-6 relative overflow-hidden selection:bg-luxury-blue-light selection:text-luxury-navy">
      {/* Ambient background glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-luxury-blue-light/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-luxury-blue/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-white border border-luxury-blue-light rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(42,62,75,0.12)] z-10 space-y-6">
        {/* Header Logo */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block group">
            <div className="w-14 h-14 rounded-2xl bg-luxury-blue-light p-[1.5px] mx-auto flex items-center justify-center mb-3 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-luxury-navy" />
              </div>
            </div>
          </Link>
          <div className="text-xs uppercase tracking-[0.3em] font-serif text-luxury-blue font-semibold">
            Aurelia Sanctuary
          </div>
          <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-luxury-navy tracking-widest">
            AUTHENTICATION
          </h1>
          <p className="text-[11px] text-stone-400 font-medium tracking-wide">
            Enterprise Portal & Guest Reservation Suite
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-300 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@hotel.com"
                required
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-3 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-3 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#7FA6B8] hover:bg-[#2A3E4B] text-white hover:bg-luxury-blue text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 mt-2 cursor-pointer"
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-stone-400 pt-2 border-t border-stone-800/80">
          <Link to="/" className="hover:text-[#D4AF37] transition">&larr; Return to Sanctuary</Link>
          <Link to="/register" className="text-luxury-blue font-bold hover:underline">
            Register Guest Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
