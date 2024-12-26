import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChannelResponse, ApiErrorResponse } from '../interfaces/channel.interface';

@Injectable({
  providedIn: 'root'
})
export class ChannelService {
  private apiUrl = 'https://api.gsystem.chat/core/v2/api/channel';

  constructor(private http: HttpClient) {}

  getChannelInfo(token: string): Observable<ChannelResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'access-token': token
    });

    return this.http.get<ChannelResponse>(this.apiUrl, { headers });
  }
}
