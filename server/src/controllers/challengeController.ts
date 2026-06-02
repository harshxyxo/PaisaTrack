import { Request, Response } from 'express';
import Challenge from '../models/Challenge';
import Transaction from '../models/Transaction';

export const getChallenges = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const challenges = await Challenge.find({ userId, isActive: true });

    const processedChallenges = challenges.map(c => {
      // Streak calculation fix
      let streakDays = 0;
      let checkDate = new Date(c.startDate);
      const today = new Date();
      
      while (checkDate <= today) {
        const found = c.completedDays.some(
          d => new Date(d).toDateString() === checkDate.toDateString()
        );
        if (found) streakDays++;
        else break;
        checkDate.setDate(checkDate.getDate() + 1);
      }

      const hasCheckedToday = c.completedDays.some(d => new Date(d).toDateString() === today.toDateString()) ||
                              c.failedDays.some(d => new Date(d).toDateString() === today.toDateString());

      return {
        ...c.toObject(),
        streakDays,
        currentDayStatus: hasCheckedToday ? 'checked' : 'pending'
      };
    });

    res.json(processedChallenges);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createChallenge = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, type, dailyLimit, description } = req.body;

    // Deactivate old ones
    await Challenge.updateMany({ userId, isActive: true }, { isActive: false });

    const challenge = new Challenge({
      userId,
      name,
      type,
      dailyLimit: dailyLimit || 0,
      description: description || '',
      startDate: new Date(),
      completedDays: [],
      failedDays: [],
      isActive: true
    });

    await challenge.save();
    res.status(201).json(challenge);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const checkDay = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const challenge = await Challenge.findById(id);
    if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const hasCheckedToday = challenge.completedDays.some(d => new Date(d).getTime() === today.getTime()) ||
                            challenge.failedDays.some(d => new Date(d).getTime() === today.getTime());

    if (hasCheckedToday) {
      return res.json({ message: 'Already checked today' });
    }

    const transactions = await Transaction.find({
      userId,
      date: { $gte: today, $lt: tomorrow }
    });

    let passed = true;
    if (challenge.type === 'no_food_delivery') {
      const foodSpend = transactions.some(t => t.category === 'food' && t.amount > 100 && /swiggy|zomato|blinkit|dunzo/i.test(t.merchantName || ''));
      if (foodSpend) passed = false;
    } else if (challenge.type === 'no_shopping') {
      const shoppingSpend = transactions.some(t => t.category === 'shopping');
      if (shoppingSpend) passed = false;
    } else if (challenge.type === 'under_daily_limit') {
      const totalSpend = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      if (totalSpend > challenge.dailyLimit) passed = false;
    }

    if (passed) {
      challenge.completedDays.push(today);
    } else {
      challenge.failedDays.push(today);
    }

    await challenge.save();

    res.json({
      passed,
      streakDays: challenge.completedDays.length,
      message: passed ? 'Day completed! 🔥' : 'Challenge failed for today 🛑'
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteChallenge = async (req: Request, res: Response) => {
  try {
    const challenge = await Challenge.findOne({
      _id: req.params.id,
      userId: req.user?.userId
    });
    if (!challenge) return res.status(404).json({ message: 'Not found' });
    
    await Challenge.deleteOne({ _id: req.params.id });
    res.json({ message: 'Challenge ended' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
