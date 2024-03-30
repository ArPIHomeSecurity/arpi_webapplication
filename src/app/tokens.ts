import { InjectionToken } from "@angular/core";
import { AuthenticationService } from "./services";


export const AUTHENTICATION_SERVICE = new InjectionToken<AuthenticationService>("AuthenticationService");
