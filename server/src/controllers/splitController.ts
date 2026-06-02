import { Request, Response } from 'express';
import Split from '../models/Split';

export const getSplits = async (req: Request, res: Response) => {
  try {
    const settled = req.query.settled === 'true' ? true : 
      req.query.settled === 'false' ? false : null;
    
    const query: any = { createdBy: req.user?.userId };
    if (settled !== null) query.isSettled = settled;
    
    const splits = await Split.find(query).sort({ createdAt: -1 });
    res.json(splits);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const createSplit = async (req: Request, res: Response) => {
  try {
    const { title, totalAmount, type, participants } = req.body;
    
    if (!title || !totalAmount || !participants?.length) {
      return res.status(400).json({ message: 'title, totalAmount, participants required' });
    }
    
    const split = new Split({
      createdBy: req.user?.userId,
      title,
      totalAmount,
      type: type || 'owes_me',
      participants: participants.map((p: any) => ({
        name: p.name,
        upiId: p.upiId || '',
        phone: p.phone || '',
        amountOwed: p.amountOwed,
        isPaid: false
      })),
      isSettled: false
    });
    
    await split.save();
    res.status(201).json(split);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const markParticipantPaid = async (req: Request, res: Response) => {
  try {
    const { splitId, participantIndex } = req.params;
    const idx = parseInt(participantIndex);
    
    const split = await Split.findOne({ 
      _id: splitId, 
      createdBy: req.user?.userId 
    });
    
    if (!split) return res.status(404).json({ message: 'Split not found' });
    
    if (idx < 0 || idx >= split.participants.length) {
      return res.status(400).json({ message: 'Invalid participant index' });
    }
    
    split.participants[idx].isPaid = true;
    split.participants[idx].paidAt = new Date();
    
    // Check if all paid
    const allPaid = split.participants.every((p: any) => p.isPaid);
    if (allPaid) split.isSettled = true;
    
    await split.save();
    res.json(split);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteSplit = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    const split = await Split.findById(id);
    if (!split) return res.status(404).json({ message: 'Split not found' });

    if (split.createdBy.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Split.deleteOne({ _id: id });
    res.json({ message: 'Deleted' });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
