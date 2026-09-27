import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['../auth-shared.css'],
})
export class SignupComponent {
  step: 'form' | 'otp' = 'form';

  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  otpCode = '';

  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  submitSignup() {
    this.error = '';
    this.success = '';

    if (!this.username || !this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.authService
      .signup({ username: this.username, email: this.email, password: this.password })
      .subscribe({
        next: (res) => {
          this.loading = false;
          this.success = res.message;
          this.step = 'otp';
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'Signup failed';
        },
      });
  }

  submitOtp() {
    this.error = '';
    if (!this.otpCode) {
      this.error = 'Please enter the OTP sent to your email';
      return;
    }

    this.loading = true;
    this.authService
      .verifySignupOtp({ email: this.email, code: this.otpCode })
      .subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.message || 'OTP verification failed';
        },
      });
  }

  resendOtp() {
    this.error = '';
    this.authService.resendOtp(this.email, 'signup').subscribe({
      next: (res) => (this.success = res.message),
      error: (err) => (this.error = err.error?.message || 'Could not resend OTP'),
    });
  }
}
