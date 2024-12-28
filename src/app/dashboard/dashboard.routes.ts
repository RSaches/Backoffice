import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { SettingsComponent } from './pages/settings/settings.component';
import { ContactsComponent } from './pages/contacts/contacts.component';
import { ReportsComponent } from './pages/reports/reports.component';
import { AuthGuard } from '../core/guards/auth.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'settings', component: SettingsComponent },
      { path: 'contacts', component: ContactsComponent },
      { path: 'reports', component: ReportsComponent },
      { path: '', redirectTo: 'home', pathMatch: 'full' }
    ]
  }
];
