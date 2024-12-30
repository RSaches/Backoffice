import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

export interface GChatContact {
  id: string;
  name: string | null;
  nameFromWhatsApp: string | null;
  number: string | null;
  nickName: string | null;
  linkImage: string | null;
  hasInteraction: boolean;
  onlyScriptEvent: boolean;
  dhRegister: string;
  tags: TagApiModel[] | null;
  organizations: string[] | null;
  genericAttributes: any[];
  fidelizations: {
    OrganizationId: string;
    Fidelized: boolean;
    SectorId: string;
    UserId: string;
    SendToSectorIfUserOffline: boolean;
  }[];
}

export interface TagApiModel {
  Id: string;
  OrganizationId: string;
  HexColor: string;
  Description: string;
}

export interface GChatErrorResponse {
  errorCode: string | null;
  msg: string | null;
  status: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GChatApiService {
  private apiUrl = 'https://api.gsystem.chat/core/v2/api/contacts';

  constructor(private http: HttpClient) {}

  getContacts(token: string): Observable<GChatContact[]> {
    const headers = new HttpHeaders({
      'access-token': token,
      'Content-Type': 'application/json'
    });

    const params = new HttpParams()
      .set('page', '1')
      .set('limit', '100');

    return this.http.get<GChatContact[]>(this.apiUrl, { 
      headers, 
      params 
    }).pipe(
      map(contacts => {
        // Filtrar contatos que tenham número
        return contacts.filter(contact => contact.number !== null);
      })
    );
  }

  // Verificar se o contato existe
  getContact(token: string, contactId: string): Observable<GChatContact> {
    if (!token || !contactId) {
      return throwError(new Error('Token e ID do contato são obrigatórios'));
    }

    const headers = new HttpHeaders({
      'access-token': token,
      'Content-Type': 'application/json'
    });

    return this.http.get<GChatContact>(`${this.apiUrl}/${contactId}`, { headers }).pipe(
      catchError(error => {
        if (error.status === 404 || error.status === 400) {
          throw new Error('Contato não encontrado');
        }
        throw error;
      })
    );
  }

  deleteContact(token: string, contactId: string): Observable<any> {
    if (!token || !contactId) {
      return throwError(new Error('Token e ID do contato são obrigatórios'));
    }

    const headers = new HttpHeaders({
      'access-token': token,
      'Content-Type': 'application/json'
    });

    // Primeiro verificar se o contato existe
    return this.getContact(token, contactId).pipe(
      switchMap(() => {
        return this.http.delete<GChatErrorResponse>(`${this.apiUrl}/${contactId}`, { 
          headers,
          observe: 'response'
        }).pipe(
          map(response => {
            if (response.status === 204 || response.status === 200) {
              return { success: true };
            }
            throw new Error(response.body?.msg || 'Falha ao excluir contato');
          })
        );
      }),
      catchError(error => {
        console.error('Erro ao excluir contato:', error);
        if (error.message === 'Contato não encontrado') {
          // Se o contato não existe, consideramos como uma exclusão bem-sucedida
          return of({ success: true, notFound: true });
        }
        return throwError(error);
      })
    );
  }
}
