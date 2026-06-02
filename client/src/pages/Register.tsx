import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  User, 
  School, 
  AlertCircle, 
  ArrowRight, 
  Eye,
  EyeOff,
  Link as LinkIcon,
  Wallet
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    college: '',
    upiId: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register(formData);
      toast.success('Account created successfully! 🎉');
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create account.');
      toast.error('Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1d] text-[#e0e5fb] selection:bg-[#bd9dff] selection:text-[#2e006c] font-['Inter'] relative overflow-hidden">
      {/* Top Navigation Anchor / Branding */}
      <header className="fixed top-0 w-full z-50 bg-slate-950/20 backdrop-blur-xl h-16 flex items-center justify-center px-6 max-w-md mx-auto left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-2">
          <Wallet className="text-[#bd9dff]" size={24} strokeWidth={2.5} />
          <h1 className="text-xl font-black tracking-tighter text-[#bd9dff] drop-shadow-[0_0_8px_rgba(189,157,255,0.4)] uppercase italic">PaisaTrack</h1>
        </div>
      </header>

      {/* Main Content Canvas */}
      <main className="min-h-screen flex flex-col justify-center px-6 pt-24 pb-12 max-w-md mx-auto relative z-10 font-['Inter']">
        {/* Welcome Section */}
        <section className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#1d253b] text-[#bd9dff] text-xs font-bold tracking-widest uppercase mb-4">
            <span className="text-[14px]">✦</span>
            <span>The Intelligent Glow</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter mb-2 text-white italic uppercase">Create Account</h2>
          <p className="text-[#a5aabf] font-medium leading-relaxed uppercase text-[10px] tracking-widest opacity-60">Start your premium financial journey 💸</p>
        </section>

        {/* Registration Form */}
        <div className="bg-[rgba(29,37,59,0.6)] backdrop-filter backdrop-blur-[16px] border border-[rgba(111,117,136,0.2)] rounded-lg p-8 shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Group: Full Name */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] ml-1">Full Name</label>
              <div className="relative group flex items-center">
                <div className="absolute left-4 flex items-center justify-center">
                    <User className="text-[#a5aabf]/50 group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                </div>
                <input 
                  className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-4 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all outline-none text-sm font-medium" 
                  placeholder="Arjun Sharma" 
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Form Group: Email */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] ml-1">College Email</label>
              <div className="relative group flex items-center">
                <div className="absolute left-4 flex items-center justify-center">
                    <Mail className="text-[#a5aabf]/50 group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                </div>
                <input 
                  className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-4 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all outline-none text-sm font-medium" 
                  placeholder="arjun@iit.edu" 
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Form Group: Password */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] ml-1">Secure Password</label>
              <div className="relative group flex items-center">
                <div className="absolute left-4 flex items-center justify-center">
                    <Lock className="text-[#a5aabf]/50 group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                </div>
                <input 
                  className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-12 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all outline-none text-sm font-medium" 
                  placeholder="••••••••" 
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
                <button 
                  className="absolute right-4 flex items-center justify-center text-[#a5aabf]/50 hover:text-[#bd9dff] transition-colors"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* College & UPI (Side-by-side cleanly fix) */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] ml-1">College <span className="opacity-30 invisible md:visible">(Opt)</span></label>
                <div className="relative group flex items-center">
                  <div className="absolute left-3 flex items-center justify-center">
                      <School className="text-[#a5aabf]/50 group-focus-within:text-[#bd9dff] transition-colors" size={16} />
                  </div>
                  <input 
                    className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-10 pr-2 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all outline-none text-[12px] font-medium" 
                    placeholder="IIT Bombay" 
                    type="text"
                    name="college"
                    value={formData.college}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] ml-1">UPI ID <span className="opacity-30 invisible md:visible">(Opt)</span></label>
                <div className="relative group flex items-center">
                  <div className="absolute left-3 flex items-center justify-center">
                      <LinkIcon className="text-[#a5aabf]/50 group-focus-within:text-[#bd9dff] transition-colors" size={16} />
                  </div>
                  <input 
                    className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-10 pr-2 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all outline-none text-[12px] font-medium" 
                    placeholder="arjun@okaxis" 
                    type="text"
                    name="upiId"
                    value={formData.upiId}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/10 border border-red-500/20 p-3 rounded-md flex items-center gap-3 text-red-400 text-xs font-semibold"
              >
                <AlertCircle size={16} className="flex-shrink-0" />
                <p>{error}</p>
              </motion.div>
            )}

            {/* Sign Up Button */}
            <button 
              className="w-full py-4 rounded-full bg-gradient-to-br from-[#8a4cfc] to-[#bd9dff] text-[#2e006c] font-black text-sm uppercase italic tracking-tighter shadow-[0_8px_24px_rgba(189,157,255,0.25)] hover:shadow-[0_12px_32px_rgba(189,157,255,0.4)] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#2e006c] border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Secondary Actions */}
        <div className="mt-8 text-center space-y-6">
          <p className="text-[#a5aabf] text-sm uppercase tracking-widest font-black text-[10px]">
            Already have an account? 
            <Link to="/login" className="text-[#bd9dff] font-black hover:underline underline-offset-8 ml-3 transition-all decoration-[#8a4cfc]">Login</Link>
          </p>
          <div className="pt-6 flex flex-col items-center gap-6">
            <span className="h-[1px] w-12 bg-[#424859]/30"></span>
            <div className="flex gap-6">
              <div className="w-12 h-12 rounded-full bg-[rgba(29,37,59,0.6)] backdrop-filter backdrop-blur-[16px] border border-[rgba(111,117,136,0.2)] flex items-center justify-center hover:bg-[#1d253b] cursor-pointer transition-colors group shadow-xl">
                <img alt="Google" className="w-5 h-5 grayscale group-hover:grayscale-0 transition-all opacity-40 group-hover:opacity-100" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBYxGo6WTUsn-RtZ9ApQJ6n1-_rVwA90RMsCbLkSRyWtN4l1RcID8KYrhqEmV4ypks9Y2QHpItBXJo6B6mLoKMdHZ7SilmvWR_ZEFwghC1p4Yz2hB5Wib79kyuf2JhR3eMJAdgK7TfAsukHrZRPzvsO_bK1OAj3wz6m4zxYiqp1618P23oV2_emYC5uSOEWny6V7SGm3X6039i76ONr2xNJvUBk7WGxomTbClYMvqpNbjm11TkOI-T1BRZWBjlA--WXbAV6erU8_e8"/>
              </div>
              <div className="w-12 h-12 rounded-full bg-[rgba(29,37,59,0.6)] backdrop-filter backdrop-blur-[16px] border border-[rgba(111,117,136,0.2)] flex items-center justify-center hover:bg-[#1d253b] cursor-pointer transition-colors shadow-xl">
                <span className="text-[#e0e5fb] font-bold">🍎</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Visual Accents (Ethereal Glows) */}
      <div className="fixed top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#bd9dff]/10 blur-[130px] pointer-events-none -z-10 animate-pulse-slow"></div>
      <div className="fixed bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#69f6b8]/5 blur-[150px] pointer-events-none -z-10 animate-pulse-slow"></div>

      {/* Decorative Side-Panel (Desktop Only) */}
      <div className="hidden lg:block fixed right-12 top-1/2 -translate-y-1/2 w-80 h-[550px] bg-[rgba(29,37,59,0.6)] backdrop-filter backdrop-blur-[16px] border border-[#424859]/20 rounded-xl overflow-hidden shadow-2xl p-2 z-20 group">
        <div className="w-full h-full rounded-lg overflow-hidden relative">
          <img 
            className="w-full h-full object-cover grayscale-[0.2] opacity-50 group-hover:grayscale-0 group-hover:opacity-75 group-hover:scale-105 transition-all duration-1000" 
            src="/assets/register-bg.png" 
            alt="PaisaTrack Flow"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1d] to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8">
            <div className="text-[#bd9dff] font-black text-3xl tracking-tighter mb-2 italic uppercase">Track Smarter.</div>
            <p className="text-xs text-[#a5aabf] font-medium leading-relaxed uppercase tracking-widest opacity-60">Join 50k+ students managing their finances with editorial precision and zero stress.</p>
          </div>
        </div>
      </div>

      {/* Decorative Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
    </div>
  );
};

export default Register;