import { Injectable } from "@angular/core";
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent } from '@angular/common/http';

import { Observable, throwError } from "rxjs";
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router'

import { AuthenticationService } from "./services";


@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    constructor(
        public authService: AuthenticationService,
        private router: Router
        ) { }

    intercept(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any> > {
        let newRequest = originalRequest.clone();
        if (this.authService.getToken()) {
            newRequest = originalRequest.clone({headers: originalRequest.headers.set("Authorization", "Bearer " + this.authService.getToken()) });
        }
        return next.handle(newRequest).pipe(
            catchError(err => {
                if (err instanceof HttpErrorResponse) {
                    if (err.status === 401) {
                        this.authService.logout();
                    }
                }
                return throwError(err);
            })) as any;
    }
}