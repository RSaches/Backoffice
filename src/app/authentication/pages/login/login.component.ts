import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loginError: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    console.log('LoginComponent constructor called');
  }

  ngOnInit(): void {
    console.log('LoginComponent ngOnInit called');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    console.log('Login form submitted');
    this.loginError = null; // Limpa erro anterior

    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      console.log(`Attempting login with email: ${email}`);
      
      this.authService.login(email, password).subscribe({
        next: (success) => {
          console.log('Login successful');
          this.loginError = null;
        },
        error: (error) => {
          console.log('Login error:', error);
          this.loginError = error.message;
        }
      });
    } else {
      console.log('Login form is invalid');
    }
  }
}
