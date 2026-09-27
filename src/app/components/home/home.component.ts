import { Component, OnInit } from '@angular/core';
import { TransactionService } from '../../services/transaction.service';
import { Transaction, TransactionFilters } from '../../models/transaction.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  // Add-transaction form state
  newType: 'income' | 'expense' = 'expense';
  newDescription = '';
  newAmount: number | null = null;
  addLoading = false;
  addError = '';
  addSuccess = '';

  // List state
  transactions: Transaction[] = [];
  totals = { income: 0, expense: 0, balance: 0 };
  pagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
  listLoading = false;
  listError = '';

  filters: TransactionFilters = {
    type: '',
    dateFrom: '',
    dateTo: '',
    amountMin: null,
    amountMax: null,
    sortBy: 'date',
    sortOrder: 'desc',
    page: 1,
    limit: 10,
  };

  constructor(private transactionService: TransactionService) {}

  ngOnInit(): void {
    this.loadTransactions();
  }

  addTransaction() {
    this.addError = '';
    this.addSuccess = '';

    if (!this.newDescription.trim()) {
      this.addError = 'Please enter a description';
      return;
    }
    if (!this.newAmount || this.newAmount <= 0) {
      this.addError = 'Please enter a valid amount';
      return;
    }

    this.addLoading = true;
    this.transactionService
      .create({
        type: this.newType,
        description: this.newDescription.trim(),
        amount: this.newAmount,
      })
      .subscribe({
        next: () => {
          this.addLoading = false;
          this.addSuccess = 'Transaction added';
          this.newDescription = '';
          this.newAmount = null;
          this.newType = 'expense';
          this.filters.page = 1;
          this.loadTransactions();
          setTimeout(() => (this.addSuccess = ''), 2500);
        },
        error: (err) => {
          this.addLoading = false;
          this.addError = err.error?.message || 'Failed to add transaction';
        },
      });
  }

  loadTransactions() {
    this.listLoading = true;
    this.listError = '';

    this.transactionService.list(this.filters).subscribe({
      next: (res) => {
        this.listLoading = false;
        this.transactions = res.transactions;
        this.pagination = res.pagination;
        this.totals = res.totals;
      },
      error: (err) => {
        this.listLoading = false;
        this.listError = err.error?.message || 'Failed to load transactions';
      },
    });
  }

  applyFilters() {
    this.filters.page = 1;
    this.loadTransactions();
  }

  clearFilters() {
    this.filters = {
      type: '',
      dateFrom: '',
      dateTo: '',
      amountMin: null,
      amountMax: null,
      sortBy: 'date',
      sortOrder: 'desc',
      page: 1,
      limit: 10,
    };
    this.loadTransactions();
  }

  changeSort(field: 'date' | 'amount' | 'type') {
    if (this.filters.sortBy === field) {
      this.filters.sortOrder = this.filters.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.filters.sortBy = field;
      this.filters.sortOrder = 'desc';
    }
    this.loadTransactions();
  }

  goToPage(page: number) {
    if (page < 1 || page > this.pagination.totalPages) return;
    this.filters.page = page;
    this.loadTransactions();
  }

  deleteTransaction(id: string) {
    if (!confirm('Delete this transaction?')) return;
    this.transactionService.delete(id).subscribe({
      next: () => this.loadTransactions(),
      error: (err) => (this.listError = err.error?.message || 'Failed to delete transaction'),
    });
  }

  get pageNumbers(): number[] {
    const total = this.pagination.totalPages;
    return Array.from({ length: total }, (_, i) => i + 1);
  }
}
