import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  merchantName: string;
  description: string;
  date: Date;
  paymentMethod: 'upi' | 'cash' | 'card' | 'netbanking';
  isSplit: boolean;
  splitId: mongoose.Types.ObjectId | null;
  isImpulsive: boolean;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['income', 'expense'], required: true },
  amount: { type: Number, required: true, min: 0.01 },
  category: {
    type: String,
    enum: ['food','travel','shopping','entertainment','bills',
           'coffee','other','salary','scholarship','freelance',
           'family','transfer','split'],
    required: true
  },
  merchantName: { type: String, default: '' },
  description: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  paymentMethod: {
    type: String,
    enum: ['upi','cash','card','netbanking'],
    default: 'upi'
  },
  isSplit: { type: Boolean, default: false },
  splitId: { type: Schema.Types.ObjectId, ref: 'Split', default: null },
  isImpulsive: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to calculate isImpulsive
TransactionSchema.pre<ITransaction>('save', function(next) {
  const hour = new Date(this.date).getHours();
  const isLateNight = hour >= 23 || hour <= 3;
  const isFoodDelivery = this.category === 'food' && 
    /swiggy|zomato|blinkit|dunzo/i.test(this.merchantName || '');
  
  this.isImpulsive = this.type === 'expense' && (isLateNight || isFoodDelivery);
  next();
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
