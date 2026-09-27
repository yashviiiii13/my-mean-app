import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

const API_URL = 'http://localhost:5000/api/auth';
const TOKEN_KEY = 'ft_token';
const USER_KEY = 'ft_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(this.getStoredUser());
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ---- Signup (2-step OTP) ----
  signup(data: { username: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${API_URL}/signup`, data);
  }

  verifySignupOtp(data: { email: string; code: string }): Observable<any> {
    return this.http
      .post<{ token: string; user: User }>(`${API_URL}/signup/verify-otp`, data)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  // ---- Signin (password + OTP) ----
  signin(data: { email: string; password: string }): Observable<any> {
    return this.http.post(`${API_URL}/signin`, data);
  }

  verifySigninOtp(data: { email: string; code: string }): Observable<any> {
    return this.http
      .post<{ token: string; user: User }>(`${API_URL}/signin/verify-otp`, data)
      .pipe(tap((res) => this.setSession(res.token, res.user)));
  }

  // ---- Forgot password ----
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${API_URL}/forgot-password`, { email });
  }

  resetPassword(data: { email: string; code: string; newPassword: string }): Observable<any> {
    return this.http.post(`${API_URL}/reset-password`, data);
  }

  // ---- Change password (logged in) ----
  requestChangePassword(data: { currentPassword: string; newPassword: string }): Observable<any> {
    return this.http.post(`${API_URL}/change-password/request`, data);
  }

  confirmChangePassword(code: string): Observable<any> {
    return this.http.post(`${API_URL}/change-password/confirm`, { code });
  }

  resendOtp(email: string, purpose: string): Observable<any> {
    return this.http.post(`${API_URL}/resend-otp`, { email, purpose });
  }

  // ---- Session helpers ----
  private setSession(token: string, user: User) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  updateStoredUser(user: User) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSubject.next(null);
  }
}
