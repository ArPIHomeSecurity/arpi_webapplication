import { Inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';

import { Observable, throwError, of, fromEvent } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthenticationService, LoaderService } from './services';
import { AUTHENTICATION_SERVICE } from './tokens';
import { Router } from '@angular/router';


@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {

    backendUrl: string;

    constructor(
        @Inject(AUTHENTICATION_SERVICE) public authService: AuthenticationService,
        @Inject('LoaderService') public loaderService: LoaderService,
        private router: Router,
    ) {
        const backendScheme = localStorage.getItem('backend.scheme');
        const backendDomain = localStorage.getItem('backend.domain');
        const backendPort = localStorage.getItem('backend.port');

        if (backendScheme && backendDomain && backendPort) {
            this.backendUrl = backendScheme + '://' + backendDomain + ':' + backendPort;
        } else {
            this.backendUrl = '';
        }

        fromEvent(window, 'storage')
            .subscribe((event: StorageEvent) => 
            {
                if (event.key === 'backend.scheme' || event.key === 'backend.domain' || event.key === 'backend.port') {
                    const backendScheme = localStorage.getItem('backend.scheme');
                    const backendDomain = localStorage.getItem('backend.domain');
                    const backendPort = localStorage.getItem('backend.port');

                    if (backendScheme && backendDomain && backendPort) {
                        this.backendUrl = backendScheme + '://' + backendDomain + ':' + backendPort;
                    } else {
                        this.backendUrl = '';
                    }
                }
            })
    }

    intercept(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any> > {
        if (this.backendUrl == ''){
            console.warn('No URL configured for backend requests!', this.backendUrl);
            const locations = JSON.parse(localStorage.getItem('locations') || "[]");
            if (locations.length > 0) {
                this.router.navigate(['/backend-error']);
            }
            else {
                this.router.navigate(['/location/add']);
            }
            return throwError(() => new HttpErrorResponse({status: 0, statusText: 'No URL configured for backend requests!'}));
        }

        let newRequest = originalRequest.clone({url: this.backendUrl + originalRequest.url});
        if (this.authService.getToken()) {
            newRequest = originalRequest.clone({
                headers: originalRequest.headers.set('Authorization', 'Bearer ' + this.authService.getToken()),
                url: this.backendUrl + originalRequest.url
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
                            console.error('Error when calling backend service:', error);
                            return throwError(() => error);
                        } else if (error.status === 401) {
                            // Unauthorized => session expired
                            this.authService.logout();
                            console.error('Session expired! Redirecting to login page...');
                            return of(undefined);
                        } else if (error.status === 0 && error.statusText === 'Unknown Error') {
                            // No connection to the REST API
                            console.error('No connection to the security system! Status:', error.status, 'Message:', error.statusText);
                            return throwError(() => error);
                        } else if ((error.status === 502) || (error.status === 503)) {
                            // 502 - Bad Gateway
                            // 503 - Service unavailable
                            // Connection lost to the monitoring service
                            // this.loaderService.setMessage($localize`:@@message no connection:No connection to the security system!`);
                            // rethrow the error to be able to catch it and return a default value
                            console.warn('Backend service request failed! Status:', error.status, 'Message:', error.statusText);
                            return throwError(() => error);
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
