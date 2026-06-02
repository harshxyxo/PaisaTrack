import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Budget from '../models/Budget';
import Transaction from '../models/Transaction';

export const getBudgets = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const budgets = await Budget.find({ userId, month, year });

    const startDate = new Date(year, month - 1, 1, 0, 0, 0);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgetsWithSpent = await Promise.all(budgets.map(async (budget) => {
      const spent = await Transaction.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            type: 'expense',
            category: budget.category,
            date: { $gte: startDate, $lte: endDate }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      
      const spentAmount = spent[0]?.total || 0;
      const percentage = budget.monthlyLimit > 0 
        ? Math.min(9999, Math.round((spentAmount / budget.monthlyLimit) * 100))
        : 0;
      const remaining = Math.max(0, budget.monthlyLimit - spentAmount);
      const status = percentage >= 100 ? 'exceeded' 
        : percentage >= 80 ? 'warning' : 'ok';

      return {
        ...budget.toObject(),
        spent: spentAmount,
        remaining,
        percentage,
        status
      };
    }));

    const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyLimit, 0);
    
    const allSpent = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalSpent = allSpent[0]?.total || 0;
    
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    res.json({
      budgets: budgetsWithSpent,
      totalBudget,
      totalSpent,
      overallPercentage
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createOrUpdateBudget = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { category, monthlyLimit, month, year } = req.body;

    if (!category || !monthlyLimit || !month || !year) {
      return res.status(400).json({ message: 'Category, limit, month and year are required' });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId, category, month, year },
      { monthlyLimit },
      { upsert: true, new: true }
    );

    res.json(budget);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteBudget = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const budget = await Budget.findOne({ 
      _id: id, 
      userId: userId 
    });
    if (!budget) return res.status(404).json({ message: 'Budget not found' });

    await Budget.deleteOne({ _id: id });
    res.json({ message: 'Budget deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
