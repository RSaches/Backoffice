import { Injectable } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  docData, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  DocumentData,
  getDocs,
  getDoc
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable, from, of, catchError, map, switchMap } from 'rxjs';

export interface Company {
  id?: string;
  cnpj: string;
  email: string;
  idGChat: string;
  nomeFantasia: string;
  nomeGChat: string;
  telefone: string;
  token: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface User {
  id?: string;
  nome: string;
  email: string;
  permissao: 'admin' | 'usuario' | 'visualizador';
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  constructor(
    private firestore: Firestore,
    private auth: Auth
  ) {}

  // Método para verificar se o usuário está autenticado
  private checkAuthentication(): Observable<boolean> {
    return from(this.auth.currentUser ? Promise.resolve(true) : Promise.resolve(false));
  }

  // Método para buscar empresas com verificação de autenticação
  getCompanies(): Observable<Company[]> {
    return this.checkAuthentication().pipe(
      switchMap(isAuthenticated => {
        if (!isAuthenticated) {
          console.error('Usuário não autenticado');
          return of([]);
        }
        
        const companiesRef = collection(this.firestore, 'companies');
        return from(getDocs(companiesRef)).pipe(
          map(snapshot => 
            snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            } as Company))
          ),
          catchError(error => {
            console.error('Erro ao buscar empresas:', error);
            return of([]);
          })
        );
      })
    );
  }

  // Métodos CRUD para empresas
  addCompany(company: Omit<Company, 'id'>): Promise<any> {
    const companiesRef = collection(this.firestore, 'companies');
    const companyWithTimestamps = {
      ...company,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    return addDoc(companiesRef, companyWithTimestamps);
  }

  updateCompany(company: Company) {
    if (!company.id) {
      throw new Error('Company ID is required for update');
    }
    const companyRef = doc(this.firestore, `companies/${company.id}`);
    return updateDoc(companyRef, {
      cnpj: company.cnpj,
      email: company.email,
      idGChat: company.idGChat,
      nomeFantasia: company.nomeFantasia,
      nomeGChat: company.nomeGChat,
      telefone: company.telefone,
      token: company.token,
      updatedAt: new Date()
    });
  }

  deleteCompany(companyId: string) {
    const companyRef = doc(this.firestore, `companies/${companyId}`);
    return deleteDoc(companyRef);
  }

  // Métodos de busca específicos
  getCompaniesByName(name: string): Observable<Company[]> {
    const companiesRef = collection(this.firestore, 'companies');
    const q = query(companiesRef, where('nomeFantasia', '==', name));
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Company))
      )
    );
  }

  // Métodos para usuários
  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    return from(getDocs(usersRef)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User))
      )
    );
  }

  getUserByEmail(email: string): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('email', '==', email));
    return from(getDocs(q)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User))
      )
    );
  }

  // Métodos genéricos para operações CRUD
  getCollection<T extends { id?: string }>(collectionName: string): Observable<T[]> {
    const collectionRef = collection(this.firestore, collectionName);
    return from(getDocs(collectionRef)).pipe(
      map(snapshot => 
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as T))
      )
    );
  }

  getDocumentById<T extends { id?: string }>(collectionName: string, documentId: string): Observable<T | undefined> {
    const documentRef = doc(this.firestore, `${collectionName}/${documentId}`);
    return from(getDoc(documentRef)).pipe(
      map(doc => doc.exists() ? { id: doc.id, ...doc.data() } as T : undefined)
    );
  }

  addDocument<T extends { id?: string }>(collectionName: string, data: Omit<T, 'id'>) {
    const collectionRef = collection(this.firestore, collectionName);
    return addDoc(collectionRef, data);
  }

  updateDocument<T extends { id?: string }>(collectionName: string, documentId: string, data: Partial<Omit<T, 'id'>>) {
    const documentRef = doc(this.firestore, `${collectionName}/${documentId}`);
    return updateDoc(documentRef, data);
  }

  deleteDocument(collectionName: string, documentId: string) {
    const documentRef = doc(this.firestore, `${collectionName}/${documentId}`);
    return deleteDoc(documentRef);
  }

  // Métodos específicos para Usuários
  addUser(user: Omit<User, 'id'>) {
    return this.addDocument<User>('users', user);
  }

  updateUser(user: User) {
    if (!user.id) {
      throw new Error('User ID is required for update');
    }
    return this.updateDocument<User>('users', user.id, {
      nome: user.nome,
      email: user.email,
      permissao: user.permissao
    });
  }

  deleteUser(userId: string) {
    return this.deleteDocument('users', userId);
  }
}
