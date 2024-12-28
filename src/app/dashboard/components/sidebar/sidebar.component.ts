import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit {
  userName: string = '';

  constructor(private authService: AuthService) {}

  ngOnInit() {
    // Obter o nome do usuário logado
    this.userName = this.authService.getUserName() || 'Usuário';
  }

  logout() {
    this.authService.logout();
  }
}
