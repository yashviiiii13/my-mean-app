export type TransactionType = 'income' | 'expense';

export interface Transaction {
  _id: string;
  user: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: string;
  createdAt?: string;
}

export interface TransactionFilters {
  type?: TransactionType | '';
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number | null;
  amountMax?: number | null;
  sortBy?: 'date' | 'amount' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
}
