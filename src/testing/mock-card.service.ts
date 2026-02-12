import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { Card } from '@app/models';

/**
 * Mock Card Service for testing
 */
@Injectable()
export class MockCardService {
  getCards(userId: number): Observable<Card[]> {
    return of([] as Card[]);
  }

  getCard(cardId: number): Observable<Card> {
    return of({ id: cardId } as Card);
  }

  updateCard(card: Card): Observable<Card> {
    return of(card);
  }

  deleteCard(cardId: number): Observable<boolean> {
    return of(true);
  }
}
