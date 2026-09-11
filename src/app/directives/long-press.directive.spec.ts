import { fakeAsync, tick } from "@angular/core/testing"

import { LongPressToggleDirective } from "./long-press.directive"

describe("LongPressToggleDirective", () => {
  let directive: LongPressToggleDirective

  beforeEach(() => {
    directive = new LongPressToggleDirective()
  })

  it("waits for a real long press before emitting availability", fakeAsync(() => {
    const availableSpy = jasmine.createSpy("available")
    const longPressedSpy = jasmine.createSpy("longPressed")

    directive.longPressAvailable.subscribe(availableSpy)
    directive.longPressed.subscribe(longPressedSpy)
    ;(directive as any).startPress()
    tick(1900)

    expect(availableSpy).not.toHaveBeenCalledWith(true)
    expect(longPressedSpy).not.toHaveBeenCalled()

    tick(100)

    expect(availableSpy).toHaveBeenCalledWith(true)
  }))

  it("emits the press action only on confirmed long press", fakeAsync(() => {
    const longPressedSpy = jasmine.createSpy("longPressed")
    directive.longPressed.subscribe(longPressedSpy)
    ;(directive as any).startPress()
    tick(2100)
    ;(directive as any).emitPress()

    expect(longPressedSpy).toHaveBeenCalledTimes(1)
  }))

  it("does not emit when long press is disabled", fakeAsync(() => {
    const longPressedSpy = jasmine.createSpy("longPressed")
    const pressedSpy = jasmine.createSpy("pressed")
    directive.longPressEnabled = false
    directive.longPressed.subscribe(longPressedSpy)
    directive.pressed.subscribe(pressedSpy)
    ;(directive as any).startPress()
    ;(directive as any).emitPress()

    expect(longPressedSpy).not.toHaveBeenCalled()
    expect(pressedSpy).toHaveBeenCalledTimes(1)
  }))

  it("clears a pending long press when the directive is destroyed", fakeAsync(() => {
    const availableSpy = jasmine.createSpy("available")
    directive.longPressAvailable.subscribe(availableSpy)
    ;(directive as any).startPress()
    directive.ngOnDestroy()
    tick(2100)

    expect(availableSpy).not.toHaveBeenCalledWith(true)
  }))
})
