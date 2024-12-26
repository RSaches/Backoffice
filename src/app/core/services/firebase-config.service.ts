import { Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Storage } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseConfigService {
  private firebaseConfig = {
    apiKey: "AIzaSyClGi7sHK9kk5DSq9nAO1MBqSeeFDyekVQ",
    authDomain: "g-chat-8ac5a.firebaseapp.com",
    projectId: "g-chat-8ac5a",
    storageBucket: "g-chat-8ac5a.firebasestorage.app",
    messagingSenderId: "524510431816",
    appId: "1:524510431816:web:6bae73476c877aa92f667d",
    measurementId: "G-SYT740V7MK"
  };

  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private storage: Storage
  ) {}

  getFirebaseConfig() {
    return this.firebaseConfig;
  }

  // Métodos utilitários para operações comuns do Firebase podem ser adicionados aqui
  async getCurrentUser() {
    return this.auth.currentUser;
  }
}
