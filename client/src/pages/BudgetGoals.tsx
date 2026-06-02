import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Utensils, ShoppingBag, Car, Receipt, Check, Plus, X, Pizza, Dumbbell, Flame, Target, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ConfirmModal: React.FC<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; onClose: () => void }> = ({ isOpen, title, message, onConfirm, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
      >
        <h3 className="text-xl font-black text-white italic tracking-tight mb-2">{title}</h3>
        <p className="text-[#a5aabf] text-sm mb-6">{message}</p>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 border border-white/20 text-[#a5aabf] py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 bg-red-500/20 text-red-500 border border-red-500/50 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-red-500 hover:text-white transition-colors"
          >
            Confirm
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const AddBudgetModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void }> = ({ isOpen, onClose, onSuccess }) => {
  const [category, setCategory] = useState('food');
  const [limit, setLimit] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = [
    { id: 'food', name: 'Food', icon: <Utensils size={18} /> },
    { id: 'travel', name: 'Travel', icon: <Car size={18} /> },
    { id: 'shopping', name: 'Shopping', icon: <ShoppingBag size={18} /> },
    { id: 'entertainment', name: 'Entertainment', icon: <Flame size={18} /> },
    { id: 'bills', name: 'Bills', icon: <Receipt size={18} /> },
    { id: 'coffee', name: 'Coffee', icon: <Utensils size={18} /> },
    { id: 'other', name: 'Other', icon: <Target size={18} /> },
  ];

  const handleSave = async () => {
    if (!limit || parseFloat(limit) <= 0) return toast.error("Enter a valid limit");
    setLoading(true);
    try {
      const now = new Date();
      await api.post('/budgets', {
        category,
        monthlyLimit: parseFloat(limit),
        month: now.getMonth() + 1,
        year: now.getFullYear()
      });
      toast.success("Budget set! 🎯");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error("Failed to set budget");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#131B2C] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-[480px] shadow-2xl relative"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-[#a5aabf] hover:text-white">
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-black text-white italic tracking-tighter mb-8">Set Budget Limit</h2>
        
        <div className="space-y-6">
          <div>
            <label className="text-[#a5aabf] text-[10px] font-black uppercase tracking-widest mb-3 block opacity-60">Select Category</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all ${
                    category === cat.id ? 'bg-[#bd9dff] border-[#bd9dff] text-[#2e006c]' : 'bg-[#0B1120] border-white/5 text-[#a5aabf]'
                  }`}
                >
                  {cat.icon}
                  <span className="text-[10px] font-bold uppercase tracking-wider">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[#a5aabf] text-[10px] font-black uppercase tracking-widest mb-3 block opacity-60">Monthly Limit (₹)</label>
            <input 
              type="number" 
              placeholder="e.g. 5000"
              className="w-full bg-[#0B1120] border border-white/5 rounded-2xl px-6 py-4 text-white font-bold focus:ring-0 focus:border-[#bd9dff]/50 outline-none"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-[#bd9dff] text-[#2e006c] py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg mt-4"
          >
            {loading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const BudgetGoals: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({ isOpen: false, title: '', message: '', onConfirm: () => {} });

  const fetchData = async () => {
    try {
      const [budgetRes, challengeRes] = await Promise.all([
        api.get('/budgets'),
        api.get('/challenges')
      ]);
      setData(budgetRes.data);
      setChallenges(challengeRes.data);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStartChallenge = async (type: string, name: string, description: string) => {
    let dailyLimit = 0;
    if (type === 'under_daily_limit') {
      // Keep prompt for this specific input as it wasn't explicitly asked to be removed, but prompt isn't great.
      // The instructions said: "Replace all browser-native confirm() dialogs with a custom in-app modal component"
      const val = prompt("Enter daily limit (₹):", "500");
      if (!val) return;
      dailyLimit = parseFloat(val);
    }

    try {
      await api.post('/challenges', { type, name, description, dailyLimit });
      toast.success("Challenge started! 🔥");
      fetchData();
    } catch (err) {
      toast.error("Failed to start challenge");
    }
  };

  const handleDeleteBudget = (id: string, category: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Budget',
      message: `Are you sure you want to remove the ${category} budget?`,
      onConfirm: async () => {
        try {
          await api.delete(`/budgets/${id}`);
          toast.success("Budget removed");
          fetchData();
        } catch (err) {
          toast.error("Failed to remove budget");
        }
      }
    });
  };

  const handleEndChallenge = (id: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'End Challenge',
      message: 'Are you sure you want to end this challenge? Progress will be lost.',
      onConfirm: async () => {
        try {
          await api.delete(`/challenges/${id}`);
          toast.success("Challenge ended");
          fetchData();
        } catch (err) {
          toast.error("Failed to end challenge");
        }
      }
    });
  };

  const totalSpent = data?.totalSpent || 0;
  const totalBudget = data?.totalBudget || 0;
  const overallPercentage = data?.overallPercentage || 0;
  const budgetList = data?.budgets || [];
  const activeChallenges = challenges.filter(c => c.isActive);

  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'HS';

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#080e1d]">
      <div className="w-10 h-10 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 pt-4 w-full max-w-4xl mx-auto px-6 md:px-8 font-['Inter']">
      
      {/* Header */}
      <header className="flex justify-between items-center w-full py-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-white/10 bg-[#131B2C] flex items-center justify-center text-white font-black italic shadow-lg">
            {userInitials}
          </div>
          <span className="text-xl font-black text-[#bd9dff] tracking-tighter uppercase italic">PaisaTrack</span>
        </div>
        <button className="w-10 h-10 bg-[#131B2C] border border-white/5 rounded-xl flex items-center justify-center text-[#bd9dff] hover:bg-[#bd9dff]/10 transition-all shadow-lg">
          <Settings size={22} />
        </button>
      </header>

      <main className="space-y-8">
        {/* Main Budget Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 0.95, y: 0 }}
          className="w-full bg-[#131B2C] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
        >
          {totalBudget > 0 ? (
            <>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[#a5aabf] text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-60">Monthly Budget</p>
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-4xl font-black text-white italic tracking-tighter">
                      ₹{totalSpent.toLocaleString('en-IN')}
                    </h2>
                    <span className="text-lg font-bold text-[#a5aabf] italic">/ ₹{totalBudget.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${
                  overallPercentage >= 90 ? 'bg-red-500/20 text-red-400' : 'bg-[#10B981]/20 text-[#10B981]'
                }`}>
                  {Math.min(999, overallPercentage)}% USED
                </div>
              </div>

              <div className="w-full h-3 bg-[#0B1120] rounded-full overflow-hidden mb-4 border border-white/5 shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, overallPercentage)}%` }}
                  className={`h-full rounded-full shadow-[0_0_15px_rgba(189,157,255,0.4)] ${
                    overallPercentage >= 100 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'bg-[#bd9dff]'
                  }`}
                ></motion.div>
              </div>

              <div className="flex justify-between items-center text-[10px] font-black text-[#a5aabf] uppercase tracking-widest opacity-60">
                <p>Left to spend: ₹{Math.max(0, totalBudget - totalSpent).toLocaleString('en-IN')}</p>
                <p>Month Ends in {new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - new Date().getDate()} Days</p>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-[#a5aabf] font-black uppercase tracking-[0.2em] text-[10px] mb-4 opacity-60">No Budget Set</p>
              <h2 className="text-2xl font-black text-white italic tracking-tighter mb-6">Define your goals for {new Date().toLocaleString('en-US', { month: 'long' })}</h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#bd9dff] text-[#0B1120] px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-80 transition-all active:scale-95 shadow-lg"
              >
                <Plus size={16} className="inline mr-2" /> Start Planning
              </button>
            </div>
          )}
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgetList.length > 0 ? (
            budgetList.map((cat: any) => (
              <motion.div 
                key={cat._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[#131B2C] border border-white/5 p-6 rounded-[2rem] shadow-lg hover:border-white/10 transition-colors"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-[#bd9dff]/10 text-[#bd9dff] flex items-center justify-center">
                        {cat.category === 'food' ? <Utensils size={18}/> : cat.category === 'travel' ? <Car size={18}/> : <ShoppingBag size={18}/>}
                     </div>
                     <h3 className="text-white font-black italic uppercase text-xs tracking-tight">{cat.category}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.status === 'exceeded' && <AlertTriangle size={16} className="text-red-500 animate-pulse" />}
                    <button onClick={() => handleDeleteBudget(cat._id, cat.category)} className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-end mb-3">
                  <span className="text-2xl font-black text-white italic">₹{cat.spent.toLocaleString()}</span>
                  <span className="text-[10px] text-[#a5aabf] font-bold">₹{cat.monthlyLimit.toLocaleString()}</span>
                </div>
                <div className="w-full h-1.5 bg-[#0B1120] rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${cat.status === 'exceeded' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[#bd9dff] shadow-[0_0_8px_rgba(189,157,255,0.4)]'}`}
                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                  ></div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="md:col-span-2 border border-dashed border-white/10 rounded-[2rem] p-12 text-center flex flex-col items-center gap-4">
               <p className="text-[#a5aabf] font-bold text-sm">No budgets set for this month yet.</p>
               <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-[#bd9dff] text-[#0B1120] px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-80 transition-all active:scale-95"
               >
                 <Plus size={16} /> Create First Budget
               </button>
            </div>
          )}
        </div>

        {/* Challenge Section */}
        {activeChallenges.length > 0 ? (
          <div className="space-y-6 mt-8 max-h-[600px] overflow-y-auto no-scrollbar pb-6">
            {activeChallenges.map(activeChallenge => (
              <motion.div 
                key={activeChallenge._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full bg-[#131B2C] border border-white/5 p-8 rounded-[2rem] shadow-2xl"
              >
            <div className="flex justify-between items-start mb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[#bd9dff]/20 text-[#bd9dff] px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest">Live Challenge</span>
                  <h3 className="text-2xl font-black text-white italic tracking-tighter">{activeChallenge.name}</h3>
                </div>
                <p className="text-[#a5aabf] text-sm font-medium mt-1 leading-relaxed">{activeChallenge.description}</p>
              </div>
              <div className="text-right">
                <h2 className="text-4xl font-black text-[#bd9dff] italic tracking-tighter leading-none">{activeChallenge.streakDays}</h2>
                <p className="text-[#bd9dff] text-[10px] font-black uppercase tracking-widest mt-2">Day Streak</p>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: 21 }, (_, i) => {
                const day = i + 1;
                const dayDate = new Date(activeChallenge.startDate);
                dayDate.setDate(dayDate.getDate() + (day - 1));
                const dateStr = dayDate.toDateString();

                const isCompleted = activeChallenge.completedDays.some(
                  (d: string) => new Date(d).toDateString() === dateStr
                );
                const isFailed = activeChallenge.failedDays.some(
                  (d: string) => new Date(d).toDateString() === dateStr  
                );
                const isToday = new Date().toDateString() === dateStr;
                const isPast = dayDate < new Date() && !isToday;

                let tileClass = 'bg-white/10 border-white/10 opacity-40'; // future
                let content = null;

                if (isCompleted) {
                  tileClass = 'bg-emerald-400 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.3)]';
                  content = <Check size={14} className="text-[#080e1d]" strokeWidth={4} />;
                } else if (isFailed) {
                  tileClass = 'bg-red-400 border-red-400 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
                  content = <X size={14} className="text-[#080e1d]" strokeWidth={4} />;
                } else if (isToday) {
                  tileClass = 'bg-purple-500 border-purple-500 animate-pulse';
                  content = <span className="text-[10px] font-black text-white">{day}</span>;
                } else if (isPast && !isCompleted && !isFailed) {
                  tileClass = 'bg-red-900/40 border-red-900/40';
                }

                return (
                  <div key={i} className={`aspect-square rounded-xl flex items-center justify-center border transition-all ${tileClass}`}>
                    {content}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 text-center">
               <button onClick={() => handleEndChallenge(activeChallenge._id)} className="w-full border border-red-500/30 text-red-400 bg-transparent hover:bg-red-500/10 rounded-xl py-3 mt-4 transition-colors">
                 🔄 End Challenge
               </button>
            </div>
          </motion.div>
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <h3 className="text-white font-black italic text-xl tracking-tight mb-6">Start a Challenge 🏆</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => handleStartChallenge('no_food_delivery', '🍕 No Food Delivery', 'Avoid Swiggy/Zomato for 21 days')}
                className="bg-[#131B2C] border border-white/5 p-6 rounded-[2rem] text-left hover:border-[#bd9dff] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Pizza size={24} />
                </div>
                <h4 className="text-white font-black italic text-lg opacity-90">No Food Delivery</h4>
                <p className="text-[#a5aabf] text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60">Avoid Swiggy/Zomato for 21 days</p>
              </button>

              <button 
                onClick={() => handleStartChallenge('no_shopping', '🛍️ No Shopping', 'No shopping transactions for 21 days')}
                className="bg-[#131B2C] border border-white/5 p-6 rounded-[2rem] text-left hover:border-[#bd9dff] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ShoppingBag size={24} />
                </div>
                <h4 className="text-white font-black italic text-lg opacity-90">No Shopping</h4>
                <p className="text-[#a5aabf] text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60">No shopping for 21 days</p>
              </button>

              <button 
                onClick={() => handleStartChallenge('under_daily_limit', '💰 Under Daily Limit', 'Stay under ₹500/day')}
                className="bg-[#131B2C] border border-white/5 p-6 rounded-[2rem] text-left hover:border-[#bd9dff] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target size={24} />
                </div>
                <h4 className="text-white font-black italic text-lg opacity-90">Daily Limit</h4>
                <p className="text-[#a5aabf] text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60">Stay under fixed limit daily</p>
              </button>

              <button 
                onClick={() => handleStartChallenge('custom', '🎯 Custom', 'Your own challenge')}
                className="bg-[#131B2C] border border-white/5 p-6 rounded-[2rem] text-left hover:border-[#bd9dff] transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Plus size={24} />
                </div>
                <h4 className="text-white font-black italic text-lg opacity-90">Custom</h4>
                <p className="text-[#a5aabf] text-[10px] font-bold uppercase tracking-wider mt-1 opacity-60">Your own rules</p>
              </button>
            </div>
          </div>
        )}
      </main>

      <AddBudgetModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchData} 
      />

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default BudgetGoals;