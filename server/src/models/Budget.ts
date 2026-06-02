import mongoose, { Schema, Document } from 'mongoose';

export interface IBudget extends Document {
  userId: mongoose.Types.ObjectId;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

const BudgetSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true },
  monthlyLimit: { type: Number, required: true, min: 1 },
  month: { type: Number, required: true, min: 1, max: 12 },
  year: { type: Number, required: true }
});

// Unique compound index: { userId, category, month, year }
BudgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.model<IBudget>('Budget', BudgetSchema);
