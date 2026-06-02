import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Plus, 
  Bell, 
  ArrowUpRight, 
  CheckCircle2, 
  Users,
  X,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';

const formatDate = (dateValue: string | Date | undefined): string => {
  if (!dateValue) return 'Unknown date';
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return 'Unknown date';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const SplitBills: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [splits, setSplits] = useState<any[]>([]);
  const [settledSplits, setSettledSplits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [friends, setFriends] = useState([{ name: '', upiId: '', userId: '' }]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [splitType, setSplitType] = useState<'owes_me' | 'i_owe'>('owes_me');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searching, setSearching] = useState(false);

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState({ link: '', name: '', amount: 0 });

  const handleUPIPayment = (upiId: string, name: string, amount: number) => {
    // Fallback logic for demonstration
    const finalUpiId = upiId || user?.upiId || "success@ybl"; 
    const finalName = name || "PaisaTrack User";

    if (!upiId && !user?.upiId) {
      toast.success("Using demo UPI ID for testing.");
    }

    const upiLink = `upi://pay?pa=${finalUpiId}&pn=${encodeURIComponent(finalName)}&am=${amount}&cu=INR`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = upiLink;
    } else {
      setQrData({ link: upiLink, name: finalName, amount });
      setQrModalOpen(true);
    }
  };

  const fetchSplits = async () => {
    try {
      const [activRes, settledRes] = await Promise.all([
        api.get('/splits?settled=false'),
        api.get('/splits?settled=true')
      ]);
      setSplits(activRes.data);
      setSettledSplits(settledRes.data);
    } catch (err) {
      console.error('Failed to fetch splits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSplits();
  }, []);

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setShowSearch(false);
      return;
    }
    setShowSearch(true);
    setSearching(true);
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(q)}`);
      setSearchResults(data);
    } catch (err) {
      console.error('Search error', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddFriend = (selectedUser: any) => {
    const newFriends = [...friends];
    // Find first empty slot or add new
    const emptyIdx = newFriends.findIndex(f => !f.name);
    if (emptyIdx !== -1) {
      newFriends[emptyIdx] = { name: selectedUser.name, upiId: selectedUser.upiId || '', userId: selectedUser._id };
    } else {
      newFriends.push({ name: selectedUser.name, upiId: selectedUser.upiId || '', userId: selectedUser._id });
    }
    setFriends(newFriends);
    setSearchQuery('');
    setShowSearch(false);
  };

  const handleCreateSplit = async () => {
    if (!title.trim()) return toast.error('Add a title');
    if (!amount || parseFloat(amount) <= 0) return toast.error('Add amount');
    if (friends.some(f => !f.name.trim())) return toast.error('Add friend names');

    setSubmitting(true);
    try {
      const perPerson = splitEqually 
        ? Math.round(parseFloat(amount) / (friends.length + 1))
        : parseFloat(amount) / (friends.length + 1);
      
      const participants = friends.map(f => ({
        name: f.name,
        upiId: f.upiId,
        userId: f.userId || null,
        amountOwed: parseFloat(perPerson.toFixed(2)),
        isPaid: false
      }));

      await api.post('/splits', { 
        title, 
        totalAmount: parseFloat(amount), 
        type: splitType,
        participants 
      });

      toast.success('Split created! 🎉');
      setTitle('');
      setAmount('');
      setSplitType('owes_me');
      setFriends([{ name: '', upiId: '', userId: '' }]);
      fetchSplits();
    } catch (err) {
      toast.error('Failed to create split');
    } finally {
      setSubmitting(false);
    }
  };

  const userInitials = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() : 'PT';
  const currentUserId = user?._id;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-[#080e1d]">
      <div className="w-10 h-10 border-4 border-[#bd9dff] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen pb-32 pt-4 animate-in fade-in duration-700 w-full max-w-4xl mx-auto px-6 md:px-8 font-['Inter']">
      
      <header className="flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-[#bd9dff] tracking-tighter uppercase italic">PaisaTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden bg-[#131B2C] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[#bd9dff]">{userInitials}</span>
          </div>
          <button onClick={() => navigate('/profile')} className="text-[#a5aabf] hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <section className="mb-12">
        <h1 className="text-6xl font-black text-white italic tracking-tighter mb-2">Split<span className="text-[#bd9dff]">.</span></h1>
        <p className="text-[#a5aabf] text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
          Keeping friendships clear, one bill at a time.
        </p>
      </section>

      <main className="space-y-12">
        
        {/* Active Splits */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm">🤝</span>
            <h3 className="text-white font-black italic text-base tracking-tight uppercase">Active Splits</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {splits.length > 0 ? splits.map((split: any) => {
              const isOwedToYou = split.type === 'owes_me' || (!split.type && split.createdBy === currentUserId);
              
              if (isOwedToYou) {
                // Card 1: Owes You (Green)
                return split.participants.map((p: any, idx: number) => !p.isPaid && (
                  <motion.div 
                    key={`${split._id}-${idx}`}
                    whileHover={{ y: -5 }}
                    className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/30 flex items-center justify-center overflow-hidden">
                           <span className="text-[#10B981] font-bold">{p.name ? p.name.substring(0, 2).toUpperCase() : 'FR'}</span>
                        </div>
                        <div>
                          <p className="text-[#10B981] text-[9px] font-black uppercase tracking-widest mb-0.5">Owes You</p>
                          <h4 className="text-[#10B981] font-black text-lg">{p.name}</h4>
                          <p className="text-[#10B981]/70 text-[8px] font-bold uppercase tracking-tight">{split.title}</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-[#10B981] italic tracking-tighter">₹{p.amountOwed.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          const msg = `Hey! You owe me ₹${p.amountOwed} for "${split.title}". Pay me at ${user?.upiId || 'my UPI'}`;
                          navigator.clipboard.writeText(msg);
                          toast.success('Reminder copied! 📋');
                        }}
                        className="flex-1 bg-[#0B1120] border border-white/10 text-[#a5aabf] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                      >
                        <Bell size={12} /> Remind
                      </button>
                      <button 
                        onClick={() => {
                          handleUPIPayment(user?.upiId || p.upiId || '', user?.name || 'User', p.amountOwed);
                        }}
                        className="flex-1 bg-gradient-to-r from-[#10B981] to-[#34D399] text-[#0B1120] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_5px_15px_rgba(16,185,129,0.3)]"
                      >
                        <CheckCircle2 size={12} /> Settle Up
                      </button>
                    </div>
                  </motion.div>
                ));
              } else {
                // Card 2: You Owe (Red/Purple)
                const myParticipant = split.participants.find((p: any) => p.name === user?.name || p.upiId === user?.upiId || p.userId === currentUserId) || split.participants[0];
                if (myParticipant?.isPaid) return null;

                const creatorName = myParticipant?.name || 'Friend';
                
                return (
                  <motion.div 
                    key={split._id}
                    whileHover={{ y: -5 }}
                    className="bg-[#F43F5E]/10 border border-[#F43F5E]/20 rounded-[2rem] p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-[#F43F5E]/20 border border-[#F43F5E]/30 flex items-center justify-center overflow-hidden">
                           <span className="text-[#F43F5E] font-bold">{creatorName.substring(0, 2).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-[#F43F5E] text-[9px] font-black uppercase tracking-widest mb-0.5">You Owe</p>
                          <h4 className="text-[#F43F5E] font-black text-lg">{creatorName}</h4>
                          <p className="text-[#F43F5E]/70 text-[8px] font-bold uppercase tracking-tight">{split.title}</p>
                        </div>
                      </div>
                      <span className="text-3xl font-black text-[#F43F5E] italic tracking-tighter">₹{myParticipant?.amountOwed?.toLocaleString() || 0}</span>
                    </div>
                    
                    <button 
                      onClick={() => {
                        handleUPIPayment(myParticipant?.upiId || '', creatorName, myParticipant?.amountOwed || 0);
                      }}
                      className="w-full bg-gradient-to-r from-[#bd9dff] to-[#9b72ec] text-[#2e006c] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-[0_5px_15px_rgba(189,157,255,0.3)]"
                    >
                      Pay via UPI <ArrowUpRight size={12} />
                    </button>
                  </motion.div>
                );
              }
            }) : (
              <div className="col-span-1 md:col-span-2 py-10 text-center bg-[#131B2C]/50 rounded-[2rem] border border-dashed border-white/5">
                <p className="text-[#a5aabf] text-[10px] font-black uppercase tracking-widest">No active splits. Create one below 👇</p>
              </div>
            )}
          </div>
        </section>

        {/* New Split Form */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="text-sm">➕</span>
            <h3 className="text-white font-black italic text-base tracking-tight uppercase">New Split</h3>
          </div>

          <div className="bg-[#131B2C] border border-white/5 rounded-[2.5rem] p-10 shadow-2xl flex flex-col items-center relative">
            
            <div className="flex bg-[#0B1120] p-1.5 rounded-full border border-white/5 shadow-lg w-max mx-auto mb-10">
              <button 
                onClick={() => setSplitType('owes_me')}
                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  splitType === 'owes_me' ? 'bg-[#10B981] text-[#0B1120] shadow-[0_0_20px_rgba(16,185,129,0.4)]' : 'text-[#a5aabf] hover:text-white'
                }`}
              >
                They Owe Me
              </button>
              <button 
                onClick={() => setSplitType('i_owe')}
                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  splitType === 'i_owe' ? 'bg-[#F43F5E] text-white shadow-[0_0_20px_rgba(244,63,94,0.4)]' : 'text-[#a5aabf] hover:text-white'
                }`}
              >
                I Owe Them
              </button>
            </div>

            <div className="w-full max-w-md text-center mb-10">
              <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">What's this for?</p>
              <input 
                type="text"
                placeholder="Dinner with friends..."
                className="bg-transparent border-none text-center text-2xl font-black text-white italic tracking-tight w-full placeholder:text-white/10 focus:ring-0 outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="w-full max-w-md text-center mb-12">
              <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-4 opacity-60">Amount to Split</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-4xl font-black text-[#bd9dff] opacity-40">₹</span>
                <input 
                  type="number"
                  className="bg-transparent border-none text-center text-7xl font-black text-white italic tracking-tighter w-full focus:ring-0 p-0 outline-none"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="w-full max-w-md mb-10">
              <div className="flex justify-between items-end mb-6">
                 <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest opacity-60">Select Friends</p>
              </div>

              {/* Search Friends */}
              <div className="relative mb-6">
                <div className="flex items-center bg-[#0B1120] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-[#bd9dff]/50 transition-colors">
                  <Search size={16} className="text-[#a5aabf] mr-3" />
                  <input 
                    type="text"
                    placeholder="Search friend by email or UPI..."
                    className="bg-transparent border-none text-white text-sm w-full outline-none placeholder:text-[#a5aabf]/50"
                    value={searchQuery}
                    onChange={handleSearch}
                    onFocus={() => { if(searchQuery) setShowSearch(true); }}
                  />
                </div>

                <AnimatePresence>
                  {showSearch && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-[#131B2C] border border-white/10 rounded-2xl p-2 shadow-2xl z-50 max-h-48 overflow-y-auto"
                    >
                      {searching ? (
                        <p className="text-[#a5aabf] text-xs text-center py-4">Searching...</p>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((su, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleAddFriend(su)}
                            className="flex items-center gap-3 p-3 hover:bg-[#0B1120] rounded-xl cursor-pointer transition-colors"
                          >
                            <div className="w-8 h-8 rounded-full bg-[#bd9dff]/10 flex items-center justify-center text-[#bd9dff] font-bold text-xs">
                              {su.name.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-white text-sm font-bold">{su.name}</p>
                              <p className="text-[#a5aabf] text-xs">{su.email} {su.upiId ? `• ${su.upiId}` : ''}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-[#a5aabf] text-xs text-center py-4">No users found</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex flex-col gap-4">
                {friends.map((friend, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 bg-[#0B1120] p-4 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center bg-[#bd9dff]/10 text-[#bd9dff] text-xs font-bold uppercase shrink-0 overflow-hidden">
                        {friend.name ? friend.name.substring(0, 2).toUpperCase() : 'FR'}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Name" 
                        readOnly={!!friend.userId}
                        className={`bg-transparent border-b border-white/10 text-white text-sm pb-1 w-24 focus:ring-0 focus:border-[#bd9dff] outline-none ${friend.userId ? 'opacity-70' : ''}`} 
                        value={friend.name}
                        onChange={e => {
                          const newFriends = [...friends];
                          newFriends[idx].name = e.target.value;
                          setFriends(newFriends);
                        }}
                      />
                      <input 
                        type="text" 
                        placeholder="UPI ID (optional)" 
                        readOnly={!!friend.userId}
                        className={`bg-transparent border-b border-white/10 text-white text-sm pb-1 flex-1 focus:ring-0 focus:border-[#bd9dff] outline-none ${friend.userId ? 'opacity-70' : ''}`} 
                        value={friend.upiId}
                        onChange={e => {
                          const newFriends = [...friends];
                          newFriends[idx].upiId = e.target.value;
                          setFriends(newFriends);
                        }}
                      />
                      {friends.length > 1 && (
                        <button 
                          onClick={() => {
                            const newFriends = friends.filter((_, i) => i !== idx);
                            setFriends(newFriends);
                          }} 
                          className="text-[#F43F5E] hover:text-red-400 p-1"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-center mt-2">
                  <button 
                    onClick={() => {
                      if (friends.length < 10) setFriends([...friends, { name: '', upiId: '', userId: '' }]);
                    }} 
                    className="w-10 h-10 rounded-full border border-dashed border-white/20 flex items-center justify-center text-[#a5aabf] hover:text-white hover:border-white transition-all"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full max-w-md bg-[#0B1120] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-[#a5aabf]">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Split Equally</span>
                </div>
                <div 
                  onClick={() => setSplitEqually(!splitEqually)}
                  className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors duration-300 ${splitEqually ? 'bg-[#bd9dff]' : 'bg-[#1d253b]'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${splitEqually ? 'right-1' : 'left-1 opacity-50'}`}></div>
                </div>
              </div>
              {splitEqually && amount && parseFloat(amount) > 0 && (
                <p className="text-[#10B981] text-[10px] font-bold text-right">
                  ₹{Math.round(parseFloat(amount) / (friends.length + 1))} each
                </p>
              )}
            </div>

            <button 
              onClick={handleCreateSplit}
              disabled={submitting}
              className="w-full max-w-md bg-gradient-to-r from-[#bd9dff] to-[#9b72ec] text-[#2e006c] py-5 rounded-[1.5rem] text-sm font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-[0_10px_30px_rgba(189,157,255,0.3)] disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Split Flow'}
            </button>
          </div>
        </section>

        {/* Recent Settlements */}
        {settledSplits.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm">📜</span>
                <h3 className="text-white font-black italic text-base tracking-tight uppercase">Recent Settlements</h3>
              </div>
            </div>

            <div className="space-y-4">
              {settledSplits.map((split: any) => {
                const isOwedToYou = split.type === 'owes_me' || (!split.type && split.createdBy === currentUserId);
                const iconColor = isOwedToYou ? 'text-[#10B981]' : 'text-[#F43F5E]';
                const bgColor = isOwedToYou ? 'bg-[#10B981]/10' : 'bg-[#F43F5E]/10';
                const borderColor = isOwedToYou ? 'bg-[#10B981]' : 'bg-[#F43F5E]';

                return (
                  <div key={split._id} className="bg-[#131B2C] border border-white/5 rounded-[1.5rem] p-5 flex items-center justify-between shadow-sm relative overflow-hidden group">
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderColor} opacity-60`}></div>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl ${bgColor} ${iconColor} flex items-center justify-center`}>
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">{split.title || 'Settled Split'}</h4>
                        <p className="text-[#a5aabf] text-[8px] font-black uppercase tracking-widest mt-1">
                          {split.title} • {formatDate(split.updatedAt)}
                        </p>
                      </div>
                    </div>
                    <span className={`${iconColor} font-black italic text-xl`}>
                      ₹{split.totalAmount?.toLocaleString() || 0}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </main>

      {/* QR Code Modal for Desktop */}
      <AnimatePresence>
        {qrModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0f1117] border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl relative flex flex-col items-center text-center"
            >
              <button 
                onClick={() => setQrModalOpen(false)}
                className="absolute top-4 right-4 text-[#a5aabf] hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <h3 className="text-xl font-black text-white italic tracking-tight mb-2">Scan to Pay</h3>
              <p className="text-[#a5aabf] text-sm mb-6">Scan this QR code with any UPI app to pay <strong className="text-white">{qrData.name}</strong></p>
              
              <div className="bg-white p-4 rounded-2xl mb-6 shadow-lg">
                <QRCodeSVG value={qrData.link} size={200} />
              </div>
              
              <a 
                href={qrData.link} 
                className="w-full bg-[#bd9dff] text-[#2e006c] py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:opacity-90 transition-opacity mb-4 flex items-center justify-center shadow-[0_5px_20px_rgba(189,157,255,0.3)]"
              >
                Pay via Mobile App (GPay/PhonePe)
              </a>
              
              <div className="w-full bg-[#131B2C] border border-white/5 rounded-2xl p-4 shadow-sm mb-4">
                <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-1">Amount</p>
                <p className="text-3xl font-black text-[#bd9dff] tracking-tighter italic">₹{qrData.amount}</p>
              </div>

              <button 
                onClick={() => setQrModalOpen(false)}
                className="w-full bg-[#0B1120] border border-white/10 text-[#a5aabf] py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-colors"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SplitBills;