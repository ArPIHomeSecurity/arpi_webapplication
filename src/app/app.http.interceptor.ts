import { Inject, Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpErrorResponse, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';

import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Router } from '@angular/router';

import { AuthenticationService, LoaderService } from './services';


@Injectable()
export class AppHttpInterceptor implements HttpInterceptor {
    constructor(
        @Inject('AuthenticationService') public authService: AuthenticationService,
        @Inject('LoaderService') public loaderService: LoaderService,
        private router: Router
        ) { }

    intercept(originalRequest: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any> > {
        let newRequest = originalRequest.clone();
        if (this.authService.getToken()) {
            newRequest = originalRequest.clone(
                {headers: originalRequest.headers.set('Authorization', 'Bearer ' + this.authService.getToken()) }
            );
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
                        if (error.status === 401) {
                            this.authService.logout();
                            return of(undefined);
                        } else if (error.status === 0 && error.statusText === 'Unknown Error') {
                            this.loaderService.setMessage('no-connection');
                            return of(undefined);
                        }
                    }

                    console.error('Error when calling backend service:', error);
                    return throwError('Something wrong happened!');
            })) as any;
    }
}
