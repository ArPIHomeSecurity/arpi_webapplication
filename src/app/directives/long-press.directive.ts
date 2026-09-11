import { Directive, EventEmitter, HostListener, Input, OnDestroy, Output } from "@angular/core"

// Long press threshold in milliseconds.
const PRESS_THRESHOLD = 600

@Directive({
  selector: "[long-press-toggle]",
  standalone: true
})
export class LongPressToggleDirective implements OnDestroy {
  @Input() longPressEnabled = true
  @Output() longPressAvailable = new EventEmitter<boolean>() // Long press available
  @Output() longPressed = new EventEmitter<void>() // Long press
  @Output() pressed = new EventEmitter<void>() // Regular press when long press is disabled

  private longPressTimer: ReturnType<typeof setTimeout> | null = null
  private longPressTriggered = false

  @HostListener("mousedown", ["$event"])
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) {
      return
    }
    this.startPress()
  }

  @HostListener("mouseup", ["$event"])
  onMouseUp(event: MouseEvent) {
    if (event.button !== 0) {
      return
    }
    this.emitPress()
  }

  @HostListener("mouseleave")
  onMouseLeave() {
    this.resetPress()
  }

  @HostListener("touchstart", ["$event"])
  onTouchStart(event: TouchEvent) {
    event.preventDefault()
    this.startPress()
  }

  @HostListener("touchend", ["$event"])
  onTouchEnd(_event: TouchEvent) {
    this.emitPress()
  }

  @HostListener("touchcancel", ["$event"])
  onTouchCancel(_event: TouchEvent) {
    this.resetPress()
  }

  ngOnDestroy() {
    this.clearPressTimer()
  }

  private startPress() {
    this.clearPressTimer()
    this.longPressTriggered = false
    this.longPressAvailable.emit(false)

    if (!this.longPressEnabled) {
      return
    }

    this.longPressTimer = setTimeout(() => {
      if (!this.longPressEnabled) {
        return
      }
      this.longPressTriggered = true
      this.longPressAvailable.emit(true)
    }, PRESS_THRESHOLD)
  }

  private emitPress() {
    if (!this.longPressEnabled) {
      this.pressed.emit()
    } else if (this.longPressTriggered) {
      this.longPressed.emit()
    }
    this.resetPress()
  }

  private resetPress() {
    this.clearPressTimer()
    this.longPressTriggered = false
    this.longPressAvailable.emit(false)
  }

  private clearPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
  }
}
