import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../../shared/layout/sidebar/sidebar.component';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  userName: string = 'Usuário';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const userProfile = this.authService.getCurrentUserProfile();
    if (userProfile) {
      this.userName = userProfile.name;
    }
  }
}
