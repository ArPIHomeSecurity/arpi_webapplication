import { Inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';

import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthenticationService, LoaderService } from './services';
import { environment } from '@environments/environment';
import { AUTHENTICATION_SERVICE } from './tokens';


const BASE_URL = window.location.protocol + '//' + window.location.hostname + ':' + environment.apiPort;

@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    constructor(
        @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
        @Inject('LoaderService') public loaderService: LoaderService,
        private router: Router
        ) { }

    intercept(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any> > {
        let newRequest = originalRequest.clone({url: BASE_URL + originalRequest.url});
        if (this.authService.getToken()) {
            newRequest = originalRequest.clone({
                headers: originalRequest.headers.set('Authorization', 'Bearer ' + this.authService.getToken()),
                url: BASE_URL + originalRequest.url
            });
        }
        return next.handle(newRequest)
            .pipe(
                map((event: HttpEvent<any>) => {
                    if (event instanceof HttpResponse) {
                        const userToken = event.headers.get('User-Token');
                        if (userToken) {
                            this.authService.updateUserToken(userToken);
                        }
                    }
                    return event;
                }),
                catchError(error => {
                    if (error instanceof HttpErrorResponse) {
                        if (error.status === 400 || error.status === 403 || error.status === 500) {
                            // Bad request/unauthorized access/internal server error
                            return throwError(error);
                        } else if (error.status === 401) {
                            // Unauthorized => session expired
                            this.authService.logout();
                            return of(undefined);
                        } else if (error.status === 0 && error.statusText === 'Unknown Error') {
                            // No connection to the REST API
                            console.error('No connection to the security system');
                            return throwError(error);
                        } else if ((error.status === 502) || (error.status === 503)) {
                            // 502 - Bad Gateway
                            // 503 - Service unavailable
                            // Connection lost to the monitoring service
                            // this.loaderService.setMessage($localize`:@@message no connection:No connection to the security system!`);
                            // rethrow the error to be able to catch it and return a default value
                            console.warn('Backend service request failed!', error);
                            return throwError(error);
                        }
                    }

                    if (error.status === 404) {
                        return throwError(() => error);
                    }

                    console.error('Error when calling backend service:', error);
                    return of(undefined);
            })) as any;
    }
}
