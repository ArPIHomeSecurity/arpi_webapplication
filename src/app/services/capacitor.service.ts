import { Injectable } from '@angular/core';

import { App } from '@capacitor/app';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CapacitorService {

  goBack = new Subject<void>();

  constructor() {
    console.log('CapacitorService');
    App.addListener('backButton', ({ canGoBack }) => {
      console.log('Pressed backButton');
      this.goBack.next();
      if (canGoBack) {
        window.history.back();
      }
    });
  }

  listenBackButton() {
    return this.goBack.asObservable();
  }
}
