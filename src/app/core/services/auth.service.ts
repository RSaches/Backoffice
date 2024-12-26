import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, UserCredential } from '@angular/fire/auth';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, from, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

interface UserProfile {
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserProfile: UserProfile | null = null;

  constructor(
    private auth: Auth, 
    private firestore: Firestore,
    private router: Router
  ) {}

  login(email: string, password: string): Observable<boolean> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential: UserCredential) => {
        const uid = userCredential.user.uid;
        const userDocRef = doc(this.firestore, `users/${uid}`);
        
        return from(getDoc(userDocRef)).pipe(
          map((docSnap) => {
            if (docSnap.exists()) {
              this.currentUserProfile = docSnap.data() as UserProfile;
              this.router.navigate(['/dashboard/home']);
              return true;
            } else {
              throw new Error('Perfil do usuário não encontrado');
            }
          })
        );
      }),
      catchError((error) => {
        let errorMessage = 'Erro desconhecido. Tente novamente.';
        
        switch(error.code) {
          case 'auth/invalid-credential':
            errorMessage = 'Credenciais inválidas. Verifique seu e-mail e senha.';
            break;
          case 'auth/user-not-found':
            errorMessage = 'Usuário não encontrado.';
            break;
          case 'auth/wrong-password':
            errorMessage = 'Senha incorreta.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'E-mail inválido.';
            break;
          case 'auth/user-disabled':
            errorMessage = 'Esta conta foi desativada.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
            break;
        }

        console.error('Erro de login:', error);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  logout() {
    this.currentUserProfile = null;
    return this.auth.signOut().then(() => {
      this.router.navigate(['/login']);
    });
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  getCurrentUserProfile(): UserProfile | null {
    return this.currentUserProfile;
  }

  isAuthenticated(): boolean {
    return this.currentUserProfile !== null;
  }
}
