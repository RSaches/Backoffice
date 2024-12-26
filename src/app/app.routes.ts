import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/pages/login/login.component';
import { HomeComponent } from './dashboard/pages/home/home.component';
import { SettingsComponent } from './dashboard/pages/settings/settings.component';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '', 
    redirectTo: 'login', 
    pathMatch: 'full'
  },
  {
    path: 'login', 
    component: LoginComponent
  },
  {
    path: 'dashboard/home', 
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard/settings', 
    component: SettingsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: '**', 
    redirectTo: 'login',
    pathMatch: 'full'
  }
];
