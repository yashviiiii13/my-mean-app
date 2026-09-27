import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Transaction,
  TransactionFilters,
  TransactionListResponse,
} from '../models/transaction.model';

const API_URL = 'http://localhost:5000/api/transactions';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  constructor(private http: HttpClient) {}

  create(data: { type: string; description: string; amount: number }): Observable<Transaction> {
    return this.http.post<Transaction>(API_URL, data);
  }

  list(filters: TransactionFilters): Observable<TransactionListResponse> {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<TransactionListResponse>(API_URL, { params });
  }

  delete(id: string): Observable<any> {
    return this.http.delete(`${API_URL}/${id}`);
  }

  update(id: string, data: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${API_URL}/${id}`, data);
  }
}
