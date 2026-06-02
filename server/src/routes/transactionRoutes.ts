import express from 'express';
import {
  getTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  exportCSV
} from '../controllers/transactionController';

// FIX: 'auth' ki jagah 'authenticateToken' use karo
import { authenticateToken } from '../middleware/auth'; 

const router = express.Router();

// FIX: Yahan bhi 'authenticateToken' likho
router.use(authenticateToken);

router.get('/export/csv', exportCSV);
router.get('/', getTransactions);
router.post('/', createTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;