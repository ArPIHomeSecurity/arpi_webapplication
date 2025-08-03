import { Component } from '@angular/core';

@Component({
  selector: 'app-backend-error',
  templateUrl: './backend-error.component.html',
  styleUrl: './backend-error.component.scss',
  standalone: false
})
export class BackendErrorComponent {
  reloadHome() {
    window.location.href = '/';
  }
}
