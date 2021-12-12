import { Inject, Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { AuthenticationService } from 'src/app/services';
import { EventService, MonitoringService, UserService } from 'src/app/services/demo';
import { Card } from 'src/app/models';
import { CARDS } from 'src/app/demo/configuration';
import { getSessionValue, setSessionValue } from 'src/app/utils';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CardService {
  cards: Card[];

  constructor(
    @Inject('AuthenticationService') private authService: AuthenticationService,
    @Inject('EventService') private eventService: EventService,
    @Inject('MonitoringService') private monitoringService: MonitoringService,
    @Inject('UserService') private userService: UserService,
  ) {
    this.cards = getSessionValue('CardService.cards', CARDS);
  }

  getCards(): Observable<Card[]> {
    return of(Object.assign([], this.cards))
      .pipe(
        delay(environment.delay),
        map(_ => {
          this.authService.updateUserToken('user.session');
          return _;
        })
      );
  }

  getCard(cardId: number): Observable<Card>{
    return of(Object.assign({}, this.cards.find(c => c.id === cardId)));
  }

  updateCard(card: Card): Observable<Card>{
    this.cards[this.cards.findIndex(s => s.id === card.id)] = card;
    setSessionValue('CardService.cards', this.cards);
    return of(card);
  }

  deleteCard(cardId: number): Observable<boolean> {
    const cardIndex = this.cards.findIndex(c => c.id === cardId);
    const userIndex = this.userService.users.findIndex(u => u.id === this.cards[cardIndex].userId);
    if (userIndex !== -1) {
      this.userService.users[userIndex].hasCard = false;
      this.cards[cardIndex].userId = null;
      this.eventService.updateCardState();
      setSessionValue('UserService.users', this.userService.users);
      setSessionValue('CardService.cards', this.cards);
    }

    return of(true);
  }

  onCard(cardId: number) {
    const userIndex = this.userService.users.findIndex(u => u.registeringCards);
    if (userIndex !== -1) {
      this.registerCard(cardId, userIndex);
    }
    else if (this.cards[this.cards.findIndex(c => c.id === cardId)].userId !== null) {
      this.monitoringService.disarm();
    }

    return of(true);
  }

  registerCard(cardId: number, userIndex: number) {
    this.userService.users[userIndex].registeringCards = false;
    this.userService.users[userIndex].hasCard = true;
    this.cards[this.cards.findIndex(c => c.id === cardId)].userId = this.userService.users[userIndex].id;
    this.eventService.updateCardState();
    setSessionValue('UserService.users', this.userService.users);
    setSessionValue('CardService.cards', this.cards);
  }
}
