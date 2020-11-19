import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


export interface LoaderService {
  status: BehaviorSubject<boolean>;
  message: BehaviorSubject<string>;

  display(value: boolean);

  setMessage(message: string);

  clearMessage();
}
