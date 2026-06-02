import mongoose, { Schema, Document } from 'mongoose';

export interface IChallenge extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description: string;
  type: 'no_food_delivery' | 'no_shopping' | 'under_daily_limit' | 'custom';
  dailyLimit: number;
  startDate: Date;
  completedDays: Date[];
  failedDays: Date[];
  isActive: boolean;
}

const ChallengeSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  type: {
    type: String,
    enum: ['no_food_delivery','no_shopping','under_daily_limit','custom'],
    required: true
  },
  dailyLimit: { type: Number, default: 0 },
  startDate: { type: Date, default: Date.now },
  completedDays: [{ type: Date }],
  failedDays: [{ type: Date }],
  isActive: { type: Boolean, default: true }
});

export default mongoose.model<IChallenge>('Challenge', ChallengeSchema);
