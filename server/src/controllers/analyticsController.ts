import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';

export const getSummary = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const lastMonthStart = new Date(year, month - 2, 1);
    const lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);

    const transactions = await Transaction.find({
      userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const lastMonthTx = await Transaction.find({
      userId,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    // Totals
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const netBalance = totalIncome - totalExpense;

    const lastMonthExpense = lastMonthTx
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSaved = lastMonthExpense - totalExpense;

    // Category breakdown
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const categoryMap: Record<string, number> = {};
    expenseTransactions.forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

    const categoryColors: Record<string, string> = {
      food: '#EF4444', travel: '#3B82F6', shopping: '#8B5CF6',
      entertainment: '#F59E0B', bills: '#10B981', coffee: '#D97706',
      other: '#6B7280', split: '#EC4899', salary: '#10B981', scholarship: '#34D399',
      freelance: '#60A5FA', family: '#A78BFA', transfer: '#94A3B8'
    };

    const categoryBreakdown = Object.entries(categoryMap).map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0,
      color: categoryColors[cat] || '#6B7280'
    })).sort((a, b) => b.amount - a.amount);

    // Daily spending
    const todayDate = new Date();
    const isCurrentMonthParam = todayDate.getMonth() + 1 === month && todayDate.getFullYear() === year;
    const daysInMonth = new Date(year, month, 0).getDate();
    const elapsedDays = isCurrentMonthParam ? todayDate.getDate() : daysInMonth;

    const dailySpending = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayTotal = expenseTransactions
        .filter(t => new Date(t.date).getDate() === day)
        .reduce((sum, t) => sum + t.amount, 0);
      return {
        date: dateStr,
        day: day,
        amount: dayTotal
      };
    });

    // Guilt score
    const guiltScore = totalIncome > 0 
      ? Math.min(10, Math.round((totalExpense / totalIncome) * 10))
      : 0;

    let guiltMessage = '';
    let guiltLevel: 'monk' | 'decent' | 'worried' | 'disaster' = 'decent';
    if (guiltScore === 0) { 
      guiltMessage = "You're basically a monk 🧘‍♂️";
      guiltLevel = 'monk';
    } else if (guiltScore <= 3) {
      guiltMessage = "Pretty chill spending 😌";
      guiltLevel = 'decent';
    } else if (guiltScore <= 6) {
      guiltMessage = "Spending is getting spicy 🌶️";
      guiltLevel = 'worried';
    } else if (guiltScore <= 9) {
      guiltMessage = "Your wallet is crying 😭";
      guiltLevel = 'disaster';
    } else {
      guiltMessage = "Broke szn activated 💀";
      guiltLevel = 'disaster';
    }

    // AI Insights
    const insights = [];
    const topCategoryThisMonth = categoryBreakdown[0]?.category || 'food';
    const topCategoryAmount = categoryBreakdown[0]?.amount || 0;
    
    const lastMonthTopCategory = lastMonthTx
      .filter(t => t.type === 'expense' && t.category === topCategoryThisMonth)
      .reduce((sum, t) => sum + t.amount, 0);

    let aiInsightText = '';
    if (topCategoryAmount > 0 && lastMonthTopCategory > 0) {
      const change = Math.round(((topCategoryAmount - lastMonthTopCategory) / lastMonthTopCategory) * 100);
      if (change > 0) {
        aiInsightText = `You spent ${change}% more on ${topCategoryThisMonth.charAt(0).toUpperCase() + topCategoryThisMonth.slice(1)} this month. Suggestion: Look for ways to reduce ${topCategoryThisMonth} spending to stay within budget.`;
      } else if (change < 0) {
        aiInsightText = `Great job! Your ${topCategoryThisMonth.charAt(0).toUpperCase() + topCategoryThisMonth.slice(1)} expenses are down ${Math.abs(change)}% from last month.`;
      } else {
        aiInsightText = `Your ${topCategoryThisMonth.charAt(0).toUpperCase() + topCategoryThisMonth.slice(1)} expenses are exactly the same as last month. Consistent!`;
      }
    } else if (topCategoryAmount > 0) {
      aiInsightText = `Most of your budget went to ${topCategoryThisMonth.charAt(0).toUpperCase() + topCategoryThisMonth.slice(1)} this month.`;
    }

    if (aiInsightText) {
      insights.push({
        type: 'ai', emoji: '🤖',
        message: aiInsightText
      });
    }

    if (totalSaved > 0) {
      insights.push({
        type: 'success', emoji: '✅',
        message: `You saved ₹${totalSaved.toLocaleString('en-IN')} more than last month — great job!`
      });
    }
    if (guiltScore > 40) {
      insights.push({
        type: 'warning', emoji: '💡',
        message: `${guiltScore}% of your spending was impulse/late-night buys`
      });
    }
    if (insights.length === 1 && totalExpense > 0) {
      insights.push({
        type: 'info', emoji: '📊',
        message: `You spent ₹${totalExpense.toLocaleString('en-IN')} this month across ${expenseTransactions.length} transactions`
      });
    }

    // Top merchants
    const merchantMap: Record<string, { amount: number, count: number }> = {};
    expenseTransactions.forEach(t => {
      const name = t.description || t.merchantName || t.category;
      if (name) {
        if (!merchantMap[name]) merchantMap[name] = { amount: 0, count: 0 };
        merchantMap[name].amount += t.amount;
        merchantMap[name].count += 1;
      }
    });
    const topMerchants = Object.entries(merchantMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 3);

    const lastMonthIncome = lastMonthTx
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalChange = lastMonthExpense > 0 
      ? Math.round(((totalExpense - lastMonthExpense) / lastMonthExpense) * 100) : 0;

    res.json({
      totalIncome, totalExpense, netBalance, totalSaved,
      categoryBreakdown, dailySpending, guiltScore, elapsedDays,
      guiltMessage, guiltLevel, insights, topMerchants,
      vsLastMonth: {
        totalChange,
        savedMore: totalSaved > 0,
        lastMonthExpense,
        lastMonthIncome
      }
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const transactions = await Transaction.find({ userId });
    
    const totalTracked = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const monthsActive = Math.max(1, Math.ceil((new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)));

    // For total saved, we could sum up all months where income > expense
    // For simplicity, let's just do total income - total expense overall
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalSaved = Math.max(0, totalIncome - totalTracked);

    res.json({
      totalTracked,
      monthsActive,
      totalSaved
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
