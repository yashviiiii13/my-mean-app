import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { User } from './models/user.model';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent {
  currentUser: User | null = null;

  constructor(public authService: AuthService, private router: Router) {
    this.authService.currentUser$.subscribe((user) => (this.currentUser = user));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/signin']);
  }
}
