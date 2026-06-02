import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Lock, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  TrendingUp,
  Phone,
  UserCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/axios';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously, 
  signInWithPhoneNumber, 
  RecaptchaVerifier,
  ConfirmationResult
} from 'firebase/auth';

const Login: React.FC = () => {
  const [authMode, setAuthMode] = useState<'email' | 'phone'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSuccessfulLogin = async (result: any) => {
    const user = result.user;
    const fallbackEmail = user.email || `${user.uid}@guest.com`;
    const fallbackName = user.displayName || (authMode === 'phone' ? user.phoneNumber : "Guest User");

    try {
      const { data } = await api.post('/auth/login', {
        email: fallbackEmail,
        password: user.uid
      });
      
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      window.dispatchEvent(new Event('auth-sync'));
      
      toast.success("Welcome back! 🚀");
      setTimeout(() => { window.location.href = '/dashboard'; }, 500);

    } catch (backendError: any) {
      try {
        const { data } = await api.post('/auth/register', {
          name: fallbackName,
          email: fallbackEmail,
          password: user.uid
        });

        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        window.dispatchEvent(new Event('auth-sync'));
        
        toast.success("Welcome to PaisaTrack! 🎉");
        setTimeout(() => { window.location.href = '/onboarding'; }, 500);
      } catch (regError) {
        toast.error("Server connection failed. Please check backend.");
        setLoading(false);
      }
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      await handleSuccessfulLogin(result);
    } catch (err: any) {
      setError(err.message || 'Failed to login with email.');
      setLoading(false);
    }
  };

  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible'
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return setError('Please enter a phone number');
    setError('');
    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = (window as any).recaptchaVerifier;
      const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
      toast.success('OTP sent successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP.');
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear();
        (window as any).recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !confirmationResult) return;
    setError('');
    setLoading(true);
    try {
      const result = await confirmationResult.confirm(otp);
      await handleSuccessfulLogin(result);
    } catch (err: any) {
      setError(err.message || 'Invalid OTP.');
      setLoading(false);
    }
  };

  // 🔥 ABSOLUTE NATIVE BYPASS: No async/await gap, no preventDefault
  const handleGoogleLogin = () => {
    // Ye line turant execute hogi jisse browser block nahi karega
    signInWithPopup(auth, googleProvider)
      .then((result) => {
        setLoading(true); 
        handleSuccessfulLogin(result);
      })
      .catch((error: any) => {
        console.error("Google Auth Error:", error);
        if (error.code === 'auth/popup-blocked') {
          toast.error("Bhai, browser sach me adiyal ho gaya hai. Please URL bar se Pop-up explicitly allow kar de.", { duration: 5000 });
        } else if (error.code !== 'auth/popup-closed-by-user') {
          toast.error(`Login failed: ${error.message}`);
        }
        setLoading(false);
      });
  };

  const handleAnonymousLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signInAnonymously(auth);
      await handleSuccessfulLogin(result);
    } catch (err: any) {
      toast.error(err.message || 'Anonymous login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080e1d] text-[#e0e5fb] flex flex-col items-center justify-center p-6 relative overflow-hidden font-['Inter']">
      <div id="recaptcha-container"></div>
      
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#bd9dff]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#69f6b8]/5 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.main 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-md z-10 flex flex-col items-center"
      >
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-6 bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] rounded-lg shadow-2xl">
            <span className="text-4xl text-[#bd9dff]">
              <TrendingUp size={40} strokeWidth={2.5} />
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-[#bd9dff] drop-shadow-[0_0_8px_rgba(189,157,255,0.4)] mb-2 uppercase italic">PaisaTrack</h1>
          <p className="text-[#a5aabf] font-medium uppercase tracking-widest text-xs">Welcome Back</p>
        </header>

        <div className="w-full bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[1px] bg-white/10 shadow-[0_1px_10px_rgba(255,255,255,0.1)]"></div>
          
          <div className="flex bg-[#0c1324] p-1 rounded-md mb-6 border border-white/5">
            <button 
              onClick={() => { setAuthMode('email'); setError(''); setConfirmationResult(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${authMode === 'email' ? 'bg-[rgba(29,37,59,0.8)] text-white shadow-sm' : 'text-[#a5aabf] hover:text-white'}`}
            >
              Email
            </button>
            <button 
              onClick={() => { setAuthMode('phone'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded transition-all ${authMode === 'phone' ? 'bg-[rgba(29,37,59,0.8)] text-white shadow-sm' : 'text-[#a5aabf] hover:text-white'}`}
            >
              Phone
            </button>
          </div>

          <AnimatePresence mode="wait">
            {authMode === 'email' ? (
              <motion.form 
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleEmailLogin} 
                className="space-y-6"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] px-1" htmlFor="email">Email</label>
                  <div className="relative group flex items-center">
                    <div className="absolute left-4 flex items-center justify-center">
                       <Mail className="text-[#a5aabf] group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                    </div>
                    <input 
                      className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-4 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all text-sm font-medium outline-none" 
                      id="email" 
                      placeholder="your.name@student.in" 
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end px-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf]" htmlFor="password">Password</label>
                  </div>
                  <div className="relative group flex items-center">
                    <div className="absolute left-4 flex items-center justify-center">
                       <Lock className="text-[#a5aabf] group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                    </div>
                    <input 
                      className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-12 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all text-sm font-medium outline-none" 
                      id="password" 
                      placeholder="••••••••" 
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button 
                      className="absolute right-4 flex items-center justify-center text-[#a5aabf] hover:text-[#bd9dff] transition-colors" 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 p-3 rounded-md flex items-center gap-3 text-red-400 text-xs font-semibold">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <div className="pt-2">
                  <button 
                    className="w-full bg-gradient-to-br from-[#8a4cfc] to-[#bd9dff] text-[#2e006c] font-black py-4 rounded-full shadow-[0_8px_24px_rgba(189,157,255,0.15)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase italic tracking-tighter text-sm disabled:opacity-50" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-[#2e006c] border-t-transparent rounded-full animate-spin" /> : <span>Login with Email</span>}
                  </button>
                </div>
              </motion.form>
            ) : (
              <motion.form 
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={confirmationResult ? handleVerifyOtp : handleSendOtp} 
                className="space-y-6"
              >
                {!confirmationResult ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] px-1" htmlFor="phone">Phone Number</label>
                    <div className="relative group flex items-center">
                      <div className="absolute left-4 flex items-center justify-center">
                         <Phone className="text-[#a5aabf] group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                      </div>
                      <input 
                        className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-4 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all text-sm font-medium outline-none" 
                        id="phone" 
                        placeholder="10-digit number" 
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] px-1" htmlFor="otp">One Time Password</label>
                    <div className="relative group flex items-center">
                      <div className="absolute left-4 flex items-center justify-center">
                         <Lock className="text-[#a5aabf] group-focus-within:text-[#bd9dff] transition-colors" size={20} />
                      </div>
                      <input 
                        className="w-full bg-[#0c1324] border-none rounded-md py-4 pl-12 pr-4 text-[#e0e5fb] placeholder:text-[#a5aabf]/30 focus:ring-2 focus:ring-[#bd9dff]/50 transition-all text-sm font-medium outline-none text-center tracking-[0.5em]" 
                        id="otp" 
                        placeholder="••••••" 
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}
                
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-500/10 border border-red-500/20 p-3 rounded-md flex items-center gap-3 text-red-400 text-xs font-semibold">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <p>{error}</p>
                  </motion.div>
                )}

                <div className="pt-2 flex gap-2">
                  {confirmationResult && (
                    <button 
                      type="button"
                      onClick={() => { setConfirmationResult(null); setOtp(''); }}
                      className="bg-[#0c1324] text-[#a5aabf] px-4 rounded-full text-xs font-bold uppercase hover:text-white transition-colors"
                    >
                      Back
                    </button>
                  )}
                  <button 
                    className="flex-1 bg-gradient-to-br from-[#8a4cfc] to-[#bd9dff] text-[#2e006c] font-black py-4 rounded-full shadow-[0_8px_24px_rgba(189,157,255,0.15)] hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 uppercase italic tracking-tighter text-sm disabled:opacity-50" 
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? <div className="w-5 h-5 border-2 border-[#2e006c] border-t-transparent rounded-full animate-spin" /> : <span>{confirmationResult ? 'Verify OTP' : 'Send OTP'}</span>}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-8 pt-8 border-t border-[#424859]/20">
            <p className="text-center text-[10px] font-bold uppercase tracking-widest text-[#a5aabf] mb-6">Or continue with</p>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={handleGoogleLogin} 
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] rounded-md hover:bg-[#1d253b] transition-colors group disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-[#bd9dff] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <img alt="Google" className="w-4 h-4 grayscale group-hover:grayscale-0 transition-all" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBaUxrQq8Lw7vVm57HYtlH6K6KvyyX0JzdxCtNLiX0ax7fnlkWvLtz685x6JjRzXlT8zOORhS_QyJ0xgKAGUSShnIekUKvwd3ZqdsuJ3JfdhBS5gY8QLkvKslg9Q1H7KQ38Lx6HRfvWSET-wtD18JUuoAIpZwe9VIPM2jleTb_Ig9ZdvQ1JvJiPAM1ZiY_LpOdYg8HberYj6i96Wn7ySARiMlVMBN8isQmPZhiNQbcNURj0cEy4qS98mdUTVFwgQdPn5VYBJiDS7zQ"/>
                    <span className="text-xs font-semibold">Google</span>
                  </>
                )}
              </button>
              <button 
                type="button"
                onClick={handleAnonymousLogin} 
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3 bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] rounded-md hover:bg-[#1d253b] transition-colors text-[#a5aabf] hover:text-white disabled:opacity-50 cursor-pointer"
              >
                <UserCircle size={16} />
                <span className="text-xs font-semibold uppercase tracking-widest">Guest</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-10">
          <p className="text-sm text-[#a5aabf]">
            Don't have an account? 
            <Link to="/register" className="text-[#bd9dff] font-bold hover:underline underline-offset-4 ml-1 transition-all">Register</Link>
          </p>
        </footer>

        <div className="mt-12 flex items-center gap-2 px-4 py-2 bg-[#0c1324] rounded-full">
          <ShieldCheck size={14} className="text-[#69f6b8]" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#a5aabf]/60 leading-none">Bank-grade 256-bit encryption</span>
        </div>
      </motion.main>

      <div className="hidden lg:block absolute right-[10%] top-[30%] w-64 bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] p-6 rounded-lg rotate-3 -z-0 opacity-40">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[#69f6b8]/20 flex items-center justify-center text-[#69f6b8]">
            <TrendingUp size={20} />
          </div>
          <div>
            <div className="w-20 h-2 bg-[#424859] rounded-full mb-1"></div>
            <div className="w-12 h-1.5 bg-[#424859]/50 rounded-full"></div>
          </div>
        </div>
        <div className="w-full h-24 rounded-md bg-[#0c1324] mb-4 flex items-end p-2 gap-1 overflow-hidden">
          <div className="w-1/6 h-[20%] bg-[#bd9dff]/20 rounded-t-sm animate-pulse"></div>
          <div className="w-1/6 h-[40%] bg-[#bd9dff]/30 rounded-t-sm animate-pulse delay-75"></div>
          <div className="w-1/6 h-[30%] bg-[#bd9dff]/20 rounded-t-sm animate-pulse delay-150"></div>
          <div className="w-1/6 h-[70%] bg-[#bd9dff]/60 rounded-t-sm animate-pulse delay-200"></div>
          <div className="w-1/6 h-[50%] bg-[#bd9dff]/40 rounded-t-sm animate-pulse delay-300"></div>
          <div className="w-1/6 h-[90%] bg-[#bd9dff] rounded-t-sm animate-pulse delay-500"></div>
        </div>
      </div>

      <div className="hidden lg:block absolute left-[8%] bottom-[20%] w-56 bg-[rgba(29,37,59,0.6)] backdrop-blur-[20px] border border-[rgba(111,117,136,0.2)] p-5 rounded-lg -rotate-6 -z-0 opacity-30 group hover:opacity-100 transition-opacity duration-700">
        <div className="w-full h-32 rounded-lg bg-[#000000] overflow-hidden flex items-center justify-center relative">
          <img 
            alt="Abstract gradient" 
            className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-1000" 
            src="/assets/login-bg.png"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080e1d] to-transparent"></div>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="w-24 h-3 bg-[#424859] rounded-full"></div>
          <div className="w-8 h-3 bg-[#ff716a]/40 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

export default Login;