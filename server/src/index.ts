import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Routes
import * as authController from './controllers/authController';
import * as transactionController from './controllers/transactionController';
import * as analyticsController from './controllers/analyticsController';
import * as budgetController from './controllers/budgetController';
import * as splitController from './controllers/splitController';
import * as challengeController from './controllers/challengeController';
import * as userController from './controllers/userController';
import { authenticateToken } from './middleware/auth';
import transactionRoutes from './routes/transactionRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/transactions', transactionRoutes);
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI!)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Auth Routes
const authRouter = express.Router();
authRouter.post('/register', authController.register);
authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', authenticateToken, authController.getMe);
authRouter.put('/profile', authenticateToken, authController.updateProfile);

// User Routes
const userRouter = express.Router();
userRouter.use(authenticateToken);
userRouter.get('/search', userController.searchUsers);

// Transaction Routes
const transactionRouter = express.Router();
transactionRouter.use(authenticateToken);
transactionRouter.get('/', transactionController.getTransactions);
transactionRouter.post('/', transactionController.createTransaction);
transactionRouter.put('/:id', transactionController.updateTransaction);
transactionRouter.delete('/:id', transactionController.deleteTransaction);
transactionRouter.get('/export/csv', transactionController.exportCSV);

// Analytics Routes
const analyticsRouter = express.Router();
analyticsRouter.use(authenticateToken);
analyticsRouter.get('/summary', analyticsController.getSummary);
analyticsRouter.get('/stats', analyticsController.getStats);

// Budget Routes
const budgetRouter = express.Router();
budgetRouter.use(authenticateToken);
budgetRouter.get('/', budgetController.getBudgets);
budgetRouter.post('/', budgetController.createOrUpdateBudget);
budgetRouter.delete('/:id', budgetController.deleteBudget);

// Split Routes
const splitRouter = express.Router();
splitRouter.use(authenticateToken);
splitRouter.get('/', splitController.getSplits);
splitRouter.post('/', splitController.createSplit);
splitRouter.put('/:splitId/pay/:participantIndex', splitController.markParticipantPaid);
splitRouter.delete('/:id', splitController.deleteSplit);

// Challenge Routes
const challengeRouter = express.Router();
challengeRouter.use(authenticateToken);
challengeRouter.get('/', challengeController.getChallenges);
challengeRouter.post('/', challengeController.createChallenge);
challengeRouter.post('/:id/check-today', challengeController.checkDay);
challengeRouter.delete('/:id', challengeController.deleteChallenge);

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/splits', splitRouter);
app.use('/api/challenges', challengeRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
