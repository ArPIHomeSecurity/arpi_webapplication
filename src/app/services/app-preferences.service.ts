import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

const APP_PREFERENCES_STORAGE_KEY = "appPreferences"
const DEFAULT_LONG_PRESS_ENABLED = true

export interface AppPreferences {
  longPressEnabled: boolean
}

@Injectable({
  providedIn: "root"
})
export class AppPreferencesService {
  private readonly preferencesSubject = new BehaviorSubject<AppPreferences>(this.load())

  readonly preferences$ = this.preferencesSubject.asObservable()

  get longPressEnabled(): boolean {
    return this.preferencesSubject.value.longPressEnabled
  }

  setLongPressEnabled(enabled: boolean): void {
    const preferences = {
      ...this.preferencesSubject.value,
      longPressEnabled: enabled
    }
    localStorage.setItem(APP_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences))
    this.preferencesSubject.next(preferences)
  }

  private load(): AppPreferences {
    try {
      const stored = JSON.parse(localStorage.getItem(APP_PREFERENCES_STORAGE_KEY) || "null")
      return {
        longPressEnabled: stored?.longPressEnabled ?? DEFAULT_LONG_PRESS_ENABLED
      }
    } catch {
      return { longPressEnabled: DEFAULT_LONG_PRESS_ENABLED }
    }
  }
}
