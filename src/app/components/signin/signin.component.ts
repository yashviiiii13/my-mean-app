import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.component.html',
  styleUrls: ['../auth-shared.css'],
})
export class SigninComponent {
  step: 'form' | 'otp' = 'form';

  email = '';
  password = '';
  otpCode = '';

  loading = false;
  error = '';
  success = '';

  constructor(private authService: AuthService, private router: Router) {}

  submitSignin() {
    this.error = '';
    this.success = '';

    if (!this.email || !this.password) {
      this.error = 'Please enter email and password';
      return;
    }

    this.loading = true;
    this.authService.signin({ email: this.email, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        this.success = res.message;
        this.step = 'otp';
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Sign in failed';
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
    this.authService.verifySigninOtp({ email: this.email, code: this.otpCode }).subscribe({
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
    this.authService.resendOtp(this.email, 'signin').subscribe({
      next: (res) => (this.success = res.message),
      error: (err) => (this.error = err.error?.message || 'Could not resend OTP'),
    });
  }
}
