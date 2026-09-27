import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileLoading = true;
  profileError = '';

  // Change password flow
  showChangePassword = false;
  step: 'form' | 'otp' = 'form';

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  otpCode = '';

  cpLoading = false;
  cpError = '';
  cpSuccess = '';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileLoading = false;
        this.authService.updateStoredUser(user);
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileError = err.error?.message || 'Failed to load profile';
      },
    });
  }

  openChangePassword() {
    this.showChangePassword = true;
    this.step = 'form';
    this.currentPassword = '';
    this.newPassword = '';
    this.confirmPassword = '';
    this.otpCode = '';
    this.cpError = '';
    this.cpSuccess = '';
  }

  cancelChangePassword() {
    this.showChangePassword = false;
  }

  requestChange() {
    this.cpError = '';
    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.cpError = 'Please fill in all fields';
      return;
    }
    if (this.newPassword.length < 6) {
      this.cpError = 'New password must be at least 6 characters';
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.cpError = 'New passwords do not match';
      return;
    }

    this.cpLoading = true;
    this.authService
      .requestChangePassword({
        currentPassword: this.currentPassword,
        newPassword: this.newPassword,
      })
      .subscribe({
        next: (res) => {
          this.cpLoading = false;
          this.cpSuccess = res.message;
          this.step = 'otp';
        },
        error: (err) => {
          this.cpLoading = false;
          this.cpError = err.error?.message || 'Request failed';
        },
      });
  }

  confirmChange() {
    this.cpError = '';
    if (!this.otpCode) {
      this.cpError = 'Please enter the OTP sent to your email';
      return;
    }

    this.cpLoading = true;
    this.authService.confirmChangePassword(this.otpCode).subscribe({
      next: () => {
        this.cpLoading = false;
        this.showChangePassword = false;
      },
      error: (err) => {
        this.cpLoading = false;
        this.cpError = err.error?.message || 'OTP verification failed';
      },
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
