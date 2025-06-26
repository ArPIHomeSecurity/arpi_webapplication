import { Directive, HostListener, Output, EventEmitter, Input } from '@angular/core';

// Long press threshold in milliseconds
// disable long press for now
const PRESS_THRESHOLD = 1;

@Directive({
  selector: '[long-press-toggle]',
  standalone: true
})
export class LongPressToggleDirective {
  @Output() longPressAvailable = new EventEmitter<boolean>(); // Long press available
  @Output() longPressed = new EventEmitter<void>(); // Long press

  private startTimestamp: number;

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }
    this.startPress();
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }
    this.emitPress();
  }

  @HostListener('mouseleave', ['$event'])
  onMouseLeave(event: MouseEvent) {
    if (event.button !== 0) {
      return;
    }
    this.startTimestamp = null;
    this.longPressAvailable.emit(false);
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent) {
    this.startPress();
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent) {
    this.emitPress();
  }

  @HostListener('touchcancel', ['$event'])
  onTouchCancel(event: TouchEvent) {
    this.emitPress();
  }

  private startPress() {
    this.startTimestamp = Date.now();
    setTimeout(() => {
      if (this.startTimestamp && Date.now() - this.startTimestamp > PRESS_THRESHOLD) {
        this.longPressAvailable.emit(true);
      }
    }, PRESS_THRESHOLD);
  }

  private emitPress() {
    if (this.startTimestamp && Date.now() - this.startTimestamp > PRESS_THRESHOLD) {
      this.longPressed.emit();
    }
    this.startTimestamp = null;
    this.longPressAvailable.emit(false);
  }
}
