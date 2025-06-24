import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-message',
    templateUrl: './message.component.html',
    styleUrl: './message.component.scss',
    standalone: false
})
export class MessageComponent {
  @Input() message: string;
  @Input() type: string;
}
