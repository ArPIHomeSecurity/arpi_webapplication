import { Injectable } from '@angular/core';

import { App } from '@capacitor/app';
import { Subject } from 'rxjs';

export interface BackButtonEvent {
  canGoBack: boolean;
  preventDefault: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class CapacitorService {
  goBack = new Subject<BackButtonEvent>();

  constructor() {
    App.addListener('backButton', ({ canGoBack }) => {
      let defaultPrevented = false;
      this.goBack.next({
        canGoBack,
        preventDefault: () => {
          defaultPrevented = true;
        }
      });
      if (canGoBack && !defaultPrevented) {
        window.history.back();
      }
    });
  }

  listenBackButton() {
    return this.goBack.asObservable();
  }
}
