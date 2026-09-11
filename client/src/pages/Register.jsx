import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Crown, Lock, Mail, User, Phone, ArrowRight } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password, phone);
      navigate('/user/profile');
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col justify-center items-center p-6 relative overflow-hidden selection:bg-luxury-blue-light selection:text-luxury-navy">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-luxury-blue-light/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-luxury-blue/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-lg bg-white border border-luxury-blue-light rounded-3xl p-8 sm:p-10 shadow-[0_20px_50px_rgba(42,62,75,0.12)] z-10 space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-14 h-14 rounded-3xl bg-luxury-blue-light p-[2px] shadow-xl shadow-[#7FA6B8]/20 mx-auto flex items-center justify-center mb-3">
              <div className="w-full h-full bg-white rounded-[22px] flex items-center justify-center">
                <Crown className="w-7 h-7 text-luxury-navy" />
              </div>
            </div>
          </Link>

          <h1 className="text-2xl font-cinzel font-bold text-luxury-navy tracking-widest">
            JOIN LUXURY<span className="text-luxury-blue font-serif">STAY</span>
          </h1>

          <p className="text-[11px] text-[#2A3E4B]/70 font-semibold tracking-widest uppercase font-mono">
            Create Your Exclusive Guest Profile
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-medium flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#2A3E4B] mb-1">
              Full Legal Name
            </label>

            <div className="relative">
              <User className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3" />

              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lord Julian Vance"
                required
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-2.5 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A3E4B] mb-1">
              Email Address
            </label>

            <div className="relative">
              <Mail className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3" />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guest@hotel.com"
                required
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-2.5 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A3E4B] mb-1">
              Direct Phone / Mobile
            </label>

            <div className="relative">
              <Phone className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3" />

              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 0100"
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-2.5 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#2A3E4B] mb-1">
              Secure Password
            </label>

            <div className="relative">
              <Lock className="w-4 h-4 text-luxury-blue absolute left-3.5 top-3" />

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white border border-luxury-blue-light rounded-2xl py-2.5 pl-10 pr-4 text-xs text-luxury-navy placeholder-[#78909C] focus:outline-none focus:border-luxury-blue transition"
              />
            </div>
          </div>

<button
  type="submit"
  disabled={loading}
  className="w-full py-3.5 bg-[#7FA6B8] hover:bg-[#2A3E4B] text-[#2A3E4B] hover:text-white font-bold rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl shadow-[#7FA6B8]/20 transition-colors duration-200 disabled:opacity-50 mt-2"
>
  {loading ? 'Registering...' : 'Complete Guest Registration'}
  <ArrowRight className="w-4 h-4" />
</button>
        </form>

        <div className="flex items-center justify-between text-xs text-[#2A3E4B]/70 pt-2 border-t border-[#D6E6EF]">
          <Link
            to="/"
            className="hover:text-[#7FA6B8] transition"
          >
            &larr; Back to Home
          </Link>

          <Link
            to="/login"
            className="text-luxury-blue font-bold hover:underline"
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

