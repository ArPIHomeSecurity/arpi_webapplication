import { Component } from "@angular/core"

import { AppPreferencesService } from "@app/services"
import { ThemeService } from "@app/services/theme.service"

@Component({
  selector: "app-preferences",
  templateUrl: "./preferences.component.html",
  styleUrls: ["./preferences.component.scss"],
  standalone: false
})
export class PreferencesComponent {
  longPressEnabled: boolean
  darkTheme: boolean
  currentLocale: string

  locales = [
    { name: "Magyar", id: "hu" },
    { name: "English", id: "en" },
    { name: "Italiano", id: "it" }
  ]

  constructor(
    private appPreferencesService: AppPreferencesService,
    private themeService: ThemeService
  ) {
    this.longPressEnabled = this.appPreferencesService.longPressEnabled
    this.darkTheme = this.themeService.load()
    this.currentLocale = localStorage.getItem("localeId") || "en"
  }

  onLongPressChanged(enabled: boolean): void {
    this.longPressEnabled = enabled
    this.appPreferencesService.setLongPressEnabled(enabled)
  }

  onLocaleSelected(event): void {
    localStorage.setItem("localeId", event.value)

    const pathParser = new RegExp(
      "^(?<version>/v\\d*-?[a-zA-Z]*)?/(?<language>[a-z]{2})/(?<path>.*)$"
    )
    const matches = pathParser.exec(window.location.pathname)
    if (matches !== null) {
      const newPath = [matches.groups.version, event.value, matches.groups.path].join("/")
      window.location.pathname = newPath
    }
  }

  onThemeSwitched(event): void {
    this.darkTheme = event.checked
    this.themeService.updateTheme(event.checked ? "argus-dark-theme" : "argus-light-theme")
  }
}
