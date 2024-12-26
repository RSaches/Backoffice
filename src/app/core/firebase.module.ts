import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getStorage, provideStorage } from '@angular/fire/storage';

import { FirebaseConfigService } from './services/firebase-config.service';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    provideFirebaseApp(() => initializeApp({
      apiKey: "AIzaSyClGi7sHK9kk5DSq9nAO1MBqSeeFDyekVQ",
      authDomain: "g-chat-8ac5a.firebaseapp.com",
      projectId: "g-chat-8ac5a",
      storageBucket: "g-chat-8ac5a.firebasestorage.app",
      messagingSenderId: "524510431816",
      appId: "1:524510431816:web:6bae73476c877aa92f667d",
      measurementId: "G-SYT740V7MK"
    })),
    provideFirestore(() => getFirestore()),
    provideAuth(() => getAuth()),
    provideStorage(() => getStorage())
  ],
  providers: [FirebaseConfigService]
})
export class FirebaseModule { }
