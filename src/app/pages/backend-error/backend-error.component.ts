import { Component } from "@angular/core"

import { redirectTo } from "@app/utils"

@Component({
  selector: "app-backend-error",
  templateUrl: "./backend-error.component.html",
  styleUrl: "./backend-error.component.scss",
  standalone: false
})
export class BackendErrorComponent {
  reloadHome() {
    redirectTo("/")
  }
}
