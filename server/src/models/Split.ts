import mongoose, { Schema, Document } from 'mongoose';

export interface ISplit extends Document {
  createdBy: mongoose.Types.ObjectId;
  title: string;
  totalAmount: number;
  type: 'owes_me' | 'i_owe';
  participants: {
    name: string;
    upiId: string;
    phone: string;
    amountOwed: number;
    isPaid: boolean;
    paidAt: Date | null;
  }[];
  isSettled: boolean;
  createdAt: Date;
}

const SplitSchema: Schema = new Schema({
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  type: { type: String, enum: ['owes_me', 'i_owe'], default: 'owes_me' },
  participants: [{
    name: { type: String, required: true },
    upiId: { type: String, default: '' },
    phone: { type: String, default: '' },
    amountOwed: { type: Number, required: true },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date, default: null }
  }],
  isSettled: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<ISplit>('Split', SplitSchema);
