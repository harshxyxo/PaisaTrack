import { Request, Response } from 'express';
import User from '../models/User';

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) return res.json([]);

    const regex = new RegExp(q, 'i');
    
    // Search by name, email, or upiId
    const users = await User.find({
      $or: [
        { name: regex },
        { email: regex },
        { upiId: regex }
      ]
    }).select('_id name email upiId').limit(10);

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
