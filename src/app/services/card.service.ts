import { Observable } from 'rxjs';

import { Card } from '@app/models';


export interface CardService {

  getCards(): Observable<Card[]>;

  getCard(cardId: number): Observable<Card>;

  updateCard(card: Card): Observable<Card>;

  deleteCard(cardId: number): Observable<boolean>;
}
