import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Card } from '../../models';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  constructor(
    private http: HttpClient
  ) { }

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>('/api/cards');
  }

  getCard(cardId: number): Observable<Card>{
    return this.http.get<Card>('/api/card/' + cardId);
  }
}
