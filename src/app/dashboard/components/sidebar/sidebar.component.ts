import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['src/app/dashboard/components/sidebar/sidebar.component.scss']
})
export class SidebarComponent {
  // Empty sidebar component
}
