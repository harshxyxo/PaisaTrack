export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  college?: string;
  upiId?: string;
  createdAt?: Date;
  lastLogin?: Date;
}

export interface ITransaction {
  _id?: string;
  userId: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  merchantName?: string;
  description?: string;
  date: Date;
  paymentMethod: 'upi' | 'cash' | 'card' | 'netbanking';
  isSplit: boolean;
  splitId?: string;
  isImpulsive: boolean;
  createdAt?: Date;
}

export interface IBudget {
  _id?: string;
  userId: string;
  category: string;
  monthlyLimit: number;
  month: number;
  year: number;
}

export interface IBudgetWithSpent extends IBudget {
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'exceeded';
}

export interface ISplit {
  _id?: string;
  createdBy: string;
  title: string;
  totalAmount: number;
  participants: {
    name: string;
    upiId?: string;
    phone?: string;
    amountOwed: number;
    isPaid: boolean;
    paidAt?: Date | null;
  }[];
  isSettled: boolean;
  createdAt?: Date;
}

export interface ISplitWithStatus extends ISplit {
  totalPaid: number;
  remaining: number;
}

export interface IChallenge {
  _id?: string;
  userId: string;
  name: string;
  description?: string;
  type: 'no_food_delivery' | 'no_shopping' | 'under_daily_limit' | 'custom';
  dailyLimit: number;
  startDate: Date;
  completedDays: Date[];
  failedDays: Date[];
  isActive: boolean;
}

export interface IAnalyticsSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  totalSaved: number;
  categoryBreakdown: {
    category: string;
    amount: number;
    percentage: number;
    color: string;
  }[];
  dailySpending: {
    date: string;
    amount: number;
  }[];
  guiltScore: number;
  guiltMessage: string;
  guiltLevel: 'monk' | 'decent' | 'worried' | 'disaster';
  insights: {
    type: 'warning' | 'success' | 'info';
    emoji: string;
    message: string;
  }[];
  topMerchants: {
    name: string;
    amount: number;
    count: number;
  }[];
  vsLastMonth: {
    totalChange: number;
    savedMore: boolean;
    lastMonthExpense: number;
    lastMonthIncome: number;
  };
}
