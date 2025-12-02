import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { State } from 'src/app/app.state';

@Injectable({
    providedIn: 'root'
})
export class SupervisorCoordinatorGuard implements CanActivate {
    constructor(private store: Store<State>, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
        return this.store.select('user').pipe(
            map(user => user.role === 'COORDINATOR' || user.role === 'SUPERVISOR'),
            tap(hasAccess => {
                if (!hasAccess) {
                    this.router.navigateByUrl('/projects');
                }
            })
        );
    }
}
