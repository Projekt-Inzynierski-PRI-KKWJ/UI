import { Injectable } from '@angular/core';
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest } from '@angular/common/http';
import { first, mergeMap, Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';

@Injectable()
export class UserInterceptor implements HttpInterceptor {
    constructor(private store: Store<State>) { }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return this.store.select('user').pipe(
            first(),
            mergeMap(user => {
            // Załóżmy, że token jest w user.token
            const headersConfig: { [name: string]: string } = {
                'index-number': user.indexNumber,
                'study-year': user.actualYear,
                'lang': user.lang,
            };

            if (user.token) {
                headersConfig['Authorization'] = `Bearer ${user.token}`;
            }

            const modifiedReq = req.clone({
                setHeaders: headersConfig,
                withCredentials: true
            });
            return next.handle(modifiedReq);
            })
        );
    }

}