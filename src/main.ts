import { enableProdMode, provideZoneChangeDetection } from "@angular/core"
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic"

import * as moment from "moment"
import { AppModule } from "./app/app.module"
import { PATH_PARSER } from "./app/utils"
import { environment } from "./environments/environment"

let locale = localStorage.getItem("localeId")
console.log("Selected language: ", locale)
if (locale === null) {
  locale = "en"
}

moment.locale(locale)

console.log("Current path: ", location.pathname)
const matches = PATH_PARSER.exec(location.pathname)

if (matches) {
  console.log("Path matches: ", matches)
  const newPath =
    "/" + [matches.groups.version, locale, matches.groups.path].filter(Boolean).join("/")
  if (newPath !== location.pathname) {
    console.log("Redirect to " + newPath)
    location.pathname = newPath
  } else {
    console.log("No need to redirect")
  }
} else {
  console.error("Path does not match", location.pathname)
}

if (environment.production) {
  enableProdMode()
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  applicationProviders: [provideZoneChangeDetection()]
})
