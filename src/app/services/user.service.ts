import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

const API_URL = 'http://localhost:5000/api/users';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  getProfile(): Observable<User> {
    return this.http.get<User>(`${API_URL}/me`);
  }

  updateProfile(data: { username: string }): Observable<User> {
    return this.http.put<User>(`${API_URL}/me`, data);
  }
}
