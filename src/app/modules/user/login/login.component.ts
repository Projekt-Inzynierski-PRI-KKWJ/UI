import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { State } from '../state/user.state';
import { isLogged} from '../state/user.selectors';
import { ActivatedRoute, Router } from '@angular/router';
import { accessTokenRefresh, accessTokenRefreshFailure, accessTokenRefreshSuccess, authenticate, authenticateFailure, authenticateSuccess, loadUser } from '../state/user.actions';
import { UserService } from '../user.service';
import { Actions, ofType } from '@ngrx/effects';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy{
  form = this.fb.group({
    login: ['', Validators.required],
    password: ['', Validators.required]
  });

  showForm: boolean = false;
  hide: boolean = true;
  unsubscribe$ = new Subject();

  constructor(
    private fb: FormBuilder,
    private store: Store<State>,
    private router: Router,
    private _snackbar: MatSnackBar,
    private actions$: Actions,
    private route: ActivatedRoute,
    private userService: UserService 
  ) {}

  ngOnInit(): void 
  {
      this.userService.checkInitializationStatus().subscribe(count => 
        {
    if (count === 0) 
      {
      this.router.navigateByUrl('/initialize-coordinator');
    } 
    else 
    {
      
    this.store.select(isLogged).pipe(takeUntil(this.unsubscribe$)).subscribe((isLogged: boolean) => {
      if (isLogged) 
      {
          this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('redirectTo')! ?? '/projects')
      } else 
      {
        this.store.dispatch(accessTokenRefresh())
      }
    });

    this.actions$.pipe(ofType(authenticateSuccess), takeUntil(this.unsubscribe$))
      .subscribe(() => this.store.dispatch(loadUser()));

    this.actions$.pipe(ofType(authenticateFailure), takeUntil(this.unsubscribe$),)
      .subscribe(() => this._snackbar.open('Authentication failed, invalid login or password', 'close'));

    this.actions$.pipe(ofType(accessTokenRefreshSuccess), takeUntil(this.unsubscribe$))
      .subscribe(() => this.store.dispatch(loadUser()));

    this.actions$.pipe(ofType(accessTokenRefreshFailure), takeUntil(this.unsubscribe$))
      .subscribe(() => this.showForm = true );
  }
  });
}
  onSubmit(): void {
    if (this.form.valid) {
      this.store.dispatch(authenticate({ login: this.form.controls.login.value!, password: this.form.controls.password.value! }))
    }
  }

  getErrorMessage(): string {
    return 'You must enter a value';
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }
}
