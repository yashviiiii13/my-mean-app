import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['../auth-shared.css'],
})
export class ForgotPasswordComponent {
  step: 'request' | 'reset' = 'request';

  email = '';
  otpCode = '';
  newPassword = '';
  confirmPassword = '';

  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  requestOtp() {
    this.error = '';
    this.success = '';
    if (!this.email) {
      this.error = 'Please enter your email';
      return;
    }

    this.loading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.step = 'reset';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Request failed';
      },
    });
  }

  resetPassword() {
    this.error = '';
    if (!this.otpCode || !this.newPassword || !this.confirmPassword) {
      this.error = 'Please fill in all fields';
      return;
    }
    if (this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.authService
      .resetPassword({ email: this.email, code: this.otpCode, newPassword: this.newPassword })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/signin']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Password reset failed';
        },
      });
  }

  resendOtp() {
    this.error = '';
    this.authService.resendOtp(this.email, 'forgot-password').subscribe({
      next: (res) => (this.success = res.message),
      error: (err) => (this.error = err.error?.message || 'Could not resend OTP'),
    });
  }
}
