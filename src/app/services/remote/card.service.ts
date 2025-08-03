import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Card } from '@app/models';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  constructor(private http: HttpClient) {}

  getCards(userId: number = null): Observable<Card[]> {
    if (userId) {
      return this.http.get<Card[]>('/api/cards', { params: { userId: userId.toString() } });
    }
    return this.http.get<Card[]>('/api/cards');
  }

  getCard(cardId: number): Observable<Card> {
    return this.http.get<Card>('/api/card/' + cardId);
  }

  updateCard(card: Card): Observable<Card> {
    return this.http.put<Card>('/api/card/' + card.id, card);
  }

  deleteCard(cardId: number): Observable<boolean> {
    // set sensor from api
    return this.http.delete<boolean>('/api/card/' + cardId);
  }
}
