export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  color: string;
  icon?: string;
  initialBalance: number;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  type: TransactionType;
  amount: number;
  accountId: string; // Source account for expense/transfer, destination for income
  toAccountId?: string; // Destination account for transfer
  category: string;
  description: string;
  notes?: string;
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string; // YYYY-MM
}

export interface CategorySummary {
  category: string;
  amount: number;
  percentage: number;
  count: number;
  color: string;
}

export interface MonthlyRecap {
  month: string; // YYYY-MM
  monthName: string;
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  savingsRate: number; // percentage (0 - 100)
  
  // Breakdown by Account Type (pure spending & income)
  cashIncome: number;
  cashExpense: number;
  cashNet: number;

  bankIncome: number;
  bankExpense: number;
  bankNet: number;

  ewalletIncome: number;
  ewalletExpense: number;
  ewalletNet: number;

  // Transfers tracking
  cashTransferNet: number;
  bankTransferNet: number;
  ewalletTransferNet: number;

  // Transaction counts
  incomeCount: number;
  expenseCount: number;
  transferCount: number;

  // Breakdown by categories
  expenseCategories: CategorySummary[];
  incomeCategories: CategorySummary[];

  // Daily timeline
  dailyData: {
    day: number;
    date: string;
    income: number;
    expense: number;
    net: number;
  }[];
}
