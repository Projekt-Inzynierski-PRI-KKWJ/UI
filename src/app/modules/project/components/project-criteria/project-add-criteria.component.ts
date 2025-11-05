import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Location } from '@angular/common';
import { Store } from '@ngrx/store';

import { ProjectCriteriaService } from '../../services/project-criterion.service';
import { CriteriaProjectDTO } from '../../models/project-criterion.model';
import { State } from 'src/app/app.state';

@Component({
  selector: 'project-add-criteria',
  templateUrl: './project-add-criteria.component.html',
  styleUrls: ['./project-add-criteria.component.scss']
})
export class ProjectAddCriteriaComponent implements OnInit, OnDestroy {
  projectCriteria!: FormGroup;
  projectId!: number;
  userId!: string; // zmienione na string
  indexNumber!: string;
  comingFromDetailsPage = false;
  private unsubscribe$ = new Subject<void>();

  semesters = ['FIRST', 'SECOND'];

  constructor(
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute,
    private criteriaService: ProjectCriteriaService,
    private snackBar: MatSnackBar,
    private location: Location,
    private store: Store<State>
  ) {
    this.projectCriteria = this.fb.group({
      criteriaList: this.fb.array([this.createCriteriaGroup()])
    });
  }

  ngOnInit(): void {
    this.activatedRoute.params.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.projectId = +params['id'];
    });

    this.activatedRoute.queryParams.pipe(takeUntil(this.unsubscribe$)).subscribe(params => {
      this.comingFromDetailsPage = params['comingFromDetailsPage'] === 'true';
    });
    
    // Pobieranie danych użytkownika ze store
    this.store.select('user').pipe(takeUntil(this.unsubscribe$)).subscribe(user => {
      if (user && user.indexNumber) {
        this.indexNumber = user.indexNumber;
        this.userId = user.indexNumber;
      }
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
  }

  get criteriaList(): FormArray {
    return this.projectCriteria.get('criteriaList') as FormArray;
  }

  get criteriaGroups(): FormGroup[] {
    return this.criteriaList.controls as FormGroup[];
  }

  createCriteriaGroup(): FormGroup {
    return this.fb.group({
      criterium: ['', Validators.required],
      levelOfRealization: ['IN_PROGRESS', [Validators.required]],
      semester: ['FIRST', Validators.required],
      type: ['EXPECTED', Validators.required],
      enableForModification: [true]
    });
  }

  addCriteria(): void {
    this.criteriaList.push(this.createCriteriaGroup());
  }

  removeCriteria(index: number): void {
    if (this.criteriaList.length > 1) {
      this.criteriaList.removeAt(index);
    }
  }

  getErrorMessage(controlName: string, group: FormGroup): string {
    const control = group.get(controlName);
    if (control?.hasError('required')) {
      return 'You must enter a value';
    }
    if (control?.hasError('min')) {
      return 'Must be at least 0';
    }
    return '';
  }

  onSubmit(): void {
    if (this.projectCriteria.valid && this.userId) {
      const payload: CriteriaProjectDTO[] = this.criteriaGroups.map(group => ({
        criterium: group.get('criterium')?.value,
        levelOfRealization: group.get('levelOfRealization')?.value,
        semester: group.get('semester')?.value,
        projectId: this.projectId,
        userId: +this.userId, // konwersja na number jeśli backend wymaga number
        enableForModification: group.get('enableForModification')?.value,
        type: group.get('type')?.value as 'REQUIRED' | 'EXPECTED' | 'MEASURABLE_IMPLEMENTATION_INDICATORS'
      }));

      console.log('Sending payload:', JSON.stringify(payload, null, 2));

      this.criteriaService.addCriteria(payload).subscribe({
        next: () => {
          this.snackBar.open('Criteria successfully submitted', 'Close', { duration: 3000 });
          this.navigateBack();
        },
        error: (err) => {
          console.error('Submission error:', err);
          this.snackBar.open('Error submitting criteria', 'Close', { duration: 3000 });
        }
      });
    } else if (!this.userId) {
      this.snackBar.open('User data not available', 'Close', { duration: 3000 });
    }
  }

  navigateBack(): void {
    this.location.back();
  }
}