import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';



export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, college, upiId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      college,
      upiId
    });

    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        upiId: user.upiId,
        createdAt: user.createdAt
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '30d' });

    res.cookie('auth_token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        college: user.college,
        upiId: user.upiId,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      },
      token
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const logout = (req: Request, res: Response) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out' });
};

export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });

    const { name, college, upiId } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (name) user.name = name;
    if (college !== undefined) user.college = college;
    if (upiId !== undefined) user.upiId = upiId;

    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      college: user.college,
      upiId: user.upiId,
      createdAt: user.createdAt
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};
