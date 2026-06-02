import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Copy,
  Download,
  Moon,
  LogOut,
  CreditCard,
  GraduationCap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && true);
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data } = await api.get('/analytics/stats');
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Signed out successfully');
  };

  const [exportRange, setExportRange] = useState('30');
  const [exportType, setExportType] = useState('all');

  const handleExportCSV = async () => {
    try {
      const response = await api.get(`/transactions/export/csv?range=${exportRange}&type=${exportType}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `paisatrack_export_${exportRange}d_${exportType}.csv`);
      document.body.appendChild(link);
      link.click();
      toast.success('Report downloaded! 📊');
    } catch (err) {
      toast.error('Export failed');
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) {
      return toast.error("No UPI ID set. Add one in settings.");
    }
    navigator.clipboard.writeText(text);
    toast.success('UPI ID copied! 📋');
  };

  const handleUpgradeToast = () => {
    toast("Pro features coming soon! 🚀", { icon: 'ℹ️' });
  };

  if (loading && !stats) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-12 h-12 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const firstName = user?.name ? user.name.split(' ')[0] : 'User';

  return (
    <div className="min-h-screen pb-32 pt-2 w-full max-w-4xl mx-auto px-6 md:px-8 overflow-x-hidden font-['Inter']">
      {/* Top Header */}
      <nav className="flex justify-between items-center w-full py-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10">
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=bd9dff&color=000`} alt="User" />
          </div>
          <span className="text-[10px] font-medium text-[#bd9dff] tracking-widest uppercase">{firstName}'s Space</span>
        </div>
        <h1 className="text-xl font-black text-[#bd9dff] tracking-tight italic uppercase">PaisaTrack</h1>
        <button className="text-[#a5aabf] hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </nav>

      <main className="space-y-6">
        {/* User Avatar Info */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 rounded-[2rem] bg-[#131B2C] border border-white/10 flex items-center justify-center p-1 mb-4 shadow-lg relative">
            <div className="absolute inset-0 bg-[#bd9dff]/10 blur-xl rounded-full"></div>
            <img className="w-full h-full rounded-[1.5rem] object-cover relative z-10" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=bd9dff&color=000&size=150`} alt="Profile" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">{user?.name || 'User Name'}</h2>
          <p className="text-[10px] text-[#a5aabf] font-bold uppercase tracking-widest flex items-center gap-1 mt-1 opacity-80">
            <GraduationCap size={14} /> {user?.college || 'No college set'}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="space-y-4">
          <div className="bg-[#131B2C] border border-white/5 rounded-[1.5rem] p-6 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[#a5aabf] text-[10px] font-black uppercase tracking-widest mb-1">Total Tracked</p>
              <p className="text-3xl font-black text-[#bd9dff] tracking-tighter italic">₹{stats?.totalTracked?.toLocaleString() || '0'}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#bd9dff]/10 flex items-center justify-center shadow-inner">
               <CreditCard size={24} className="text-[#bd9dff]" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#131B2C] border border-white/5 rounded-[1.5rem] p-5 shadow-sm">
               <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-1">Longevity</p>
               <p className="text-xl font-black text-white tracking-tight mb-1">{stats?.monthsActive || '1'} Months</p>
               <p className="text-[9px] font-bold text-[#10B981]">Active Now</p>
            </div>
            <div className="bg-[#131B2C] border border-white/5 border-l-4 border-l-[#10B981] rounded-[1.5rem] p-5 shadow-sm">
               <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-1">Total Saved</p>
               <p className="text-xl font-black text-[#10B981] tracking-tight mb-2">₹{stats?.totalSaved?.toLocaleString() || '0'}</p>
               <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                  <div className="h-full bg-[#10B981] w-[60%] shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
               </div>
            </div>
          </div>
        </div>

        {/* Account Settings List */}
        <div className="mt-8 space-y-4">
          <h3 className="text-white font-bold text-sm flex items-center gap-2 mb-4">
             <Settings size={16} className="text-[#bd9dff]" /> Account Settings
          </h3>

          <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-white/5 flex items-center justify-center text-[#a5aabf]">
                   <CreditCard size={18} />
                </div>
                <div>
                   <p className="text-white text-xs font-bold">UPI ID</p>
                   <p className="text-[#a5aabf] text-[9px] mt-0.5">{user?.upiId || 'Not set'}</p>
                </div>
             </div>
             <button onClick={() => copyToClipboard(user?.upiId || '')} className="text-[#a5aabf] hover:text-white p-2 active:scale-90 transition-transform">
                <Copy size={16} />
             </button>
          </div>

          <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-white/5 flex items-center justify-center text-[#a5aabf]">
                   <Moon size={18} />
                </div>
                <div>
                   <p className="text-white text-xs font-bold">Dark Mode</p>
                   <p className="text-[#a5aabf] text-[9px] mt-0.5">Vibe checked</p>
                </div>
             </div>
             <div 
                onClick={toggleDarkMode}
                className={`w-12 h-6 rounded-full relative cursor-pointer shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-[#bd9dff]' : 'bg-[#0B1120] border border-white/10'}`}
              >
                 <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isDarkMode ? 'right-1' : 'left-1 opacity-50'}`}></div>
              </div>
          </div>

          <div className="bg-[#131B2C] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-sm">
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 rounded-xl bg-[#0B1120] border border-white/5 flex items-center justify-center text-[#a5aabf]">
                   <Download size={18} />
                </div>
                <div>
                   <p className="text-white text-xs font-bold">Financial Report</p>
                   <p className="text-[#a5aabf] text-[9px] mt-0.5">Export as CSV</p>
                </div>
             </div>
             <div className="flex gap-2">
                <select 
                  value={exportRange} 
                  onChange={(e) => setExportRange(e.target.value)}
                  className="bg-[#0B1120] border border-white/10 text-[#a5aabf] text-[10px] p-2 rounded flex-1 focus:outline-none"
                >
                  <option value="30">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>
                <select 
                  value={exportType} 
                  onChange={(e) => setExportType(e.target.value)}
                  className="bg-[#0B1120] border border-white/10 text-[#a5aabf] text-[10px] p-2 rounded flex-1 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="expense">Expenses Only</option>
                </select>
             </div>
             <button onClick={handleExportCSV} className="w-full mt-2 border border-[#bd9dff]/30 bg-[#bd9dff]/10 text-[#bd9dff] px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-[#bd9dff]/20 active:scale-95 transition-all">
                Download Report
             </button>
          </div>
        </div>

        {/* Pro Banner */}
        <div className="bg-[#bd9dff] rounded-[2rem] p-6 mt-8 shadow-[0_0_30px_rgba(189,157,255,0.2)]">
          <h3 className="text-[#2e006c] text-xl font-black italic mb-1">Go PaisaTrack PRO</h3>
          <p className="text-[#2e006c]/70 text-[10px] font-bold mb-4 leading-relaxed">Unlock advanced bento analytics and custom guilt scores.</p>
          <button onClick={handleUpgradeToast} className="bg-white text-[#bd9dff] px-6 py-2 rounded-xl text-xs font-black shadow-sm active:scale-95 transition-transform hover:bg-gray-50">
             Upgrade Now
          </button>
        </div>

        {/* Logout */}
        <button 
          onClick={handleLogout}
          className="w-full mt-6 py-4 border border-dashed border-[#F43F5E]/30 text-[#F43F5E] rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#F43F5E]/5 transition-colors active:scale-[0.98]"
        >
          <LogOut size={14} />
          Sign Out From Device
        </button>
      </main>
    </div>
  );
};

export default Profile;