import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface GChatContact {
  id: string | null;
  name: string | null;
  nameFromWhatsApp: string | null;
  number: string | null;
  email: string | null;
  nickName: string | null;
  linkImage: string | null;
  hasInteraction: boolean;
  curChatId: string | null;
  curChatCollection: string[] | null;
  dhRegister: string;
  tags: TagApiModel[] | null;
  organizations: string[] | null;
  observation: string | null;
  onlyScriptEvent: boolean;
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
}
