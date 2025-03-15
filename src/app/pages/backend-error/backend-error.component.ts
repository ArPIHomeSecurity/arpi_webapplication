import { Component } from '@angular/core';

@Component({
  selector: 'app-backend-error',
  templateUrl: './backend-error.component.html',
  styleUrl: './backend-error.component.scss'
})
export class BackendErrorComponent {

  reloadHome() {
    window.location.href = '/';
  }
}
