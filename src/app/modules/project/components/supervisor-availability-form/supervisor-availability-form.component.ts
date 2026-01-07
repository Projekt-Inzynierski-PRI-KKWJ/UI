import { Component, OnInit, OnDestroy } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { SupervisorAvailability } from '../../models/supervisor-availability.model';
import { Supervisor } from 'src/app/modules/user/models/supervisor.model';
import { Store } from '@ngrx/store';
import { State } from 'src/app/app.state';
import { updateSupervisorAvailability, updateSupervisorAvailabilitySuccess } from '../../state/project.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Actions, ofType } from '@ngrx/effects';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-supervisor-availability-form',
  templateUrl: './supervisor-availability-form.component.html',
  styleUrls: ['./supervisor-availability-form.component.scss']
})
export class SupervisorAvailabilityFormComponent implements OnInit, OnDestroy{
  unsubscribe$ = new Subject();

  form = this.fb.group({
    availability: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private store: Store<State>,
    private activatedRoute: ActivatedRoute,
    private actions$: Actions,
    private _snackbar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
   this.activatedRoute.data.pipe(takeUntil(this.unsubscribe$)).subscribe(({availabilities}) => {
    availabilities.forEach((availability: SupervisorAvailability) => {
      this.availability.push(this.fb.group({
        supervisor: [availability.supervisor],
        assigned: [availability.assigned],
        max: [availability.max, [Validators.required]]
      }))
     }) 
   })
  }

  getErrorMessage(): string {
      return 'You must enter a value';
  }

  getFormControl(availability: AbstractControl): { supervisor: Supervisor, max: FormControl } {
    return {
      supervisor: availability.get('supervisor')?.value,
      max: availability.get('max') as FormControl
    }
  }

  onSubmit(): void {
    if(this.form.valid){
      let updatedSupervisorAvailability: SupervisorAvailability[] = [] 
      this.availability.controls.forEach((control: any) => {
        updatedSupervisorAvailability.push({
          supervisor: control.controls.supervisor.value,
          assigned: control.controls.assigned.value,
          max: control.controls.max.value
        })
      })

      this.store.dispatch(updateSupervisorAvailability({supervisorAvailability: updatedSupervisorAvailability}))
      this.actions$.pipe(ofType(updateSupervisorAvailabilitySuccess),takeUntil(this.unsubscribe$))
        .subscribe(() => {
          this._snackbar.open('Supervisors availability successfully updated', 'close', {
            panelClass: ['success-snackbar']});
          this.router.navigate([{outlets: {modal: null}}]);
        });
    }
  }

  navigateBack(){
    this.router.navigate([{outlets: {modal: null}}]);
  }

  get availability(): FormArray {
    return this.form.get('availability') as FormArray
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next(null);
    this.unsubscribe$.complete()
  }

}
