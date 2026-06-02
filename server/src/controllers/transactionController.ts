import { Request, Response } from 'express';
import Transaction from '../models/Transaction';
import mongoose from 'mongoose';

export const getTransactions = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { month, year, category, type, limit } = req.query;

    const query: any = { userId };

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (category) query.category = category;
    if (type) query.type = type;

    let dbQuery = Transaction.find(query).sort({ date: -1 });

    if (limit) {
      dbQuery = dbQuery.limit(Number(limit));
    }

    const transactions = await dbQuery;
    res.json(transactions);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { type, amount, category, merchantName, description, date, paymentMethod, isSplit, splitId } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ message: 'Type, amount and category are required' });
    }

    const transaction = new Transaction({
      userId,
      type,
      amount,
      category,
      merchantName,
      description,
      date: date || new Date(),
      paymentMethod,
      isSplit,
      splitId: splitId || null
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    Object.assign(transaction, req.body);
    await transaction.save();

    res.json(transaction);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteTransaction = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const transaction = await Transaction.findById(id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.userId.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this transaction' });
    }

    await Transaction.deleteOne({ _id: id });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const exportCSV = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { range, type } = req.query;
    
    const query: any = { userId };
    
    if (range && range !== 'all') {
      const days = parseInt(range as string);
      if (!isNaN(days)) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        query.date = { $gte: startDate };
      }
    }

    if (type && type !== 'all') {
      query.type = type;
    }

    const transactions = await Transaction.find(query).sort({ date: -1 });

    let csv = 'Date,Type,Category,Merchant,Description,Amount,Payment Method\n';

    transactions.forEach(t => {
      const date = new Date(t.date).toISOString().split('T')[0];
      const row = [
        date,
        t.type,
        t.category,
        `"${t.merchantName || ''}"`,
        `"${t.description || ''}"`,
        t.amount,
        t.paymentMethod
      ].join(',');
      csv += row + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=paisatrack_export.csv');
    res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
