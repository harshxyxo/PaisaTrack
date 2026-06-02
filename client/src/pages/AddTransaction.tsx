import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings,
  Calendar, 
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

const SMSModal: React.FC<{ isOpen: boolean; onClose: () => void; onParse: (text: string) => void }> = ({ isOpen, onClose, onParse }) => {
  const [text, setText] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-[#0f1117] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
      >
        <h3 className="text-xl font-black text-white italic tracking-tight mb-2">Parse Bank SMS</h3>
        <p className="text-[#a5aabf] text-sm mb-4">Paste your bank SMS below to auto-fill the form.</p>
        
        <textarea 
          className="w-full h-32 bg-[#131B2C] border border-white/10 rounded-xl p-4 text-white text-sm focus:ring-0 focus:border-[#bd9dff]/50 outline-none resize-none mb-6"
          placeholder="e.g. Rs. 500.00 debited from a/c **1234 on 02-06-26 to ZOMATO via UPI"
          value={text}
          onChange={(e) => setText(e.target.value)}
        ></textarea>

        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 border border-white/20 text-[#a5aabf] py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onParse(text); onClose(); setText(''); }}
            className="flex-1 bg-[#bd9dff] text-[#2e006c] py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:opacity-90 transition-all shadow-lg"
          >
            Parse
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const incomeCategories = [
  { id: 'salary', name: 'Salary', emoji: '💰' },
  { id: 'scholarship', name: 'Scholarship', emoji: '🎓' },
  { id: 'freelance', name: 'Freelance', emoji: '💻' },
  { id: 'family', name: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'transfer', name: 'Transfer', emoji: '🔄' },
  { id: 'other', name: 'Other', emoji: '📦' },
];

const expenseCategories = [
  { id: 'food', name: 'Food', emoji: '🍕' },
  { id: 'travel', name: 'Travel', emoji: '🚗' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️' },
  { id: 'entertainment', name: 'Entertainment', emoji: '🎮' },
  { id: 'bills', name: 'Bills', emoji: '💡' },
  { id: 'coffee', name: 'Coffee', emoji: '☕' },
  { id: 'split', name: 'Split', emoji: '👥' },
  { id: 'other', name: 'Other', emoji: '📦' },
];

const AddTransaction: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('0');
  const [category, setCategory] = useState('food');
  const [merchantName, setMerchantName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'cash' | 'card' | 'netbanking'>('upi');
  const [isSplit, setIsSplit] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSMSModalOpen, setIsSMSModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error("Gemini API key is missing. AI features won't work.");
      return;
    }

    setLoading(true);
    const loadingToast = toast.loading("AI is reading your bill...");
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const prompt = "Extract the amount (number), merchant name, and category (Food, Travel, Shopping, Entertainment, Bills, Coffee, or Other) from this receipt. Return ONLY a JSON object with keys 'amount', 'merchantName', and 'category'.";
      
      const result = await model.generateContent([
        prompt,
        { inlineData: { data: base64Data, mimeType: file.type } }
      ]);

      const text = result.response.text();
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonStr);

      if (data.amount) setAmount(String(data.amount).replace(/[^0-9.]/g, ''));
      if (data.merchantName) setMerchantName(data.merchantName);
      if (data.category) {
        const cat = data.category.toLowerCase();
        const validExpenseCats = expenseCategories.map(c => c.id);
        if (validExpenseCats.includes(cat)) {
          setCategory(cat);
        } else {
          setCategory('other');
        }
      }
      setType('expense');
      
      toast.success("Bill scanned successfully! ✨", { id: loadingToast });
    } catch (error) {
      console.error(error);
      toast.error("Failed to parse bill. Please try again.", { id: loadingToast });
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAutoCategorize = async (text: string) => {
    if (!text || type !== 'expense') return;

    const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
    if (!apiKey) return;
    
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `Categorize this expense description into one word: Food, Travel, Shopping, Entertainment, Bills, Coffee, or Other. Description: ${text}`;
      
      const result = await model.generateContent(prompt);
      const cat = result.response.text().trim().toLowerCase();
      
      const validExpenseCats = expenseCategories.map(c => c.id);
      if (validExpenseCats.includes(cat)) {
        setCategory(cat);
        toast.success(`Auto-categorized as ${cat} ✨`);
      }
    } catch (error) {
      console.error("Auto-categorization failed", error);
    }
  };

  const handleKeyPress = (key: string) => {
    if (key === '⌫') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    } else if (key === '.') {
      if (!amount.includes('.')) setAmount(prev => prev + '.');
    } else {
      if (amount === '0') setAmount(key);
      else if (amount.replace('.', '').length < 8) setAmount(prev => prev + key);
    }
  };

  const handleSMSParse = (text: string) => {
    if (!text.trim()) return;

    // Improved regex patterns based on instructions
    const amountMatch = text.match(/(?:RS|INR|Amt)\.?\s*([0-9,]+(?:\.[0-9]{2})?)/i) || 
                        text.match(/spent\s+Rs\.?\s*([0-9,]+)/i) || 
                        text.match(/debited(?: by)?\s*(?:Rs\.?)?\s*([0-9,]+)/i) || 
                        text.match(/Rs\.?\s*([0-9,]+)\s*debited/i);
                        
    const merchantMatch = text.match(/(?:at|to|into)\s+([A-Z0-9\s*.\-_]+)(?:\s+on|\s+ref|\s+limit|\s+via)/i) || 
                          text.match(/to\s+([A-Z\s]+)\s+Ref/i) || 
                          text.match(/paid to\s+([A-Z0-9\s*.\-_]+)/i) ||
                          text.match(/spent.*at\s+([A-Z0-9\s*.\-_]+)/i);

    let parsed = false;

    if (amountMatch) {
      setAmount(amountMatch[1].replace(/,/g, ''));
      parsed = true;
    }
    if (merchantMatch) {
      setMerchantName(merchantMatch[1].trim());
      parsed = true;
    }
    
    if (text.toLowerCase().includes('credited')) {
        setType('income');
    } else {
        setType('expense');
    }

    if (parsed) {
      toast.success("SMS parsed successfully! ✅");
    } else {
      toast.error("Could not parse SMS. Please fill manually.");
    }
  };

  const handleSave = async () => {
    const numAmount = parseFloat(amount);
    if (numAmount <= 0) {
      return toast.error("Please enter a valid amount");
    }
    setLoading(true);
    try {
      await api.post('/transactions', {
        type,
        amount: numAmount,
        category,
        merchantName: merchantName || category,
        description: merchantName || category,
        date,
        paymentMethod,
        isSplit
      });
      
      if (isSplit) {
        await api.post('/splits', {
          title: merchantName || category,
          totalAmount: numAmount,
          type: 'owes_me',
          participants: [{ name: 'Pending Friend', upiId: '', phone: '', amountOwed: numAmount }]
        });
      }
      
      // Trigger challenge check after expense
      if (type === 'expense') {
        try {
            await api.post('/challenges/check-today');
        } catch (e) {
            console.error("Challenge check failed", e);
        }
      }

      toast.success('Transaction saved! 🚀');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        const month = new Date().getMonth() + 1;
        const year = new Date().getFullYear();
        const res = await api.get(`/budgets?month=${month}&year=${year}`);
        setBudgets(res.data.budgets || []);
      } catch (err) {
        console.error('Failed to fetch budgets', err);
      }
    };
    fetchBudgets();
  }, []);

  const numAmount = parseFloat(amount || '0');
  const activeBudget = type === 'expense' ? (Array.isArray(budgets) ? budgets : []).find((b: any) => b.category === category) : null;
  const willExceed = activeBudget ? (activeBudget.spentAmount + numAmount > activeBudget.monthlyLimit) : false;

  const currentCategories = type === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="min-h-screen pb-32 pt-4 flex flex-col w-full max-w-4xl mx-auto px-6 md:px-8 font-['Inter'] animate-in fade-in duration-500 overflow-x-hidden">
      
      {/* Top Header */}
      <header className="w-full flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-[#a5aabf] hover:text-white mr-2">
            <ArrowLeft size={20} />
          </button>
          <span className="text-xl font-black text-[#bd9dff] tracking-tight italic uppercase">PaisaTrack</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden">
             <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=bd9dff&color=000`} alt="User" />
          </div>
          <button onClick={() => navigate('/profile')} className="text-[#a5aabf] hover:text-white transition-colors">
            <Settings size={20} />
          </button>
        </div>
      </header>

      <div className="w-full max-w-xl mx-auto space-y-8">
        
        {/* Income / Expense Toggle */}
        <div className="flex bg-[#131B2C] p-1.5 rounded-full border border-white/5 shadow-lg w-max mx-auto">
          <button 
            onClick={() => { setType('income'); setCategory('salary'); }}
            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              type === 'income' ? 'bg-[#bd9dff] text-[#2e006c] shadow-[0_0_20px_rgba(189,157,255,0.4)]' : 'text-[#a5aabf] hover:text-white'
            }`}
          >
            Income
          </button>
          <button 
            onClick={() => { setType('expense'); setCategory('food'); }}
            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
              type === 'expense' ? 'bg-[#bd9dff] text-[#2e006c] shadow-[0_0_20px_rgba(189,157,255,0.4)]' : 'text-[#a5aabf] hover:text-white'
            }`}
          >
            Expense
          </button>
        </div>
        
        {/* Scan Receipt Button */}
        <div className="flex justify-center mt-4">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleImageScan}
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:bg-white/10 transition-colors"
          >
            <Camera size={14} /> Scan Receipt 📸
          </button>
        </div>
        
        {/* Amount Input Display */}
        <div className="text-center w-full">
          <p className="text-[#a5aabf] text-[9px] font-black uppercase tracking-widest mb-3 opacity-80">
            {type === 'expense' ? 'How much did you spend?' : 'How much did you receive?'}
          </p>
          <div className="text-7xl font-black text-[#bd9dff] tracking-tighter drop-shadow-[0_0_25px_rgba(189,157,255,0.25)] flex items-center justify-center gap-1">
            <span className="text-5xl opacity-80">₹</span>{amount}
          </div>
          {willExceed && (
            <p className="text-[#F43F5E] text-xs mt-4 font-bold">⚠️ Warning: This will exceed your {category} budget of ₹{activeBudget.monthlyLimit}!</p>
          )}
        </div>

        {/* Category Horizontal Scroll */}
        <section>
          <div className="flex overflow-x-auto pb-4 gap-3 no-scrollbar snap-x snap-mandatory px-1">
            {currentCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`snap-center flex-shrink-0 px-5 py-3 rounded-[1.25rem] flex items-center gap-2 transition-all duration-300 border ${
                  category === cat.id 
                    ? 'bg-[#131B2C] border-[#bd9dff]/50 shadow-[0_0_15px_rgba(189,157,255,0.15)]' 
                    : 'bg-[#0B1120] border-white/5 opacity-50 hover:opacity-100'
                }`}
              >
                <span className="text-base">{cat.emoji}</span>
                <span className={`text-[10px] font-bold tracking-wider ${category === cat.id ? 'text-white' : 'text-[#a5aabf]'}`}>
                  {cat.name}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Transaction Details Form */}
        <section className="space-y-4">
          <div className="bg-[#131B2C] border border-white/5 p-5 rounded-2xl shadow-sm">
            <label className="block text-[#a5aabf] text-[8px] font-black uppercase tracking-widest mb-2 opacity-80">Description / Merchant</label>
            <input 
              className="bg-transparent border-none p-0 text-white text-base font-bold focus:ring-0 w-full placeholder:text-white/20 outline-none" 
              type="text" 
              placeholder="e.g. Swiggy, Canteen, Rent"
              value={merchantName}
              onChange={(e) => setMerchantName(e.target.value)}
              onBlur={() => handleAutoCategorize(merchantName)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#131B2C] border border-white/5 p-5 rounded-2xl shadow-sm">
              <label className="block text-[#a5aabf] text-[8px] font-black uppercase tracking-widest mb-2 opacity-80">Date</label>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#bd9dff]" />
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-transparent border-none p-0 text-white text-sm font-bold focus:ring-0 w-full cursor-pointer outline-none"
                />
              </div>
            </div>

            <div className="bg-[#131B2C] border border-white/5 p-5 rounded-2xl shadow-sm">
              <label className="block text-[#a5aabf] text-[8px] font-black uppercase tracking-widest mb-2 opacity-80">Method</label>
              <div className="flex items-center gap-2">
                <CreditCard size={16} className="text-[#bd9dff]" />
                <select 
                  value={paymentMethod}
                  onChange={(e: any) => setPaymentMethod(e.target.value)}
                  className="bg-transparent border-none p-0 text-white text-sm font-bold focus:ring-0 w-full cursor-pointer outline-none appearance-none"
                >
                  <option value="upi">UPI</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="netbanking">NetBanking</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-[#131B2C] border border-white/5 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-[#a5aabf] opacity-80">Mark for Split</p>
              <p className="text-xs font-bold text-white/40 mt-1">{isSplit ? 'ON' : 'OFF'}</p>
            </div>
            <div 
              onClick={() => setIsSplit(!isSplit)}
              className={`w-10 h-6 rounded-full relative cursor-pointer transition-colors duration-300 shadow-inner ${isSplit ? 'bg-[#bd9dff]' : 'bg-[#0B1120] border border-white/10'}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 shadow-sm ${isSplit ? 'right-1' : 'left-1 opacity-50'}`}></div>
            </div>
          </div>
        </section>

        {/* Numpad */}
        <section className="grid grid-cols-3 gap-y-8 pt-4 pb-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'].map((key) => (
            <button 
              key={key}
              onClick={() => handleKeyPress(key)}
              className="text-2xl font-black text-white hover:text-[#bd9dff] transition-all active:scale-75 flex items-center justify-center"
            >
              {key}
            </button>
          ))}
          <button 
             onClick={() => handleKeyPress('⌫')}
             className="text-2xl font-black text-[#F43F5E] hover:text-red-400 transition-all active:scale-75 flex items-center justify-center"
          >
             ⌫
          </button>
        </section>

        <div className="flex flex-col gap-4 mt-8 pb-10">
          <button 
            onClick={() => setIsSMSModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#bd9dff] hover:opacity-80 transition-all py-2"
          >
            <MessageSquare size={12} />
            Parse Bank SMS
          </button>
          
          <button 
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#a370f0] to-[#bd9dff] text-[#2e006c] py-5 rounded-[1.5rem] font-black text-sm shadow-[0_10px_30px_rgba(189,157,255,0.4)] hover:shadow-[0_15px_40px_rgba(189,157,255,0.6)] active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {loading ? 'Saving...' : 'Save Flow'}
          </button>
        </div>
      </div>

      <SMSModal 
        isOpen={isSMSModalOpen}
        onClose={() => setIsSMSModalOpen(false)}
        onParse={handleSMSParse}
      />
    </div>
  );
};

export default AddTransaction;