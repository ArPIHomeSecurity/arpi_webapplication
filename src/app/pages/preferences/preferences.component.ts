import { Component } from "@angular/core"

import { AppPreferencesService } from "@app/services"

@Component({
  selector: "app-preferences",
  templateUrl: "./preferences.component.html",
  styleUrls: ["./preferences.component.scss"],
  standalone: false
})
export class PreferencesComponent {
  longPressEnabled: boolean

  constructor(private appPreferencesService: AppPreferencesService) {
    this.longPressEnabled = this.appPreferencesService.longPressEnabled
  }

  onLongPressChanged(enabled: boolean): void {
    this.longPressEnabled = enabled
    this.appPreferencesService.setLongPressEnabled(enabled)
  }
}
